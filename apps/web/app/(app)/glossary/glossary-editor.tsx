"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Term = { id: string; term: string; aliases: string[] };

export function GlossaryEditor({ orgId, canEdit }: { orgId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [aliases, setAliases] = useState("");
  const [error, setError] = useState<string | null>(null);
  const terms = useQuery({
    queryKey: ["glossary", orgId],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("technical_glossaries")
        .select("id, term, aliases")
        .eq("organization_id", orgId)
        .order("term");
      if (error) throw error;
      return data as Term[];
    },
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = term.trim();
    if (!t) return;
    const { error } = await createClient()
      .from("technical_glossaries")
      .insert({
        organization_id: orgId,
        term: t,
        aliases: aliases.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean),
      });
    setError(error ? (error.code === "23505" ? `“${t}” is already in the glossary.` : error.message) : null);
    if (!error) {
      setTerm("");
      setAliases("");
      qc.invalidateQueries({ queryKey: ["glossary", orgId] });
    }
  }

  async function remove(id: string) {
    const { error } = await createClient().from("technical_glossaries").delete().eq("id", id);
    setError(error?.message ?? null);
    qc.invalidateQueries({ queryKey: ["glossary", orgId] });
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <form onSubmit={add} className="flex flex-col gap-3 rounded-[6px] bg-surface p-4 sm:flex-row sm:items-end">
          <label className="sm:w-56">
            <span className="text-[13px] text-muted">Term, exactly as it should appear</span>
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="@Transactional" maxLength={80}
              className="mt-1 block w-full rounded-[4px] bg-surface-2 px-3 py-2 font-mono text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </label>
          <label className="flex-1">
            <span className="text-[13px] text-muted">How it is spoken (comma separated)</span>
            <input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="at the rate transactional, at transactional"
              className="mt-1 block w-full rounded-[4px] bg-surface-2 px-3 py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-accent" />
          </label>
          <button type="submit" className="rounded-[4px] bg-accent px-4 py-2 text-[14px] font-semibold text-accent-ink hover:brightness-110">
            Add term
          </button>
        </form>
      )}
      {error && <p className="text-[14px] text-danger">{error}</p>}
      {terms.data && terms.data.length === 0 && (
        <p className="text-[15px] text-muted">No institute terms yet. The built-in dictionary (Kubernetes, useEffect, @Autowired, Docker, JSON and ~60 more) always applies.</p>
      )}
      {terms.data && terms.data.length > 0 && (
        <table className="w-full text-left text-[14px]">
          <thead className="text-[13px] text-muted">
            <tr><th className="pb-2 font-normal">Term</th><th className="pb-2 font-normal">Spoken as</th><th /></tr>
          </thead>
          <tbody>
            {terms.data.map((t) => (
              <tr key={t.id} className="border-t border-line">
                <td className="py-2.5 font-mono">{t.term}</td>
                <td className="text-muted">{t.aliases.join(", ") || "—"}</td>
                <td className="text-right">
                  {canEdit && (
                    <button type="button" onClick={() => remove(t.id)} aria-label={`Remove ${t.term}`} className="text-muted hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
