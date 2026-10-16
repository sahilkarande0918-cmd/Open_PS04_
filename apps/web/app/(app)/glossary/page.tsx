import { requireOrg } from "@/lib/supabase/server";
import { GlossaryEditor } from "./glossary-editor";

export default async function GlossaryPage() {
  const { org } = await requireOrg();
  return (
    <div className="max-w-[960px] space-y-6">
      <div>
        <p className="studio-eyebrow mb-2">Brand</p><h1 className="studio-heading">Technical glossary</h1>
        <p className="mt-1 max-w-[70ch] text-[15px] text-muted">
          Terms your instructors use. Transcription is biased towards these spellings, and spoken forms are corrected to
          them. The raw transcript is always kept alongside.
        </p>
      </div>
      <GlossaryEditor orgId={org.id} canEdit={org.role !== "viewer"} />
    </div>
  );
}
