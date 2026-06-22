import { ProjectProfilePageView } from "@/modules/projects/pages/project-profile-page";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectProfilePageView projectId={id} />;
}
