import { z } from "zod";

import { normalizeCep } from "@/lib/br-documents";

const viaCepSchema = z.object({
  cep: z.string(),
  logradouro: z.string().optional().default(""),
  complemento: z.string().optional().default(""),
  bairro: z.string().optional().default(""),
  localidade: z.string().optional().default(""),
  uf: z.string().optional().default(""),
  erro: z.boolean().optional(),
});

export type ViaCepAddress = {
  zipCode: string;
  addressLine1: string;
  addressLine2: string;
  neighborhood: string;
  city: string;
  state: string;
};

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const normalizedCep = normalizeCep(cep);

  if (normalizedCep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const parsed = viaCepSchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.erro) {
    return null;
  }

  return {
    zipCode: normalizeCep(parsed.data.cep),
    addressLine1: parsed.data.logradouro,
    addressLine2: parsed.data.complemento,
    neighborhood: parsed.data.bairro,
    city: parsed.data.localidade,
    state: parsed.data.uf.toUpperCase(),
  };
}
