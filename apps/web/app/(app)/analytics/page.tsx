import { requireOrg } from "@/lib/supabase/server";
import { AnalyticsStudio } from "@/components/publishing/analytics-studio";

export default async function AnalyticsPage() {
  const { org } = await requireOrg();
  return <AnalyticsStudio organizationId={org.id} canEdit={org.role !== "viewer"} />;
}
