"use client";

import { useActionState } from "react";
import { Field, FormMessage, Submit } from "@/components/ui/form";
import { updatePassword } from "../actions";

export default function ResetPasswordPage() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="mb-6 text-[28px] tracking-[-0.02em]">Choose a new password</h1>
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <FormMessage state={state} />
      <Submit>Save password</Submit>
    </form>
  );
}
