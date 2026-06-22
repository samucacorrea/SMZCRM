import { TimesheetsPageView } from "@/modules/projects/pages/timesheets-page";

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <TimesheetsPageView searchParams={searchParams} />;
}
