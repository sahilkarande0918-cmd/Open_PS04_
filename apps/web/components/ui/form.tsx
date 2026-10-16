"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function Field({ label, hint, ...props }: { label: string; hint?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[14px] text-muted">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full rounded-[4px] bg-surface-2 px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-accent"
      />
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function Submit({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-accent px-4 py-2.5 text-[15px] font-semibold text-accent-ink transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? "Working…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; notice?: string } }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-[4px] bg-danger/10 px-3 py-2 text-[14px] text-danger">
        {state.error}
      </p>
    );
  if (state?.notice)
    return (
      <p role="status" className="rounded-[4px] bg-success/10 px-3 py-2 text-[14px] text-success">
        {state.notice}
      </p>
    );
  return null;
}
