import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const MIGRATION_LOCK_ID = 14824001;
const LOCK_RETRY_MS = 2000;
const LOCK_TIMEOUT_MS = 120000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    console.log("[db:migrate] testando conexão com o PostgreSQL...");
    await client.query("select now()");
    console.log("[db:migrate] conexão com PostgreSQL OK");

    const startedAt = Date.now();

    while (!lockAcquired) {
      const result = await client.query<{ locked: boolean }>(
        "select pg_try_advisory_lock($1) as locked",
        [MIGRATION_LOCK_ID],
      );

      lockAcquired = result.rows[0]?.locked === true;

      if (lockAcquired) {
        break;
      }

      if (Date.now() - startedAt > LOCK_TIMEOUT_MS) {
        throw new Error(
          "timeout aguardando lock de migração; outra instância pode estar migrando ou travada",
        );
      }

      console.log("[db:migrate] aguardando lock de migração...");
      await sleep(LOCK_RETRY_MS);
    }

    console.log("[db:migrate] lock adquirido, aplicando migrações...");
    await client.query("set lock_timeout = '15s'");
    await client.query("set statement_timeout = '120s'");

    const db = drizzle(client);
    await migrate(db, {
      migrationsFolder: "./drizzle",
    });

    console.log("[db:migrate] migrações concluídas com sucesso");
  } finally {
    if (lockAcquired) {
      await client.query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
    }

    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[db:migrate] falha ao aplicar migrações");
  console.error(error);
  process.exit(1);
});
