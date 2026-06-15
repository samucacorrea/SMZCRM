import { WebhookDocsPageView } from "@/modules/webhooks/pages/webhook-docs-page";

export default async function WebhookDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WebhookDocsPageView webhookId={id} />;
}
