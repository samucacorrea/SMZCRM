import { Queue } from "bullmq";

import { bullConnection } from "@/lib/queue";

export const emailQueue = new Queue("email", { connection: bullConnection });
