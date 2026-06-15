import { LeadsListPageView } from "@/modules/leads/pages/leads-list-page";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  return <LeadsListPageView searchParams={await searchParams} />;
}
