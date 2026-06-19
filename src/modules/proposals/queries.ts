import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { proposalItems, proposals } from "@/lib/db/schema";

export async function getPublicProposalByToken(publicToken: string) {
  return db.query.proposals.findFirst({
    where: eq(proposals.publicToken, publicToken),
    with: {
      lead: true,
      customer: true,
      items: {
        orderBy: [proposalItems.sortOrder],
      },
    },
  });
}
