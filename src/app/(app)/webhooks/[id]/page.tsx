import { WebhookDetailPageView } from "@/modules/webhooks/pages/webhook-detail-page";

export default async function WebhookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WebhookDetailPageView webhookId={id} />;
}
