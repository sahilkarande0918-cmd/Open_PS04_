"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormMessage } from "@/components/ui/form";
import { createProject } from "../projects/actions";

const IDEAS = ["JSON vs XML", "Python lists vs tuples", "How HTTP requests work", "SQL JOINs in one minute", "What is recursion?"];

function Go() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="studio-button !px-5 !py-3 !text-[14px]">{pending ? "Creating…" : <>Continue <ArrowRight size={16} aria-hidden /></>}</button>;
}

/** Creates a topic project named after the topic and opens it with the topic prefilled. */
export function TopicStart() {
  const [state, action] = useActionState(createProject, undefined);
  const [topic, setTopic] = useState("");
  return <form action={action} className="rounded-2xl bg-[var(--rail)] p-6 text-[var(--rail-ink)] sm:p-8">
    <input type="hidden" name="mode" value="topic" />
    <label htmlFor="topic" className="flex items-center gap-2 text-[13px] font-semibold text-[var(--rail-muted)]"><Sparkles size={16} aria-hidden /> What should the video explain?</label>
    <textarea id="topic" name="topic" required minLength={3} maxLength={500} rows={3} value={topic} onChange={(e) => setTopic(e.target.value)}
      placeholder="Explain JSON vs XML with a simple example. Show the same data in both formats."
      className="mt-3 w-full resize-none rounded-xl border border-[var(--rail-active)] bg-[var(--rail-active)]/50 p-4 text-[18px] leading-7 text-[var(--rail-ink)] outline-none placeholder:text-[var(--rail-muted)]/70 focus:border-[var(--rail-muted)]" />
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">{IDEAS.map((i) => <button key={i} type="button" onClick={() => setTopic(i)} className="rounded-full border border-[var(--rail-active)] px-3 py-1.5 text-[12px] text-[var(--rail-muted)] transition-colors hover:border-[var(--rail-muted)] hover:text-[var(--rail-ink)]">{i}</button>)}</div>
      <Go />
    </div>
    <div className="mt-3 empty:hidden"><FormMessage state={state} /></div>
  </form>;
}
