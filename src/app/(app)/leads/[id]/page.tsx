import { LeadProfilePageView } from "@/modules/leads/pages/lead-profile-page";

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LeadProfilePageView leadId={id} />;
}
