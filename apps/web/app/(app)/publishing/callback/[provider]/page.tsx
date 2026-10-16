import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SocialCallback } from "@/components/publishing/social-callback";

export const metadata: Metadata = { title: "Connect an account · Reel Studio", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function CallbackPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== "instagram" && provider !== "youtube") notFound();
  return <Suspense fallback={<p className="text-muted">Completing account connection…</p>}><SocialCallback provider={provider} /></Suspense>;
}
