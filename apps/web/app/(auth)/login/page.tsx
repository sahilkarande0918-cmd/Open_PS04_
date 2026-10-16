"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { Field, FormMessage, Submit } from "@/components/ui/form";
import { signIn } from "../actions";

function LoginForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <h1 className="mb-6 text-[28px] tracking-[-0.02em]">Sign in</h1>
      <input type="hidden" name="next" value={params.get("next") ?? "/dashboard"} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <FormMessage state={state} />
      <Submit>Sign in</Submit>
      <div className="flex justify-between pt-2 text-[14px] text-muted">
        <Link href="/forgot-password" className="hover:text-ink">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-ink hover:text-accent">
          Create an account
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
