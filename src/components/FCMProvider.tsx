"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const pendingTokenRef = useRef<string | null>(null);
  const STORAGE_KEY = "pending_native_device_token";

  useEffect(() => {
    console.log("[Website] FCMProvider mounted");
    if (typeof window !== "undefined") {
      const maybeToken = (window as unknown as Record<string, unknown>).nativeDeviceToken;
      if (maybeToken) console.log("[Website] existing nativeDeviceToken found", maybeToken);
    }
    if (initialized.current) return;
    initialized.current = true;

    async function attemptRegisterPendingToken() {
      try {
        const token = pendingTokenRef.current ?? (typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null);
        if (!token) return;

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          console.warn("Attempt to register token skipped — no Supabase session yet.");
          return;
        }

        console.log("Attempting to register pending native token...");
        const response = await fetch("/api/register-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            "x-debug-register-token": "true",
          },
          body: JSON.stringify({ token, platform: "web" }),
        });

        console.log("register-token status:", response.status);
        const responseText = await response.text();
        console.log("register-token body:", responseText);

        if (response.ok) {
          console.log("Pending native device token registered successfully");
          pendingTokenRef.current = null;
          try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
        } else {
          console.error("Failed to register pending native device token:", response.status, responseText);
        }
      } catch (err) {
        console.error("Error while attempting to register pending native token:", err);
      }
    }

    async function triggerNotificationCheck() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        fetch("/api/cron/check-plants", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }).catch(err => console.error("Error triggering notifications cron check:", err));
      } catch (err) {
        console.error("Error triggering notifications cron check:", err);
      }
    }

    async function registerNativeDeviceToken(event: Event) {
      try {
        console.log("[Website] nativeDeviceToken received", (event as CustomEvent).detail);
        const customEvent = event as CustomEvent<unknown>;
        let token: string | undefined;

        if (customEvent.detail) {
          if (typeof customEvent.detail === "string") {
            token = customEvent.detail;
          } else if (typeof customEvent.detail === "object" && customEvent.detail !== null) {
            const detailObject = customEvent.detail as Record<string, unknown>;
            if (typeof detailObject.token === "string") {
              token = detailObject.token;
            }
          }
        }

        if (!token) {
          console.warn("nativeDeviceToken event received with no valid token:", customEvent.detail);
          return;
        }

        // Save pending token (ref + sessionStorage) then try registering
        pendingTokenRef.current = token;
        try { sessionStorage.setItem(STORAGE_KEY, token); } catch {}

        await attemptRegisterPendingToken();
      } catch (err) {
        console.error(
          "nativeDeviceToken registration failed:",
          JSON.stringify(err, Object.getOwnPropertyNames(err))
        );
      }
    }

    async function initFCM() {
      try {
        // Wait for auth to be ready
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        // If user exists, try registering any pending token immediately
        if (user) {
          await attemptRegisterPendingToken();
          triggerNotificationCheck();
        }

        // Check if browser supports notifications
        if (typeof window === "undefined" || !("Notification" in window)) return;

        // Check if already prompted and denied
        if (Notification.permission === "denied") return;

        // Dynamically import Firebase to avoid SSR issues
        const { registerAndSaveFCMToken } = await import("@/lib/firebase");
        const token = await registerAndSaveFCMToken();

        if (token) {
          console.log("FCM registered. Token:", token.substring(0, 20) + "...");
        }

        // Set up foreground message listener
        const { getFirebaseMessaging } = await import("@/lib/firebase");
        const { onMessage } = await import("firebase/messaging");
        const messaging = await getFirebaseMessaging();

        if (messaging) {
          onMessage(messaging, (payload) => {
            console.log("Foreground FCM message received:", payload);

            // Show a native notification for foreground messages too
            if (Notification.permission === "granted" && payload.notification) {
              new Notification(payload.notification.title || "Selahly ౨ৎ", {
                body: payload.notification.body || "",
                icon: "/logo-v2.svg",
              });
            }
          });
        }
      } catch (err) {
        console.error("FCM initialization error:", err);
      }
    }

    window.addEventListener("nativeDeviceToken", registerNativeDeviceToken as EventListener);

    // Retry when auth state changes (user signs in)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("supabase auth state change:", event);
      if (event === "SIGNED_IN" || (session && session.access_token)) {
        await attemptRegisterPendingToken();
        triggerNotificationCheck();
      }
    });

    const timer = setTimeout(initFCM, 2000);
    // Also try immediately in case token already in sessionStorage
    try { pendingTokenRef.current = sessionStorage.getItem(STORAGE_KEY); } catch {}
    attemptRegisterPendingToken();
    triggerNotificationCheck();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("nativeDeviceToken", registerNativeDeviceToken as EventListener);
      // remove supabase listener
      try { subscription.unsubscribe(); } catch {}
    };
  }, []);

  return <>{children}</>;
}
