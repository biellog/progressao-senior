# Configurar o Supabase

Siga estes passos uma vez. Depois disso, o app e o site passam a usar o banco novo sozinhos.

> **Já tinha rodado o `schema.sql` antes?** Rode o arquivo inteiro de novo (passo 1). Ele não apaga nada e
> acrescenta o que faltava: os três ramos (Escoteiro, Sênior e Pioneiro), os códigos de chefe, os envios de
> especialidades e insígnias com relatório, o armazenamento dos arquivos (bucket `relatorios`) e os avisos
> em tempo real. As patrulhas e contas que já existiam continuam como **Ramo Sênior**.

## 1. Criar o banco

1. Entre em https://supabase.com/dashboard e abra o projeto (ou crie um novo).
2. No menu da esquerda, abra **SQL Editor** → **New query**.
3. Copie **todo** o conteúdo do arquivo [`supabase/schema.sql`](supabase/schema.sql), cole e clique em **Run**.
   Deve aparecer "Success. No rows returned". Pode rodar de novo sem problema.

Confira depois de rodar:

- **Storage:** deve aparecer o bucket **relatorios** (privado). É onde ficam os PDFs e fotos dos relatórios.
- **Database → Publications → supabase_realtime:** a tabela **submissions** deve estar marcada. É ela que avisa o monitor na hora.

## 2. Códigos de chefe e patrulhas

### Códigos de chefe

O banco cria sozinho um **código de chefe para cada ramo**. Para ver, rode no **SQL Editor**:

```sql
select * from public.chief_codes;
```

Quem cria a conta em **Login de chefes** com esse código vira chefe daquele ramo: vê todas as patrulhas
do ramo, analisa os envios e cria patrulhas pelo próprio app. Passe o código só para os chefes.

Para trocar um código que vazou (quem já é chefe continua sendo):

```sql
update public.chief_codes set code = public.gen_chief_code() where ramo = 'senior';
```

### Patrulhas

O jeito mais fácil: o **chefe cria as patrulhas no app** (aba Tropa → *Patrulhas do ramo* → Criar) e já vê os códigos lá.

Também dá para criar pelo **SQL Editor**, dizendo o ramo (`escoteiro`, `senior` ou `pioneiro`):

```sql
select * from public.create_patrol('Lobo', 'senior');
select * from public.create_patrol('Touro', 'escoteiro');
select * from public.create_patrol('Equipe Alfa', 'pioneiro');
```

Cada patrulha tem dois códigos:

| código | para quem |
|---|---|
| `member_code` | todo mundo da patrulha. Quem criar conta com ele entra como **membro**. |
| `monitor_code` | só o monitor (no Pioneiro, o coordenador da equipe). Ele vê o painel da patrulha. |

O ramo da conta vem da patrulha. No cadastro, a pessoa escolhe o ramo na primeira tela e o app só aceita
o código de uma patrulha daquele ramo.

Para ver tudo de novo depois:

```sql
select ramo, name, member_code, monitor_code from public.patrols order by ramo, name;
```

Para mudar o ramo de uma patrulha que já existia (os membros acompanham):

```sql
update public.patrols  set ramo = 'escoteiro' where name = 'Lobo';
update public.profiles set ramo = 'escoteiro' where patrol_id = (select id from public.patrols where name = 'Lobo');
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

1. Abra o site, toque em **Login de chefes** → **Criar conta de chefe** e use o código de chefe do seu ramo.
2. Na aba **Tropa**, crie uma patrulha. Os códigos dela aparecem na hora.
3. Saia, escolha o ramo na primeira tela e crie uma conta com o `monitor_code`: a aba **Patrulha** aparece com o painel do monitor.
4. Cada membro escolhe o ramo e cria a conta com o `member_code`.

## Tarefas do dia a dia

| O que | Onde |
|---|---|
| Enviar especialidade ou insígnia | Aba **Especialidades** ou **Insígnias** → toque no item → anexe o relatório → **Enviar para o monitor** |
| Analisar envios (monitor) | Aba **Patrulha** → **Para analisar** → abra o envio → **Aprovar** ou **Devolver** (com comentário) |
| Receber avisos no aparelho | **Minha conta** → **Ativar avisos** (ou o aviso amarelo no painel do monitor) |
| Convidar alguém | Painel do monitor → **Compartilhar** (envia o código pelo WhatsApp) |
| Código vazou | Painel do monitor → **Gerar novo código** (quem já entrou continua) |
| Tirar alguém da patrulha | Painel do monitor → toque no nome → **Remover da patrulha** |
| Mudar de patrulha | Minha conta (botão com seu nome) → **Trocar de patrulha** |
| Renomear patrulha | SQL Editor: `update public.patrols set name = 'Novo nome' where name = 'Lobo';` |
| Apagar uma patrulha | SQL Editor: `delete from public.patrols where name = 'Lobo';` (os membros ficam sem patrulha e precisam de um código novo) |

## Espaço dos arquivos

O plano gratuito do Supabase tem 1 GB de armazenamento. Fotos grandes já são reduzidas antes do envio, e cada arquivo pode ter até 15 MB.
Para ver quanto já foi usado, abra **Storage** no painel.

## Avisos

- **Com o app ou o site abertos** (inclusive em segundo plano por pouco tempo), o monitor recebe o aviso na hora em que alguém envia, e o membro recebe quando o monitor aprova ou devolve.
- **Ao abrir o app** depois de um tempo fechado, aparece um aviso com o que chegou enquanto isso, e o número de pendentes fica na aba **Patrulha**.
- Avisos com o app **totalmente fechado** (push) precisam de uma conta no Firebase e ainda não estão configurados.

## Projeto parado

Projetos gratuitos do Supabase pausam depois de 7 dias sem uso. O workflow **Manter Supabase ativo** (aba **Actions**) consulta o banco duas vezes por semana para evitar isso.
