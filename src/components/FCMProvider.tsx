"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initFCM() {
      try {
        // Wait for auth to be ready
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Not logged in — skip FCM setup

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

    // Small delay to not block initial render
    const timer = setTimeout(initFCM, 2000);
    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
