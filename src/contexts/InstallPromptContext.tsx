"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Chrome/Edge/Samsung fire `beforeinstallprompt` once, early in the page
// lifecycle, so it has to be captured at the root — a listener mounted by a
// page component can miss it. iOS has no install API at all; there we can
// only show manual "Share → Add to Home Screen" instructions.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "android" | "ios" | "in_app_browser" | "other";

interface InstallPromptContextValue {
  platform: InstallPlatform;
  /** Already running as an installed app. */
  isStandalone: boolean;
  /** Android: the native one-tap install dialog is available. */
  canPromptNatively: boolean;
  /** Whether an install CTA makes sense for this visitor at all. */
  canInstall: boolean;
  /** Opens the native dialog. Resolves to null when no native prompt is available. */
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
}

const InstallPromptContext = createContext<InstallPromptContextValue>({
  platform: "other",
  isStandalone: false,
  canPromptNatively: false,
  canInstall: false,
  promptInstall: async () => null,
});

function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent;
  // Instagram / Facebook / Messenger / LinkedIn / Snapchat webviews can't add to home screen.
  if (/FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|Line\//i.test(ua)) return "in_app_browser";
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return /; wv\)/.test(ua) ? "in_app_browser" : "android";
  return "other";
}

function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPromptProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsStandalone(detectStandalone());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // suppress Chrome's mini-infobar; we show our own CTA
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null); // the event can only be used once
    return outcome;
  }, [deferredPrompt]);

  const canPromptNatively = !!deferredPrompt;
  const canInstall =
    !isStandalone &&
    (canPromptNatively || platform === "ios" || platform === "in_app_browser");

  return (
    <InstallPromptContext.Provider
      value={{ platform, isStandalone, canPromptNatively, canInstall, promptInstall }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
}

export const useInstallPrompt = () => useContext(InstallPromptContext);
