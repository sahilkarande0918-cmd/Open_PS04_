"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, Link2, LoaderCircle, Video } from "lucide-react";
import { useState } from "react";
import { accountReady, platformName, socialRequest, type Platform, type SocialAccount, type SocialConfig } from "@/lib/social";

export function AccountConnections({ organizationId, base, accounts, canEdit }: {
  organizationId: string;
  base: string | null;
  accounts: SocialAccount[];
  canEdit: boolean;
}) {
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [error, setError] = useState<string | null>(null);
  const config = useQuery({ queryKey: ["social-config", base], enabled: !!base, queryFn: () => socialRequest<SocialConfig>(base!, "/social/config"), staleTime: 30_000 });

  async function connect(platform: Platform) {
    if (!base || !canEdit) return;
    setConnecting(platform); setError(null);
    try {
      const result = await socialRequest<{ authorization_url: string }>(base, `/social/${platform}/connect`, { organization_id: organizationId });
      const destination = new URL(result.authorization_url);
      const allowed = platform === "instagram" ? ["www.instagram.com", "instagram.com", "api.instagram.com", "www.facebook.com", "facebook.com"] : ["accounts.google.com"];
      if (destination.protocol !== "https:" || !allowed.includes(destination.hostname)) throw new Error("The backend returned an unexpected authorization destination.");
      window.location.assign(destination.href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the account connection.");
      setConnecting(null);
    }
  }

  return <section className="studio-panel p-5 sm:p-6">
    <div className="mb-5"><p className="studio-eyebrow mb-2">Where your work goes</p><h2 className="text-[20px] font-semibold tracking-[-.03em]">Connected accounts</h2></div>
    <div className="grid gap-4 lg:grid-cols-2">
      {(["instagram", "youtube"] as const).map((platform) => {
        const Icon = platform === "instagram" ? Camera : Video;
        const available = config.data?.[platform]?.configured === true;
        const connected = accounts.filter((a) => a.platform === platform);
        return <div key={platform} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2.5 text-[15px] font-semibold"><Icon size={20} strokeWidth={1.6} aria-hidden />{platformName(platform)}</h3><span className="studio-pill">{!available ? "Unavailable" : connected.some(accountReady) ? "Connected" : "Ready to connect"}</span></div>
          {connected.length ? <ul className="mt-4 space-y-3">{connected.map((account) => <li key={account.id} className="flex items-start justify-between gap-3 text-[13px]"><span className="min-w-0 break-words">{account.username}<span className="mt-1 block text-[11px] text-muted">{account.expires_at ? `Authorization expires ${new Date(account.expires_at).toLocaleDateString()}` : "Connected through official authorization"}</span></span><span className={`shrink-0 text-[11px] ${accountReady(account) ? "text-success" : "text-danger"}`}>{accountReady(account) ? account.status : "Reconnect required"}</span></li>)}</ul> : <p className="mt-3 text-[12px] leading-6 text-muted">{platform === "instagram" ? "Connect an eligible Instagram professional account to publish your reels." : "YouTube publishing becomes available when its backend integration is configured."}</p>}
          {canEdit && <button type="button" onClick={() => connect(platform)} disabled={!base || !available || !!connecting} className="studio-button studio-button-secondary mt-4">{connecting === platform ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : <Link2 size={14} aria-hidden />}{connecting === platform ? "Opening authorization…" : connected.length ? `Connect ${platformName(platform)} account` : `Connect ${platformName(platform)}`}</button>}
          {!available && config.data && <p className="mt-3 text-[11px] leading-5 text-muted">Connection unavailable. The workspace owner needs to finish the {platformName(platform)} backend configuration.</p>}
        </div>;
      })}
    </div>
    {(error || config.error) && <p role="alert" className="mt-4 text-[13px] text-danger">{error || config.error?.message}</p>}
  </section>;
}
