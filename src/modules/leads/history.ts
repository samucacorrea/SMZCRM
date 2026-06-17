type LeadConversionSummaryInput = {
  leadId: string;
  leadName: string;
  company?: string | null;
  source: string;
  stageName?: string | null;
  estimatedValueInCents: number;
  tags: string[];
  attribution?: Record<string, string | null | undefined>;
};

type LeadActivityHistoryInput = {
  type: string;
  body: string;
  actorName?: string | null;
};

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function buildLeadConversionSummaryNote(input: LeadConversionSummaryInput) {
  const attributionEntries = Object.entries(input.attribution ?? {}).filter(([, value]) =>
    Boolean(value),
  );

  return [
    "Cliente criado a partir da conversao de lead.",
    `Lead: ${input.leadName} (${input.leadId})`,
    `Empresa: ${input.company || "Nao informada"}`,
    `Origem: ${input.source}`,
    `Estagio de origem: ${input.stageName || "Nao informado"}`,
    `Valor estimado: ${formatCurrency(input.estimatedValueInCents)}`,
    `Etiquetas: ${input.tags.length ? input.tags.join(", ") : "Nenhuma"}`,
    attributionEntries.length
      ? `Atribuicao: ${attributionEntries.map(([key, value]) => `${key}=${value}`).join(" | ")}`
      : "Atribuicao: nao capturada",
  ].join("\n");
}

export function buildLeadActivityHistoryNote(input: LeadActivityHistoryInput) {
  return [
    "Historico importado do lead.",
    `Tipo: ${input.type}`,
    `Autor: ${input.actorName || "Sistema"}`,
    "",
    input.body,
  ].join("\n");
}
