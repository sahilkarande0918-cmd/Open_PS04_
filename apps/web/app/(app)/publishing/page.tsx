import { requireOrg } from "@/lib/supabase/server";
import { PublishingStudio } from "@/components/publishing/publishing-studio";

export default async function PublishingPage() {
  const { org } = await requireOrg();
  return <PublishingStudio organizationId={org.id} canEdit={org.role !== "viewer"} />;
}
