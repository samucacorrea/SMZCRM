# NúcleoCRM

CRM SaaS multi-tenant em Next.js 15 + TypeScript, com PostgreSQL, Drizzle, Better Auth, Redis/BullMQ e Docker.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- PostgreSQL 16
- Drizzle ORM
- Better Auth
- Redis + BullMQ
- Docker / Docker Compose

## Estrutura

```text
src/
  app/
  components/
  lib/
  modules/
drizzle/
docker/
```

## Requisitos

- Node.js 22+
- Docker + Docker Compose

## Desenvolvimento local

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

Para produção/EasyPanel, use como base:

```bash
cp .env.easypanel.example .env
```

2. Ajuste no `.env` pelo menos:

- `BETTER_AUTH_SECRET`
- `ENCRYPTION_KEY`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`

3. Suba a stack:

```bash
docker compose up --build
```

4. A aplicação sobe em:

```text
http://localhost:3000
```

Observação:

- no container de produção, o Next standalone precisa subir com bind em `0.0.0.0`
- isso já está coberto pelo `docker-compose.yml` via `HOSTNAME=${APP_HOST:-0.0.0.0}`

## Seed padrão

Com `RUN_SEED=true`, o projeto cria um tenant demo e um usuário inicial:

- E-mail: `admin@demo.nucleocrm.local`
- Senha: `Admin@123456`

Use isso apenas em ambiente local.

## Scripts úteis

```bash
npm run typecheck
npm run test
npm run build
npm run db:migrate
npm run db:seed
```

## Preparação para GitHub

Antes de subir:

1. Confirme que `.env` não está versionado.
2. Não suba `.next`, `node_modules`, logs nem arquivos `*.tsbuildinfo`.
3. Revise se não há segredos reais hardcoded no código ou em arquivos auxiliares.
4. Se usou dados de teste sensíveis, limpe antes do push.

Checklist rápido:

```bash
git status
git diff
```

## Deploy no EasyPanel

Fluxo recomendado:

1. Suba este repositório para o GitHub.
2. No EasyPanel, crie um `App Service` para o web app usando este repositório e o `Dockerfile`.
3. Crie um segundo `App Service` para o worker usando o mesmo repositório e o mesmo `Dockerfile`.
4. Crie serviços separados no EasyPanel para `Postgres`, `Redis` e `MinIO/S3`.
5. Configure todas as variáveis do painel usando `.env.easypanel.example` como base.
6. No web app, mantenha `SERVICE_MODE=app` e `RUN_MIGRATIONS=true`.
7. No worker, use `SERVICE_MODE=worker` e `RUN_MIGRATIONS=false`.
8. Em produção, desative seed:

```text
RUN_SEED=false
```

Também mantenha:

```text
APP_HOST=0.0.0.0
```

## Variáveis importantes em produção

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://seu-dominio`
- `BETTER_AUTH_URL=https://seu-dominio`
- `BETTER_AUTH_SECRET=<segredo forte>`
- `ENCRYPTION_KEY=<32+ chars>`
- `RUN_MIGRATIONS=true`
- `RUN_SEED=false`

## Observações de produção

- O `postgres` e `redis` não devem ser publicados externamente.
- O MinIO está configurado sem console público.
- O worker roda separado do app.
- As migrações rodam no `entrypoint` do serviço `app`.

## Próximo passo para subir

Se ainda não fez:

```bash
git add .
git commit -m "chore: prepare repository for deployment"
```

Depois, crie o repositório remoto e faça o push.
