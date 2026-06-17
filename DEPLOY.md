# Deploy no EasyPanel

## Conclusão prática

Este projeto **não deve ser tratado no EasyPanel como um único serviço esperando que o `docker-compose.yml` orquestre tudo internamente**.

O caminho alinhado com a documentação oficial do EasyPanel é:

1. **1 App Service** para o web app
2. **1 App Service** separado para o worker
3. **1 Postgres Service**
4. **1 Redis Service**
5. **1 serviço de storage** separado para MinIO/S3

## Por que esse é o caminho correto

Pela documentação oficial do EasyPanel:

- se o repositório tem `Dockerfile`, o **App Service** usa esse `Dockerfile` para buildar a imagem
- as variáveis de ambiente ficam disponíveis **em build-time e run-time**
- o **proxy port** precisa apontar para a porta em que a app realmente escuta
- os logs do serviço ficam no **Logs stream**
- o terminal do container fica no **Console / Launcher**

Além disso, a própria seção de serviços mostra que o **Compose Service** ainda está sem documentação detalhada pública, enquanto `App Service`, `Postgres Service` e `Redis Service` estão documentados.

## Arquitetura recomendada no EasyPanel

### Serviço 1: `crm-web`

- tipo: `App Service`
- source: GitHub repo
- builder: `Dockerfile`
- domínio: `https://seu-dominio`
- proxy port: `3000`
- variáveis:
  - `SERVICE_MODE=app`
  - `RUN_MIGRATIONS=true`
  - `RUN_SEED=false`

### Serviço 2: `crm-worker`

- tipo: `App Service`
- source: mesmo GitHub repo
- builder: `Dockerfile`
- sem domínio público
- variáveis:
  - `SERVICE_MODE=worker`
  - `RUN_MIGRATIONS=false`
  - `RUN_SEED=false`

### Serviço 3: `postgres`

- tipo: `Postgres Service`
- use o host/usuário/senha gerados pelo EasyPanel

### Serviço 4: `redis`

- tipo: `Redis Service`
- use o host/senha gerados pelo EasyPanel

### Serviço 5: `minio` ou storage compatível S3

- use host interno do serviço no `S3_ENDPOINT`

## Variáveis obrigatórias do `crm-web`

Use [`.env.easypanel.example`](/Users/user/Documents/Pessoal/CRM/.env.easypanel.example) como base.

Campos críticos:

```text
NODE_ENV=production
APP_PORT=3000
APP_HOST=0.0.0.0
NEXT_PUBLIC_APP_URL=https://$(PRIMARY_DOMAIN)
BETTER_AUTH_URL=https://$(PRIMARY_DOMAIN)
SERVICE_MODE=app

DATABASE_URL=postgresql://USUARIO:SENHA@HOST_INTERNO_POSTGRES:5432/NOME_DO_BANCO
REDIS_URL=redis://:SENHA@HOST_INTERNO_REDIS:6379

S3_ENDPOINT=http://HOST_INTERNO_MINIO:9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

BETTER_AUTH_SECRET=...  # mínimo 32 caracteres
ENCRYPTION_KEY=...      # mínimo 32 caracteres

RUN_MIGRATIONS=true
RUN_SEED=false
```

## Variáveis do `crm-worker`

As mesmas variáveis de conexão do web app, mudando:

```text
SERVICE_MODE=worker
RUN_MIGRATIONS=false
RUN_SEED=false
```

## O que não fazer no EasyPanel App Service

- não presumir que o host do banco é `postgres` a menos que esse seja realmente o hostname interno do serviço
- não presumir que o host do Redis é `redis` a menos que esse seja realmente o hostname interno do serviço
- não usar `docker-compose.yml` como se o EasyPanel App Service fosse levantar toda a stack por você
- não deixar `BETTER_AUTH_SECRET` com menos de 32 caracteres
- não usar senha com `@` na URL sem escapar como `%40`

## Diagnóstico oficial

### Logs

O EasyPanel documenta que os logs aparecem no stream do serviço. Use isso no:

- `crm-web` para erros HTTP / auth / DB
- `crm-worker` para jobs / filas

### Console

Use o `Console` / `Launcher` do serviço `crm-web` para validar:

```sh
printenv | sort
wget -qO- http://127.0.0.1:3000/healthz
```

Se o `healthz` falhar **dentro** do container, o problema é boot da app.
Se o `healthz` responder dentro do container e externamente der `502`, o problema é proxy port, healthcheck ou restart do serviço.

### Logging estruturado

As rotas de auth agora emitem logs JSON com:

- `event`
- `requestId`
- `method`
- `path`
- `status`
- `durationMs`

Procure por:

```text
http.request.started
http.request.completed
http.request.failed
runtime.uncaught_exception
runtime.unhandled_rejection
```

## Evidência da pesquisa

Documentação oficial consultada:

- Easypanel App Service: https://easypanel.io/docs/services/app
- Easypanel Services: https://easypanel.io/docs/services
- Easypanel Postgres Service: https://easypanel.io/docs/services/postgres
- Easypanel Redis Service: https://easypanel.io/docs/services/redis

Pontos relevantes da documentação:

- App Service usa o `Dockerfile` do repo quando ele existe
- variáveis de ambiente existem em build-time e run-time
- web app precisa de `proxy port` correto
- logs e console são as ferramentas oficiais de diagnóstico

## Próximo passo objetivo

Para eu fechar isso com você, eu preciso só de **uma** informação concreta:

1. o hostname interno do seu serviço Postgres no EasyPanel
2. o hostname interno do seu serviço Redis no EasyPanel
3. o hostname interno do seu serviço MinIO/S3 no EasyPanel

Se você me mandar isso, eu te devolvo o bloco final de variáveis pronto para colar no `crm-web` e no `crm-worker`.
