import { PublicProposalPageView } from "@/modules/proposals/pages/public-proposal-page";

export const dynamic = "force-dynamic";

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <PublicProposalPageView token={token} />;
}
