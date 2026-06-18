"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function FCMProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    console.log("[Website] FCMProvider mounted");
    if (typeof window !== "undefined" && (window as any).nativeDeviceToken) {
      console.log("[Website] existing nativeDeviceToken found", (window as any).nativeDeviceToken);
    }
    if (initialized.current) return;
    initialized.current = true;

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

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          console.warn("Cannot register native device token because Supabase session is not available.");
          return;
        }

        const response = await fetch("/api/register-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token, platform: "web" }),
        });

        console.log("register-token status:", response.status);
        const responseText = await response.text();
        console.log("register-token body:", responseText);

        let result: unknown = {};
        try {
          result = JSON.parse(responseText);
        } catch {
          result = responseText;
        }

        if (!response.ok) {
          console.error("Failed to register native device token:", JSON.stringify(result, Object.getOwnPropertyNames(result)));
        } else {
          console.log("Native device token registered successfully:", result);
        }
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

    window.addEventListener("nativeDeviceToken", registerNativeDeviceToken as EventListener);
    const timer = setTimeout(initFCM, 2000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("nativeDeviceToken", registerNativeDeviceToken as EventListener);
    };
  }, []);

  return <>{children}</>;
}
