"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";

interface AlertItem {
    id: string;
    message: string;
}

export function GlobalAlertProvider({ children }: { children: React.ReactNode }) {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Save native alert
        const nativeAlert = window.alert;

        // Override window.alert
        window.alert = (message: string) => {
            const id = Math.random().toString(36).substring(2, 9);
            
            // Format message to ensure it's a string
            const alertMsg = typeof message === "object" ? JSON.stringify(message) : String(message);

            setAlerts((prev) => [...prev, { id, message: alertMsg }]);

            // Auto-dismiss after 4.5 seconds
            setTimeout(() => {
                setAlerts((prev) => prev.filter((a) => a.id !== id));
            }, 4500);
        };

        return () => {
            window.alert = nativeAlert;
        };
    }, []);

    const removeAlert = (id: string) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    };

    return (
        <>
            {children}
            
            {/* Custom Coquette-themed Toast Container */}
            <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[99999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {alerts.map((alert) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 50, scale: 0.93 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                            className="bg-white/95 backdrop-blur-xl border border-pink-100/60 shadow-[0_8px_25px_rgba(212,165,165,0.18)] rounded-2xl p-4 flex items-start gap-3.5 pointer-events-auto w-full select-none"
                        >
                            {/* Decorative pink bow graphic icon */}
                            <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100/50 flex items-center justify-center text-muted-rose shrink-0 shadow-inner">
                                <span className="font-serif text-sm relative top-[0.5px]">౨ৎ</span>
                            </div>

                            {/* Alert text */}
                            <div className="flex-1 space-y-0.5 pr-2 pt-0.5">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-warm-grey/40 flex items-center gap-1">
                                    <span>Selahly Notice</span>
                                    <Sparkles className="w-3 h-3 text-pink-300 fill-pink-200/20" />
                                </div>
                                <p className="text-xs text-warm-grey font-medium leading-relaxed">
                                    {alert.message}
                                </p>
                            </div>

                            {/* Dismiss button */}
                            <button
                                onClick={() => removeAlert(alert.id)}
                                className="p-1 rounded-full text-warm-grey/30 hover:text-warm-grey/60 hover:bg-stone-100 transition-all active:scale-90"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
