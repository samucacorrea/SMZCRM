import { Worker } from "bullmq";

import { bullConnection } from "@/lib/queue";

async function bootstrapWorker() {
  const worker = new Worker(
    "email",
    async (job) => {
      console.log(`Processing job ${job.name}`);
    },
    {
      connection: bullConnection,
    },
  );

  worker.on("failed", (job, error) => {
    console.error("Worker job failed", job?.id, error);
  });

  console.log("NucleoCRM worker online");
}

bootstrapWorker().catch((error) => {
  console.error("Worker bootstrap failed");
  console.error(error);
  process.exit(1);
});
