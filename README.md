# Progressão Escoteira — Ramos Escoteiro, Sênior e Pioneiro

Checklist da Progressão Pessoal dos Ramos Escoteiro, Sênior e Pioneiro (Escoteiros do Brasil). Cada pessoa escolhe o ramo, entra com a própria conta e o código da sua patrulha. O monitor tem um painel com a progressão da patrulha, e o chefe, de todas as patrulhas do ramo.

- **Site:** https://biellog.github.io/progressao-senior/
- **App Android:** baixe o `progressao-senior.apk` mais recente em [Releases](../../releases/latest)
- **Configurar o banco (Supabase):** veja [SUPABASE.md](SUPABASE.md)

## Duas versões, um código só

O site e o app são gerados a partir da mesma pasta `src/`. O que muda entre eles fica em pastas separadas, então mexer em uma versão não quebra a outra.

```
src/                 código compartilhado (telas, estilos, lógica, conteúdo)
  index.html
  css/app.css        visual
  js/data.js             conteúdo do Ramo Sênior
  js/data-escoteiro.js   conteúdo do Ramo Escoteiro
  js/data-pioneiro.js    conteúdo do Ramo Pioneiro
  js/ramos.js            os três ramos: etapas, nomes e cores
  js/app.js          lógica: login, progresso, notas, painel do monitor
web/                 só da versão web: service worker (offline), manifest, SEO
android/             só do app Android (Capacitor)
supabase/
  schema.sql         tabelas, funções e regras de acesso — rode no Supabase
  config.json        endereço e chave pública do Supabase (usado pelas duas versões)
scripts/build.mjs    monta dist/web e dist/app a partir de src/
```

| | Versão web | Versão app |
|---|---|---|
| Gerada em | `dist/web` | `dist/app` → `android/` |
| Publicada por | workflow **Site (versão web)** → GitHub Pages | workflow **App Android (APK)** → Releases |
| Roda quando muda | `src/`, `web/`, `supabase/config.json` | `src/`, `android/`, `supabase/config.json` |
| Funciona offline | sim (service worker) | sim (arquivos dentro do app) |
| Login salvo | no navegador | no aparelho |

## Rodar no computador

```bash
npm ci
npm run serve:web      # abre a versão web em http://localhost:8080
npm run build:app      # prepara o app e copia para android/
```

## O que o app faz

- **Três ramos:** a primeira tela pergunta o ramo (Escoteiro, Sênior ou Pioneiro). Cada um tem a sua progressão, especialidades, insígnias, etapas e cores.
- **Login obrigatório:** para criar a conta é preciso o código da patrulha. O código de monitor dá acesso ao painel.
- **Login de chefes:** com o código de chefe do ramo, o chefe acompanha todas as patrulhas, analisa os envios e cria patrulhas.
- **Progressão:** eixos, blocos, ações fixas/variáveis/OU, etapas Escalada → Conquista → Azimute → Escoteiro da Pátria.
- **Especialidades e Insígnias** (cada uma na sua aba): para marcar, a pessoa envia o **relatório** (PDF, fotos ou outros arquivos). O monitor recebe um **aviso**, analisa e **aprova** ou **devolve** com comentário.
- Gráfico de **evolução**, **notas** pessoais e **PDF** com o resumo.
- **Painel do monitor:** caixa **Para analisar** com os envios da patrulha, contador na aba e avisos no aparelho; membros da patrulha com etapa, blocos, especialidades e última atividade; detalhe bloco a bloco de cada um; código de convite (copiar, compartilhar, gerar novo); remover alguém da patrulha.
- **Privacidade:** o monitor vê a progressão da patrulha, mas as notas de cada um são privadas. A pessoa pode excluir a própria conta e todos os dados em **Minha conta**.
