"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Download, EllipsisVertical, PlusSquare, Share, X } from "lucide-react";
import toast from "react-hot-toast";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInstallPrompt } from "@/contexts/InstallPromptContext";
import { useAnalytics } from "@/lib/analytics/hooks/useAnalytics";
import { EventName } from "@/lib/analytics/types";

const DISMISS_KEY = "fs_install_dismissed_at";
const DISMISS_DAYS = 7;

function wasRecentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * "Add FiSense to your home screen" card. Android gets the native one-tap
 * install dialog; iOS (no install API) gets a 2-step Share-sheet guide; in-app
 * browsers (Instagram/FB ads) are told to open the page in Safari/Chrome first.
 */
const InstallAppBanner = ({ className = "" }: { className?: string }) => {
  const { platform, canInstall, canPromptNatively, promptInstall } = useInstallPrompt();
  const { track } = useAnalytics();
  const [dismissed, setDismissed] = useState(true); // hidden until localStorage is read
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => setDismissed(wasRecentlyDismissed()), []);

  const visible = canInstall && !dismissed;

  useEffect(() => {
    if (visible) track(EventName.INSTALL_APP_CTA_SHOWN, { installPlatform: platform });
  }, [visible]);

  if (!visible) return null;

  const handleInstall = async () => {
    track(EventName.INSTALL_APP_CTA_CLICKED, { installPlatform: platform });
    if (canPromptNatively) {
      const outcome = await promptInstall();
      if (outcome) track(EventName.INSTALL_APP_PROMPT_RESULT, { installPlatform: platform, outcome });
      if (outcome === "accepted") {
        track(EventName.INSTALL_APP_INSTALLED, { installPlatform: platform });
      }
      return;
    }
    setGuideOpen(true);
  };

  const handleDismiss = () => {
    track(EventName.INSTALL_APP_CTA_DISMISSED, { installPlatform: platform });
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  };

  return (
    <>
      <div
        className={`relative w-full max-w-xl md:hidden flex items-center gap-3 rounded-2xl border border-brown-border bg-brown-sidebar p-3 pr-9 ${className}`}
      >
        <Image src="/icons/logo-192.png" alt="" width={44} height={44} className="rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Get the FiSense app</p>
          <p className="text-xs text-white/60">One tap from your home screen. No app store needed.</p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1.5 rounded-full bg-primary-orange px-3.5 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          <Download size={14} />
          {platform === "in_app_browser" ? "How to" : "Add"}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-1.5 right-1.5 p-1 text-white/40 hover:text-white/80"
        >
          <X size={16} />
        </button>
      </div>

      <Sheet open={guideOpen} onOpenChange={setGuideOpen}>
        <SheetContent
          side="bottom"
          overlayClassName="z-[10000]"
          className="z-[10000] rounded-t-2xl px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white"
        >
          {platform === "in_app_browser" ? <InAppBrowserGuide /> : <IOSGuide />}
        </SheetContent>
      </Sheet>
    </>
  );
};

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex items-center gap-3 rounded-xl bg-brown-background p-3 text-sm">
    <span className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-primary-orange text-xs font-bold">
      {n}
    </span>
    <span className="flex flex-wrap items-center gap-1">{children}</span>
  </li>
);

const IOSGuide = () => (
  <>
    <SheetHeader className="p-0">
      <SheetTitle className="text-white">Add FiSense to your Home Screen</SheetTitle>
      <SheetDescription>Takes 5 seconds. Opens full-screen like a regular app.</SheetDescription>
    </SheetHeader>
    <ol className="flex flex-col gap-2">
      <Step n={1}>
        Tap the <Share size={18} className="text-[#0A84FF]" /> <b>Share</b> button in the browser bar
      </Step>
      <Step n={2}>
        Scroll down and tap <PlusSquare size={18} /> <b>Add to Home Screen</b>
      </Step>
      <Step n={3}>
        Tap <b>Add</b> in the top-right corner
      </Step>
    </ol>
  </>
);

const InAppBrowserGuide = () => {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied. Paste it in Safari or Chrome");
    } catch {
      toast.error("Couldn't copy. Use the browser menu instead");
    }
  };
  return (
    <>
      <SheetHeader className="p-0">
        <SheetTitle className="text-white">Open in your browser first</SheetTitle>
        <SheetDescription>
          This app&apos;s built-in browser can&apos;t add FiSense to your home screen.
        </SheetDescription>
      </SheetHeader>
      <ol className="flex flex-col gap-2">
        <Step n={1}>
          Tap <EllipsisVertical size={18} /> or <b>•••</b> at the top of the screen
        </Step>
        <Step n={2}>
          Choose <b>Open in browser</b> (or <b>Open in Safari</b> / <b>Chrome</b>)
        </Step>
        <Step n={3}>
          Then tap <b>Add to Home Screen</b> on the banner there
        </Step>
      </ol>
      <button
        onClick={copyLink}
        className="flex items-center justify-center gap-2 rounded-full border border-brown-border py-2.5 text-sm"
      >
        <Copy size={16} /> Copy link instead
      </button>
    </>
  );
};

export default InstallAppBanner;
