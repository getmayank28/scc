"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";

/** Fires the page-view event once. Renders nothing. */
export function CampaignViewTracker({ campaign }: { campaign: string }) {
  const { track } = useAnalytics();
  useEffect(() => {
    track(EventName.CAMPAIGN_VIEWED, { campaign });
  }, [track, campaign]);
  return null;
}

/**
 * Native <details> so the content stays in the server HTML (and in search),
 * with an FAQ-opened event. Sharing a `name` makes a group open one at a time.
 */
export function TrackedDetails({
  event,
  name,
  className,
  children,
}: {
  event: { campaign: string; question: string };
  name?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { track } = useAnalytics();
  return (
    <details
      name={name}
      className={className}
      onToggle={(e) => {
        if (e.currentTarget.open) track(EventName.CAMPAIGN_FAQ_OPENED, event);
      }}
    >
      {children}
    </details>
  );
}

export function WhatsAppLink({
  href,
  campaign,
  source,
  className,
  children,
}: {
  href: string;
  campaign: string;
  source: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { track } = useAnalytics();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track(EventName.CAMPAIGN_WHATSAPP_CLICKED, { campaign, source })}
    >
      {children}
    </a>
  );
}
