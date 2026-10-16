"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Submit } from "@/components/ui/form";
import { createWorkspace } from "./actions";

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export default function OnboardingPage() {
  const [state, action] = useActionState(createWorkspace, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <main className="flex min-h-svh items-center justify-center px-5">
      <form action={action} className="w-full max-w-[420px] space-y-4">
        <h1 className="text-[28px] tracking-[-0.02em]">Name your institute</h1>
        <p className="pb-2 text-[15px] text-muted">
          A workspace holds your recordings, brand kit, team and connected accounts. You can create more later.
        </p>
        <Field
          label="Institute or workspace name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(toSlug(e.target.value));
          }}
        />
        <Field
          label="Short name"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setTouched(true);
            setSlug(toSlug(e.target.value));
          }}
          hint="Lowercase letters, digits and hyphens."
        />
        <FormMessage state={state} />
        <Submit>Create workspace</Submit>
      </form>
    </main>
  );
}
