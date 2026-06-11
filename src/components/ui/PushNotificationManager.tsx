"use client";

import { useEffect, useState } from "react";
import { Bell, X, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Utility to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [showBanner, setShowBanner] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // 1. Check browser support
        const supported =
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            "PushManager" in window;
        
        setIsSupported(supported);

        if (!supported) return;

        // 2. Check if user is logged in
        const checkUserSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return; // Only prompt logged-in users

            // 3. Evaluate notification permissions & custom local storage flag
            const permission = Notification.permission;
            const dismissed = localStorage.getItem("selahly_push_dismissed") === "true";

            if (permission === "default" && !dismissed) {
                // Delay showing banner slightly for a better user experience
                const timer = setTimeout(() => setShowBanner(true), 4000);
                return () => clearTimeout(timer);
            } else if (permission === "granted") {
                // Ensure subscription is registered/updated silently
                silentlySubscribe();
            }
        };

        checkUserSession();
    }, []);

    const silentlySubscribe = async () => {
        try {
            const reg = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;
            
            const existingSub = await reg.pushManager.getSubscription();
            
            if (existingSub) {
                // Resend to server to ensure it is stored
                await registerSubscriptionOnServer(existingSub);
            }
        } catch (e) {
            console.error("Silent subscribe failed:", e);
        }
    };

    const registerSubscriptionOnServer = async (sub: PushSubscription) => {
        try {
            await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub }),
            });
        } catch (err) {
            console.error("Failed to register push token on server:", err);
        }
    };

    const handleEnableNotifications = async () => {
        setShowBanner(false);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                localStorage.setItem("selahly_push_dismissed", "true");
                return;
            }

            // Register and Subscribe
            const reg = await navigator.serviceWorker.register("/sw.js");
            await navigator.serviceWorker.ready;

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
            if (!vapidPublicKey) {
                console.error("VAPID Public Key is missing in environment variables.");
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            });

            await registerSubscriptionOnServer(sub);
        } catch (err) {
            console.error("Error setting up notifications:", err);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("selahly_push_dismissed", "true");
    };

    if (!isSupported || !showBanner) return null;

    return (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-xl border border-pink-200/50 shadow-[0_10px_30px_rgba(212,165,165,0.25)] rounded-[2rem] p-6 relative overflow-hidden">
                {/* Decorative bow background watermark */}
                <div className="absolute -right-4 -bottom-6 text-7xl opacity-[0.06] text-muted-rose pointer-events-none font-serif">
                    ౨ৎ
                </div>

                <button 
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-1 rounded-full text-warm-grey/30 hover:text-warm-grey/60 hover:bg-stone-100 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100/50 flex items-center justify-center text-muted-rose shrink-0 shadow-inner">
                        <Bell className="w-5 h-5 animate-swing" />
                    </div>

                    <div className="flex-1 space-y-3.5 pr-4">
                        <div>
                            <h4 className="font-serif text-base text-warm-cocoa flex items-center gap-1.5 font-bold">
                                <span>Stay in Prayer</span> 
                                <Sparkles className="w-4 h-4 text-pink-400 fill-pink-300/30" />
                            </h4>
                            <p className="text-xs text-warm-grey/70 leading-relaxed mt-1">
                                Enable lockscreen notifications to know instantly when a sister prays for your request or replies to you. ౨ৎ
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleEnableNotifications}
                                className="bg-muted-rose text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-muted-rose/90 shadow-md shadow-muted-rose/20 transition-all active:scale-[0.98]"
                            >
                                Enable
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-warm-grey/40 hover:text-warm-grey/60 text-xs font-medium px-4 py-2.5 transition-all"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
