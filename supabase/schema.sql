-- =====================================================================
--  Progressão Ramo Sênior — banco de dados (Supabase)
--
--  Como usar: no painel do Supabase, abra "SQL Editor" → "New query",
--  cole este arquivo inteiro e clique em "Run". Pode rodar de novo sem
--  problema: ele só cria o que ainda não existe e atualiza as funções.
--
--  O que ele cria:
--    patrols          patrulhas, cada uma com um código para membros e
--                     outro código para o monitor
--    profiles         um perfil por conta: nome, patrulha e papel
--                     (membro ou monitor)
--    senior_progress  itens da progressão e especialidades marcados
--    senior_notes     bloco de notas pessoal
--
--  Regras de acesso (RLS):
--    - cada pessoa lê e altera só os próprios dados;
--    - o monitor lê o nome e a progressão de quem é da patrulha dele,
--      e o chefe, de quem é do ramo dele (as notas continuam privadas);
--    - ninguém muda o próprio papel ou patrulha sem um código válido.
-- =====================================================================

-- ---------- Tabelas ----------

create table if not exists public.patrols (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (length(trim(name)) between 1 and 60),
  member_code  text not null unique,
  monitor_code text not null unique,
  created_at   timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '' check (length(full_name) <= 80),
  patrol_id  uuid references public.patrols(id) on delete set null,
  role       text not null default 'membro' check (role in ('membro', 'monitor')),
  created_at timestamptz not null default now()
);
create index if not exists profiles_patrol_idx on public.profiles(patrol_id);

create table if not exists public.senior_progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('progressao', 'especialidade')),
  item_id    text not null check (length(item_id) <= 80),
  checked    boolean not null default false,
  item_date  date,
  notes      text check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, item_id)
);

create table if not exists public.senior_notes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  note_id    text not null check (length(note_id) <= 40),
  title      text check (length(title) <= 200),
  body       text check (length(body) <= 50000),
  updated_at timestamptz not null default now(),
  primary key (user_id, note_id)
);

-- ---------- Ramos e chefes ----------
-- Cada patrulha (ou equipe, no Ramo Pioneiro) pertence a um ramo, e o perfil herda o ramo dela.
-- Patrulhas criadas antes desta versão ficam como Ramo Sênior.
alter table public.patrols  add column if not exists ramo text not null default 'senior';
alter table public.profiles add column if not exists ramo text not null default 'senior';

alter table public.patrols  drop constraint if exists patrols_ramo_check;
alter table public.patrols  add  constraint patrols_ramo_check  check (ramo in ('escoteiro', 'senior', 'pioneiro'));
alter table public.profiles drop constraint if exists profiles_ramo_check;
alter table public.profiles add  constraint profiles_ramo_check check (ramo in ('escoteiro', 'senior', 'pioneiro'));
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add  constraint profiles_role_check check (role in ('membro', 'monitor', 'chefe'));
create index if not exists profiles_ramo_idx on public.profiles(ramo);

-- Um código de chefe por ramo. Quem cria a conta com ele vira chefe daquele ramo
-- e acompanha todas as patrulhas do ramo. Para ver os códigos, rode no SQL Editor:
--   select * from public.chief_codes;
create table if not exists public.chief_codes (
  ramo       text primary key check (ramo in ('escoteiro', 'senior', 'pioneiro')),
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Funções auxiliares ----------

-- Código aleatório de 6 caracteres, sem letras/números que se confundem (0/O, 1/I/L)
create or replace function public.gen_patrol_code()
returns text language plpgsql volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (
      select 1 from public.patrols where member_code = code or monitor_code = code
    );
  end loop;
  return code;
end $$;

-- Código de chefe: 8 caracteres (nunca coincide com os de patrulha, que têm 6)
create or replace function public.gen_chief_code()
returns text language plpgsql volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.chief_codes c where c.code = v_code);
  end loop;
  return v_code;
end $$;

-- Cria os códigos de chefe que ainda não existem (um por ramo)
insert into public.chief_codes (ramo, code)
select r, public.gen_chief_code() from unnest(array['escoteiro', 'senior', 'pioneiro']) as r
on conflict (ramo) do nothing;

-- Aceita o código digitado com espaços, traços ou minúsculas
create or replace function public.normalize_code(p text)
returns text language sql immutable
as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) $$;

create or replace function public.my_patrol_id()
returns uuid language sql stable security definer
set search_path = public
as $$ select patrol_id from public.profiles where user_id = auth.uid() $$;

create or replace function public.is_monitor()
returns boolean language sql stable security definer
set search_path = public
as $$
  select coalesce((select role = 'monitor' and patrol_id is not null
                   from public.profiles where user_id = auth.uid()), false)
$$;

create or replace function public.is_chief()
returns boolean language sql stable security definer
set search_path = public
as $$ select coalesce((select role = 'chefe' from public.profiles where user_id = auth.uid()), false) $$;

create or replace function public.my_ramo()
returns text language sql stable security definer
set search_path = public
as $$ select ramo from public.profiles where user_id = auth.uid() $$;

-- O usuário logado acompanha p_user? Vale para o monitor da patrulha dele
-- e para o chefe do ramo dele.
create or replace function public.is_monitor_of(p_user uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles them
      on (me.role = 'monitor' and me.patrol_id is not null and them.patrol_id = me.patrol_id)
      or (me.role = 'chefe' and them.ramo = me.ramo)
    where me.user_id = auth.uid()
      and them.user_id = p_user
  )
$$;

-- A que um código dá acesso: patrulha (como membro ou monitor) ou chefia de um ramo
create or replace function public.resolve_code(p_code text)
returns table (patrol_id uuid, patrol_name text, role text, ramo text)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.name,
         case when p.monitor_code = public.normalize_code(p_code) then 'monitor' else 'membro' end,
         p.ramo
  from public.patrols p
  where public.normalize_code(p_code) in (p.member_code, p.monitor_code)
  union all
  select null::uuid, null::text, 'chefe', c.ramo
  from public.chief_codes c
  where c.code = public.normalize_code(p_code)
$$;

-- ---------- Conta nova: cria o perfil a partir do código de patrulha ----------
-- O app envia full_name e patrol_code nos metadados do cadastro (signUp).
-- Sem um código válido, o cadastro é recusado.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_name text := left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80);
  v_res  record;
begin
  select * into v_res from public.resolve_code(new.raw_user_meta_data ->> 'patrol_code') limit 1;
  if not found then
    raise exception 'codigo_patrulha_invalido'
      using hint = 'Peça o código da patrulha ao seu monitor ou chefe.';
  end if;
  insert into public.profiles (user_id, full_name, patrol_id, role, ramo)
  values (new.id, v_name, v_res.patrol_id, v_res.role, v_res.ramo)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funções chamadas pelo app (RPC) ----------

-- Antes do cadastro: confere o código e devolve o nome da patrulha, o papel e o ramo
drop function if exists public.check_patrol_code(text);
create function public.check_patrol_code(p_code text)
returns table (patrol_name text, role text, ramo text)
language sql stable security definer
set search_path = public
as $$ select r.patrol_name, r.role, r.ramo from public.resolve_code(p_code) r limit 1 $$;

-- Perfil de quem está logado, com o nome da patrulha
drop function if exists public.get_my_profile();
create function public.get_my_profile()
returns table (user_id uuid, full_name text, role text, patrol_id uuid, patrol_name text, ramo text)
language sql stable security definer
set search_path = public
as $$
  select pr.user_id, pr.full_name, pr.role, pr.patrol_id, pa.name, pr.ramo
  from public.profiles pr
  left join public.patrols pa on pa.id = pr.patrol_id
  where pr.user_id = auth.uid()
$$;

-- Entrar em (ou trocar de) patrulha com um código. Com um código de chefe, a conta vira chefe do ramo.
drop function if exists public.join_patrol(text);
create function public.join_patrol(p_code text)
returns table (patrol_name text, role text, ramo text)
language plpgsql security definer
set search_path = public
as $$
declare v_res record;
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  select * into v_res from public.resolve_code(p_code) limit 1;
  if not found then raise exception 'codigo_patrulha_invalido'; end if;
  insert into public.profiles (user_id, patrol_id, role, ramo)
  values (auth.uid(), v_res.patrol_id, v_res.role, v_res.ramo)
  on conflict (user_id) do update
    set patrol_id = excluded.patrol_id, role = excluded.role, ramo = excluded.ramo;
  return query select v_res.patrol_name, v_res.role, v_res.ramo;
end $$;

create or replace function public.set_my_name(p_name text)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  update public.profiles set full_name = left(trim(coalesce(p_name, '')), 80)
   where user_id = auth.uid();
end $$;

-- Só para o monitor: códigos da patrulha
create or replace function public.get_patrol_codes()
returns table (patrol_name text, member_code text, monitor_code text)
language sql stable security definer
set search_path = public
as $$
  select p.name, p.member_code, p.monitor_code
  from public.patrols p
  where p.id = public.my_patrol_id() and public.is_monitor()
$$;

-- Só para o monitor: gera um código de membro novo (o antigo deixa de valer)
create or replace function public.regenerate_member_code()
returns text language plpgsql security definer
set search_path = public
as $$
declare v_code text;
begin
  if not public.is_monitor() then raise exception 'apenas_monitor'; end if;
  v_code := public.gen_patrol_code();
  update public.patrols set member_code = v_code where id = public.my_patrol_id();
  return v_code;
end $$;

-- Só para o monitor: tira alguém da patrulha (a pessoa precisa de um código para voltar)
create or replace function public.remove_patrol_member(p_user uuid)
returns void language plpgsql security definer
set search_path = public
as $$
begin
  if p_user = auth.uid() then raise exception 'nao_pode_remover_a_si_mesmo'; end if;
  if not public.is_monitor_of(p_user) then raise exception 'apenas_monitor'; end if;
  update public.profiles set patrol_id = null, role = 'membro' where user_id = p_user;
end $$;

-- Apaga a conta de quem está logado e todos os dados dela
create or replace function public.delete_my_account()
returns void language plpgsql security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- Só para o chefe: patrulhas do ramo dele, com os códigos
create or replace function public.get_ramo_patrols()
returns table (patrol_id uuid, patrol_name text, member_code text, monitor_code text)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.name, p.member_code, p.monitor_code
  from public.patrols p
  where public.is_chief() and p.ramo = public.my_ramo()
  order by p.name
$$;

-- ---------- Criar patrulhas ----------
-- Pelo SQL Editor (quem administra):
--   select * from public.create_patrol('Lobo', 'senior');      -- ramos: escoteiro, senior, pioneiro
-- Pelo app: o chefe cria patrulhas do próprio ramo no painel.
drop function if exists public.create_patrol(text);
create or replace function public.create_patrol(p_name text, p_ramo text default 'senior')
returns table (patrol_name text, member_code text, monitor_code text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_member  text := public.gen_patrol_code();
  v_monitor text;
begin
  -- garante que os dois códigos sejam diferentes
  loop
    v_monitor := public.gen_patrol_code();
    exit when v_monitor <> v_member;
  end loop;
  insert into public.patrols (name, member_code, monitor_code, ramo)
  values (trim(p_name), v_member, v_monitor, p_ramo);
  return query select trim(p_name), v_member, v_monitor;
end $$;

create or replace function public.chief_create_patrol(p_name text)
returns table (patrol_name text, member_code text, monitor_code text)
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_chief() then raise exception 'apenas_chefe'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'nome_obrigatorio'; end if;
  return query select * from public.create_patrol(p_name, public.my_ramo());
end $$;

-- ---------- Permissões ----------

revoke all on function public.create_patrol(text, text) from public, anon, authenticated;
revoke all on function public.gen_chief_code()         from public, anon, authenticated;
revoke all on function public.resolve_code(text)       from public, anon, authenticated;
revoke all on function public.get_ramo_patrols()       from public, anon;
revoke all on function public.chief_create_patrol(text) from public, anon;
grant execute on function public.get_ramo_patrols()        to authenticated;
grant execute on function public.chief_create_patrol(text) to authenticated;
revoke all on public.chief_codes from anon, authenticated;
alter table public.chief_codes enable row level security;
revoke all on function public.gen_patrol_code()        from public, anon, authenticated;
revoke all on function public.handle_new_user()        from public, anon, authenticated;

revoke all on function public.join_patrol(text)            from public, anon;
revoke all on function public.set_my_name(text)            from public, anon;
revoke all on function public.get_my_profile()             from public, anon;
revoke all on function public.get_patrol_codes()           from public, anon;
revoke all on function public.regenerate_member_code()     from public, anon;
revoke all on function public.remove_patrol_member(uuid)   from public, anon;
revoke all on function public.delete_my_account()          from public, anon;
grant execute on function public.join_patrol(text)          to authenticated;
grant execute on function public.set_my_name(text)          to authenticated;
grant execute on function public.get_my_profile()           to authenticated;
grant execute on function public.get_patrol_codes()         to authenticated;
grant execute on function public.regenerate_member_code()   to authenticated;
grant execute on function public.remove_patrol_member(uuid) to authenticated;
grant execute on function public.delete_my_account()        to authenticated;
grant execute on function public.check_patrol_code(text)    to anon, authenticated;

-- Os códigos nunca são lidos direto da tabela, só pelas funções acima
revoke all on public.patrols from anon, authenticated;
grant select (id, name, ramo, created_at) on public.patrols to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

revoke all on public.senior_progress from anon;
grant select, insert, update, delete on public.senior_progress to authenticated;

revoke all on public.senior_notes from anon;
grant select, insert, update, delete on public.senior_notes to authenticated;

-- ---------- Regras de acesso (RLS) ----------

alter table public.patrols         enable row level security;
alter table public.profiles        enable row level security;
alter table public.senior_progress enable row level security;
alter table public.senior_notes    enable row level security;

drop policy if exists "patrulha: membros veem a sua" on public.patrols;
create policy "patrulha: membros veem a sua" on public.patrols
  for select to authenticated
  using (id = public.my_patrol_id() or (public.is_chief() and ramo = public.my_ramo()));

drop policy if exists "perfil: o próprio" on public.profiles;
create policy "perfil: o próprio" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "perfil: monitor vê a patrulha" on public.profiles;
create policy "perfil: monitor vê a patrulha" on public.profiles
  for select to authenticated
  using (public.is_monitor() and patrol_id = public.my_patrol_id());

drop policy if exists "perfil: chefe vê o ramo" on public.profiles;
create policy "perfil: chefe vê o ramo" on public.profiles
  for select to authenticated
  using (public.is_chief() and ramo = public.my_ramo());

drop policy if exists "progresso: o próprio" on public.senior_progress;
create policy "progresso: o próprio" on public.senior_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "progresso: monitor vê a patrulha" on public.senior_progress;
create policy "progresso: monitor vê a patrulha" on public.senior_progress
  for select to authenticated
  using (public.is_monitor_of(user_id));

drop policy if exists "notas: as próprias" on public.senior_notes;
create policy "notas: as próprias" on public.senior_notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================================
--  Envio de especialidades e insígnias (com relatório) para o monitor
-- =====================================================================
--  Para marcar uma especialidade ou insígnia, a pessoa envia o relatório
--  (PDF, fotos ou outros arquivos). O envio fica "enviada" até o monitor
--  aprovar ou devolver com um comentário. Os arquivos ficam no Storage,
--  no bucket privado "relatorios", numa pasta com o id de quem enviou.

create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  patrol_id    uuid references public.patrols(id) on delete set null,
  kind         text not null check (kind in ('especialidade', 'insignia')),
  item_id      text not null check (length(item_id) <= 80),
  item_date    date,
  report       text check (length(report) <= 5000),
  files        jsonb not null default '[]'::jsonb,
  status       text not null default 'enviada' check (status in ('enviada', 'aprovada', 'devolvida')),
  review_note  text check (length(review_note) <= 2000),
  reviewed_by  uuid references auth.users(id) on delete set null,
  reviewed_at  timestamptz,
  submitted_at timestamptz not null default now(),
  unique (user_id, kind, item_id)
);
create index if not exists submissions_status_idx on public.submissions(status, submitted_at);

-- Enviar (ou reenviar) uma especialidade/insígnia. Exige pelo menos 1 arquivo.
-- p_files: [{"path":"<user_id>/...","name":"relatorio.pdf","size":12345,"type":"application/pdf"}]
create or replace function public.submit_item(
  p_kind text, p_item_id text, p_item_date date, p_report text, p_files jsonb
)
returns public.submissions
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_file jsonb;
  v_row  public.submissions;
begin
  if v_uid is null then raise exception 'nao_autenticado'; end if;
  if p_kind not in ('especialidade', 'insignia') then raise exception 'tipo_invalido'; end if;
  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) = 0 then
    raise exception 'relatorio_obrigatorio';
  end if;
  if jsonb_array_length(p_files) > 10 then raise exception 'arquivos_demais'; end if;
  for v_file in select * from jsonb_array_elements(p_files) loop
    if coalesce(v_file ->> 'path', '') not like v_uid::text || '/%' then
      raise exception 'arquivo_invalido';
    end if;
  end loop;

  insert into public.submissions as s
    (user_id, patrol_id, kind, item_id, item_date, report, files, status,
     review_note, reviewed_by, reviewed_at, submitted_at)
  values
    (v_uid, public.my_patrol_id(), p_kind, left(p_item_id, 80), p_item_date,
     left(nullif(trim(coalesce(p_report, '')), ''), 5000), p_files, 'enviada',
     null, null, null, now())
  on conflict (user_id, kind, item_id) do update set
    patrol_id = excluded.patrol_id, item_date = excluded.item_date, report = excluded.report,
    files = excluded.files, status = 'enviada', review_note = null,
    reviewed_by = null, reviewed_at = null, submitted_at = now()
  returning * into v_row;
  return v_row;
end $$;

-- Monitor aprova ou devolve (devolver exige comentário)
create or replace function public.review_submission(p_id uuid, p_approve boolean, p_note text)
returns public.submissions
language plpgsql security definer
set search_path = public
as $$
declare v_row public.submissions;
begin
  select * into v_row from public.submissions where id = p_id;
  if not found then raise exception 'envio_nao_encontrado'; end if;
  if not public.is_monitor_of(v_row.user_id) then raise exception 'apenas_monitor'; end if;
  if not p_approve and length(trim(coalesce(p_note, ''))) = 0 then
    raise exception 'comentario_obrigatorio';
  end if;
  update public.submissions set
    status = case when p_approve then 'aprovada' else 'devolvida' end,
    review_note = left(nullif(trim(coalesce(p_note, '')), ''), 2000),
    reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_id
  returning * into v_row;
  return v_row;
end $$;

-- Quem enviou pode cancelar enquanto não foi aprovado. Devolve a lista de arquivos para apagar.
create or replace function public.cancel_submission(p_kind text, p_item_id text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_files jsonb;
begin
  delete from public.submissions
   where user_id = auth.uid() and kind = p_kind and item_id = p_item_id and status <> 'aprovada'
  returning files into v_files;
  return coalesce(v_files, '[]'::jsonb);
end $$;

-- Quem está logado acompanha o dono da pasta? (a pasta é o id do usuário, em texto)
create or replace function public.is_monitor_of_folder(p_folder text)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles them
      on (me.role = 'monitor' and me.patrol_id is not null and them.patrol_id = me.patrol_id)
      or (me.role = 'chefe' and them.ramo = me.ramo)
    where me.user_id = auth.uid()
      and them.user_id::text = p_folder
  )
$$;

revoke all on function public.submit_item(text, text, date, text, jsonb)  from public, anon;
revoke all on function public.review_submission(uuid, boolean, text)       from public, anon;
revoke all on function public.cancel_submission(text, text)                from public, anon;
revoke all on function public.is_monitor_of_folder(text)                   from public, anon;
grant execute on function public.submit_item(text, text, date, text, jsonb) to authenticated;
grant execute on function public.review_submission(uuid, boolean, text)     to authenticated;
grant execute on function public.cancel_submission(text, text)              to authenticated;
grant execute on function public.is_monitor_of_folder(text)                 to authenticated;

revoke all on public.submissions from anon, authenticated;
grant select on public.submissions to authenticated;   -- alterações só pelas funções acima

alter table public.submissions enable row level security;

drop policy if exists "envios: os próprios e os da patrulha (monitor)" on public.submissions;
create policy "envios: os próprios e os da patrulha (monitor)" on public.submissions
  for select to authenticated
  using (user_id = auth.uid() or public.is_monitor_of(user_id));

-- Avisos em tempo real (o monitor recebe na hora quando chega um envio)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submissions') then
    alter publication supabase_realtime add table public.submissions;
  end if;
end $$;

-- ---------- Arquivos (Storage) ----------
-- Bucket privado, até 15 MB por arquivo
insert into storage.buckets (id, name, public, file_size_limit)
values ('relatorios', 'relatorios', false, 15728640)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "relatorios: enviar na própria pasta" on storage.objects;
create policy "relatorios: enviar na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "relatorios: ver os próprios e os da patrulha (monitor)" on storage.objects;
create policy "relatorios: ver os próprios e os da patrulha (monitor)" on storage.objects
  for select to authenticated
  using (bucket_id = 'relatorios' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_monitor_of_folder((storage.foldername(name))[1])
  ));

drop policy if exists "relatorios: apagar os próprios" on storage.objects;
create policy "relatorios: apagar os próprios" on storage.objects
  for delete to authenticated
  using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);
