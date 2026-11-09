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
--    - o monitor lê o nome e a progressão de quem é da patrulha dele
--      (as notas continuam privadas);
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

-- O usuário logado é monitor da patrulha de p_user?
create or replace function public.is_monitor_of(p_user uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles them on them.patrol_id = me.patrol_id
    where me.user_id = auth.uid()
      and me.role = 'monitor'
      and me.patrol_id is not null
      and them.user_id = p_user
  )
$$;

-- ---------- Conta nova: cria o perfil a partir do código de patrulha ----------
-- O app envia full_name e patrol_code nos metadados do cadastro (signUp).
-- Sem um código válido, o cadastro é recusado.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_code   text := public.normalize_code(new.raw_user_meta_data ->> 'patrol_code');
  v_name   text := left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80);
  v_patrol public.patrols%rowtype;
  v_role   text;
begin
  select * into v_patrol from public.patrols
   where member_code = v_code or monitor_code = v_code;
  if not found then
    raise exception 'codigo_patrulha_invalido'
      using hint = 'Peça o código da patrulha ao seu monitor ou chefe.';
  end if;
  v_role := case when v_patrol.monitor_code = v_code then 'monitor' else 'membro' end;
  insert into public.profiles (user_id, full_name, patrol_id, role)
  values (new.id, v_name, v_patrol.id, v_role)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Funções chamadas pelo app (RPC) ----------

-- Antes do cadastro: confere o código e devolve o nome da patrulha e o papel
create or replace function public.check_patrol_code(p_code text)
returns table (patrol_name text, role text)
language sql stable security definer
set search_path = public
as $$
  select p.name,
         case when p.monitor_code = public.normalize_code(p_code) then 'monitor' else 'membro' end
  from public.patrols p
  where public.normalize_code(p_code) in (p.member_code, p.monitor_code)
$$;

-- Perfil de quem está logado, com o nome da patrulha
create or replace function public.get_my_profile()
returns table (user_id uuid, full_name text, role text, patrol_id uuid, patrol_name text)
language sql stable security definer
set search_path = public
as $$
  select pr.user_id, pr.full_name, pr.role, pr.patrol_id, pa.name
  from public.profiles pr
  left join public.patrols pa on pa.id = pr.patrol_id
  where pr.user_id = auth.uid()
$$;

-- Entrar em (ou trocar de) patrulha com um código
create or replace function public.join_patrol(p_code text)
returns table (patrol_name text, role text)
language plpgsql security definer
set search_path = public
as $$
declare
  v_code   text := public.normalize_code(p_code);
  v_patrol public.patrols%rowtype;
  v_role   text;
begin
  if auth.uid() is null then raise exception 'nao_autenticado'; end if;
  select * into v_patrol from public.patrols
   where member_code = v_code or monitor_code = v_code;
  if not found then raise exception 'codigo_patrulha_invalido'; end if;
  v_role := case when v_patrol.monitor_code = v_code then 'monitor' else 'membro' end;
  insert into public.profiles (user_id, patrol_id, role)
  values (auth.uid(), v_patrol.id, v_role)
  on conflict (user_id) do update set patrol_id = excluded.patrol_id, role = excluded.role;
  return query select v_patrol.name, v_role;
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

-- ---------- Só para quem administra (rodar no SQL Editor) ----------
-- Exemplo:  select * from public.create_patrol('Patrulha Lobo');
create or replace function public.create_patrol(p_name text)
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
  insert into public.patrols (name, member_code, monitor_code)
  values (trim(p_name), v_member, v_monitor);
  return query select trim(p_name), v_member, v_monitor;
end $$;

-- ---------- Permissões ----------

revoke all on function public.create_patrol(text)      from public, anon, authenticated;
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
grant select (id, name, created_at) on public.patrols to authenticated;

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
  using (id = public.my_patrol_id());

drop policy if exists "perfil: o próprio" on public.profiles;
create policy "perfil: o próprio" on public.profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "perfil: monitor vê a patrulha" on public.profiles;
create policy "perfil: monitor vê a patrulha" on public.profiles
  for select to authenticated
  using (public.is_monitor() and patrol_id = public.my_patrol_id());

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
