import { CustomerProfilePageView } from "@/modules/customers/pages/customer-profile-page";

export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CustomerProfilePageView customerId={id} />;
}
