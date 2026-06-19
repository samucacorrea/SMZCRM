"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leadActivities, leads, proposals } from "@/lib/db/schema";
import { createId } from "@/lib/ids";
import { acceptProposalByTokenSchema } from "@/modules/proposals/validators";
import { getPublicProposalByToken } from "@/modules/proposals/queries";

export type PublicProposalActionState = {
  error?: string;
  success?: string;
};

function resolveClientIp(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return requestHeaders.get("x-real-ip");
}

export async function acceptProposalByTokenAction(
  publicToken: string,
  _previousState: PublicProposalActionState,
  formData: FormData,
): Promise<PublicProposalActionState> {
  const parsed = acceptProposalByTokenSchema.safeParse({
    publicToken,
    signerName: formData.get("signerName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados invalidos",
    };
  }

  const proposal = await getPublicProposalByToken(parsed.data.publicToken);

  if (!proposal) {
    return {
      error: "Proposta nao encontrada.",
    };
  }

  if (proposal.validUntil && proposal.validUntil.getTime() < Date.now()) {
    return {
      error: "Esta proposta expirou e nao pode mais ser aceita.",
    };
  }

  if (proposal.status === "accepted") {
    return {
      success: "Esta proposta ja foi aceita anteriormente.",
    };
  }

  if (proposal.status === "rejected" || proposal.status === "expired") {
    return {
      error: "Esta proposta nao esta mais disponivel para aceite.",
    };
  }

  const requestHeaders = await headers();
  const acceptIp = resolveClientIp(requestHeaders);

  const acceptedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(proposals)
      .set({
        status: "accepted",
        acceptedAt,
        acceptIp,
        signature: {
          signerName: parsed.data.signerName,
          acceptedVia: "public_link",
        },
        updatedAt: acceptedAt,
      })
      .where(eq(proposals.id, proposal.id));

    await tx.insert(leadActivities).values({
      id: createId(),
      tenantId: proposal.tenantId,
      leadId: proposal.leadId,
      actorStaffMemberId: null,
      type: "note",
      body: `Proposta ${proposal.number} aceita publicamente por ${parsed.data.signerName}.`,
      metadata: {
        proposalId: proposal.id,
        proposalNumber: proposal.number,
        signerName: parsed.data.signerName,
        acceptIp,
        acceptedAt: acceptedAt.toISOString(),
      },
    });

    await tx
      .update(leads)
      .set({
        lastActivityAt: acceptedAt,
        updatedAt: acceptedAt,
      })
      .where(eq(leads.id, proposal.leadId));
  });

  revalidatePath(`/proposals/${proposal.publicToken}`);
  revalidatePath(`/leads/${proposal.leadId}`);
  revalidatePath("/leads");

  return {
    success: "Proposta aceita com sucesso.",
  };
}
