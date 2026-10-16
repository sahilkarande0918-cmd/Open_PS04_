import { requireOrg } from "@/lib/supabase/server";
import { BrandEditor } from "./brand-editor";

export default async function BrandPage() {
  const { org } = await requireOrg();
  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="text-[28px] tracking-[-0.02em]">Brand kit</h1>
        <p className="mt-1 max-w-[70ch] text-[15px] text-muted">
          Colours, fonts, logo, handle, caption style and intro/outro cards for {org.name}. Every render copies the kit
          it used, so editing a kit never changes reels you already exported.
        </p>
      </div>
      <BrandEditor orgId={org.id} orgName={org.name} canEdit={org.role !== "viewer"} />
    </div>
  );
}
