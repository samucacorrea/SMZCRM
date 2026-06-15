# Deploy no EasyPanel

Este projeto sobe via `docker-compose.yml` e depende de Docker já disponível no host do EasyPanel.

## Visão geral

O compose sobe:

- `app` — aplicação Next.js
- `worker` — jobs BullMQ
- `postgres` — banco
- `redis` — filas e rate limit
- `minio` — storage S3 compatível

## Antes do deploy

Confirme que o repositório no GitHub está atualizado com:

- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `.env.example`

## Variáveis obrigatórias

Configure no EasyPanel, no mínimo:

```text
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
NEXT_PUBLIC_APP_URL=https://seu-dominio
BETTER_AUTH_URL=https://seu-dominio

POSTGRES_DB=nucleocrm
POSTGRES_USER=nucleocrm
POSTGRES_PASSWORD=<senha-forte>
DATABASE_URL=postgresql://nucleocrm:<senha-forte>@postgres:5432/nucleocrm

REDIS_PASSWORD=<senha-forte>
REDIS_URL=redis://:<senha-forte>@redis:6379

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<senha-forte>
MINIO_BUCKET=uploads
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=<senha-forte>
S3_FORCE_PATH_STYLE=true

BETTER_AUTH_SECRET=<segredo-forte-com-32+-chars>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ENCRYPTION_KEY=<chave-com-32+-chars>

RUN_MIGRATIONS=true
RUN_SEED=false
```

## Importante

Em produção:

- `RUN_SEED=false`
- `APP_HOST=0.0.0.0`
- `NEXT_PUBLIC_APP_URL` e `BETTER_AUTH_URL` devem apontar para o domínio final

## Fluxo recomendado

1. Conecte o repositório no EasyPanel.
2. Use o `docker-compose.yml` do projeto.
3. Preencha as variáveis de ambiente.
4. Faça o deploy.
5. Aguarde o serviço `app` ficar saudável.

## Healthcheck

O serviço `app` usa healthcheck interno em:

```text
http://127.0.0.1:3000/healthz
```

Resposta esperada:

```json
{"ok":true}
```

## Quando aparecer "Waiting for service ... to start..."

Esse sintoma normalmente significa que o container não ficou saudável.

Checklist:

1. Verifique se `APP_HOST=0.0.0.0`
2. Verifique se `NEXT_PUBLIC_APP_URL` e `BETTER_AUTH_URL` estão corretos
3. Verifique se `DATABASE_URL` usa o host `postgres`
4. Verifique se `REDIS_URL` usa o host `redis`
5. Verifique se `RUN_SEED=false` em produção
6. Abra os logs do serviço `app`

## Logs que indicam sucesso

Você deve ver algo próximo de:

```text
✓ Starting...
✓ Ready in ...
```

## Logs que merecem atenção

### Banco ou Redis

Erros como:

```text
ECONNREFUSED postgres
ENOTFOUND redis
```

indicam configuração incorreta de rede/hostname/variáveis.

### Aplicação presa sem ficar pronta

Se o healthcheck falhar, o EasyPanel pode ficar em loop com:

```text
Waiting for service crm_crm to start...
```

Nesse caso, revise primeiro:

- `APP_HOST=0.0.0.0`
- `PORT=3000` no compose
- logs do serviço `app`

## Pós-deploy

Depois do primeiro deploy:

1. acesse `/healthz`
2. teste `/login`
3. confirme login do admin real
4. crie um webhook e teste um POST
5. confira se lead e cliente aparecem no sistema

## Segurança mínima antes de produção real

- trocar todas as senhas padrão
- usar `BETTER_AUTH_SECRET` forte
- usar `ENCRYPTION_KEY` forte
- não deixar `.env` no GitHub
- não publicar `postgres` e `redis`
- manter `RUN_SEED=false`
