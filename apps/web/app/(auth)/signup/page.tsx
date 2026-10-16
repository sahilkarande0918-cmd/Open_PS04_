"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { Field, FormMessage, Submit } from "@/components/ui/form";
import { signUp } from "../actions";

function SignupForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="mb-6 text-[28px] tracking-[-0.02em]">Open your studio</h1>
      <Field label="Your name" name="full_name" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={params.get("email") ?? ""} required />
      <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={8} required hint="At least 8 characters." />
      <FormMessage state={state} />
      <Submit>Create account</Submit>
      <p className="pt-2 text-[14px] text-muted">
        Already have one?{" "}
        <Link href="/login" className="text-ink hover:text-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
