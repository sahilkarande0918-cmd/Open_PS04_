"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Submit } from "@/components/ui/form";
import { requestReset } from "../actions";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="mb-6 text-[28px] tracking-[-0.02em]">Reset your password</h1>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <FormMessage state={state} />
      <Submit>Send reset link</Submit>
      <Link href="/login" className="block pt-2 text-[14px] text-muted hover:text-ink">
        Back to sign in
      </Link>
    </form>
  );
}
