import { z } from "zod";

export const acceptProposalByTokenSchema = z.object({
  publicToken: z.string().min(10, "Token invalido"),
  signerName: z.string().min(3, "Nome obrigatorio").max(160, "Nome muito longo"),
});
