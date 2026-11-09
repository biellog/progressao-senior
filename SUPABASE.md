# Configurar o Supabase

Siga estes passos uma vez. Depois disso, o app e o site passam a usar o banco novo sozinhos.

## 1. Criar o banco

1. Entre em https://supabase.com/dashboard e abra o projeto (ou crie um novo).
2. No menu da esquerda, abra **SQL Editor** → **New query**.
3. Copie **todo** o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql), cole e clique em **Run**.
   Deve aparecer "Success. No rows returned". Pode rodar de novo sem problema.

## 2. Criar as patrulhas

Ainda no **SQL Editor**, rode uma linha para cada patrulha:

```sql
select * from public.create_patrol('Lobo');
select * from public.create_patrol('Águia');
```

Cada linha devolve dois códigos:

| coluna | para quem |
|---|---|
| `member_code` | todo mundo da patrulha. Quem criar conta com ele entra como **membro**. |
| `monitor_code` | só o monitor (ou submonitor/chefe). Quem criar conta com ele entra como **monitor** e vê o painel da patrulha. |

Para ver os códigos de novo depois:

```sql
select name, member_code, monitor_code from public.patrols order by name;
```

## 3. Endereços de login

Em **Authentication** → **URL Configuration**:

- **Site URL:** `https://biellog.github.io/progressao-senior/`
- **Redirect URLs:** adicione `https://biellog.github.io/progressao-senior/`

Isso faz o link de "Esqueci minha senha" abrir o site certo, inclusive para quem usa o app Android.

## 4. Confirmação de e-mail (escolha sua)

Em **Authentication** → **Sign In / Providers** → **Email** há a opção **Confirm email**:

- **Ligada:** a pessoa precisa clicar no link do e-mail antes de entrar. O e-mail gratuito do Supabase manda poucas mensagens por hora, então num dia de cadastro da tropa inteira alguns e-mails podem atrasar.
- **Desligada:** a conta já entra direto depois do cadastro. O código da patrulha continua sendo obrigatório.

## 5. Ligar o app e o site ao banco

1. No Supabase, abra **Project Settings** → **API Keys** (em alguns painéis: **Settings** → **API**).
2. Copie o **Project URL** (algo como `https://abcdefgh.supabase.co`) e a chave pública: **anon** ou **publishable**.
   Nunca use a chave **service_role** ou **secret**.
3. No GitHub, abra o arquivo [`supabase/config.json`](supabase/config.json), clique no lápis (Edit) e preencha:

   ```json
   {
     "url": "https://abcdefgh.supabase.co",
     "anonKey": "cole-a-chave-aqui"
   }
   ```

4. Clique em **Commit changes**. O GitHub refaz o site e o APK sozinho, em cerca de 5 minutos. Acompanhe na aba **Actions**.

A chave pública pode ficar visível no repositório: quem protege os dados são as regras de acesso (RLS) criadas no passo 1.

## 6. Testar

1. Abra o site, toque em **Criar conta** e use o `monitor_code` da sua patrulha.
2. A aba **Patrulha** aparece na barra de baixo, com o painel do monitor e o código para convidar a galera.
3. Cada membro cria a conta com o `member_code`.

## Tarefas do dia a dia

| O que | Onde |
|---|---|
| Convidar alguém | Painel do monitor → **Compartilhar** (envia o código pelo WhatsApp) |
| Código vazou | Painel do monitor → **Gerar novo código** (quem já entrou continua) |
| Tirar alguém da patrulha | Painel do monitor → toque no nome → **Remover da patrulha** |
| Mudar de patrulha | Minha conta (botão com seu nome) → **Trocar de patrulha** |
| Renomear patrulha | SQL Editor: `update public.patrols set name = 'Novo nome' where name = 'Lobo';` |
| Apagar uma patrulha | SQL Editor: `delete from public.patrols where name = 'Lobo';` (os membros ficam sem patrulha e precisam de um código novo) |

## Projeto parado

Projetos gratuitos do Supabase pausam depois de 7 dias sem uso. O workflow **Manter Supabase ativo** (aba **Actions**) consulta o banco duas vezes por semana para evitar isso.
