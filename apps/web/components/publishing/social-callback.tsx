"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Link2, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBackend } from "@/lib/backend";
import { platformName, socialRequest, type Platform, type SocialAccount } from "@/lib/social";

export function SocialCallback({ provider }: { provider: Platform }) {
  const search = useSearchParams();
  // Capture once before removing query parameters; no OAuth code or state enters persistent storage.
  const [credentials] = useState(() => ({ code: search.get("code"), state: search.get("state"), error: search.get("error") }));
  const exchange = useRef<Promise<{ account: SocialAccount }> | null>(null);
  const backend = useBackend();
  const base = backend.data?.state === "online" ? backend.data.url : null;
  const qc = useQueryClient();
  const [account, setAccount] = useState<SocialAccount | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const invalid = credentials.error
    ? "Account connection was not approved. You can start again from Publishing."
    : !credentials.code || !credentials.state
      ? "This connection link is incomplete or has already been used. Start a new connection from Publishing."
      : null;

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!base || invalid) return;
    let mounted = true;
    // StrictMode may replay this effect: every replay observes the same exchange promise.
    exchange.current ??= socialRequest<{ account: SocialAccount }>(base, `/social/${provider}/callback`, {
      code: credentials.code,
      state: credentials.state,
    });
    exchange.current.then((result) => {
      if (!mounted) return;
      setAccount(result.account);
      qc.invalidateQueries({ queryKey: ["social-accounts"] });
    }).catch((error: unknown) => {
      if (mounted) setFailure(error instanceof Error ? error.message : "The account could not be connected. Start again from Publishing.");
    });
    return () => { mounted = false; };
  }, [base, invalid, provider, qc, credentials]);

  const error = invalid || failure;
  return (
    <section className="studio-panel mx-auto max-w-[560px] p-7 sm:p-10" aria-live="polite">
      {account ? <CheckCircle2 size={34} className="mb-6 text-success" aria-hidden /> : error ? <Link2 size={34} className="mb-6 text-danger" aria-hidden /> : <LoaderCircle size={34} className="mb-6 animate-spin text-accent" aria-hidden />}
      <p className="studio-eyebrow mb-3">{platformName(provider)} connection</p>
      <h1 className="studio-heading">{account ? "Account connected." : error ? "Let’s reconnect." : "Finishing the connection…"}</h1>
      <p className="mt-4 text-[14px] leading-7 text-muted">
        {account ? `${account.username} is now available in your workspace. Choose an export and review the caption before publishing.` : error || (!base && !backend.isLoading ? "The processing machine is offline. Keep this page open; the connection will finish when it returns." : "Verifying the authorization with your processing backend. Keep this page open for a moment.")}
      </p>
      {(account || error) && <Link href="/publishing" className="studio-button mt-7">Back to Publishing</Link>}
    </section>
  );
}
