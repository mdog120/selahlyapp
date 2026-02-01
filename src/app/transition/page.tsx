"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

function TransitionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const initial = searchParams.get("initial");

    useEffect(() => {
        const checkRedirect = async () => {
            // Artificial delay for the "breathing" animation
            // In parallel, we check the user's status
            const delay = new Promise(resolve => setTimeout(resolve, 3200));

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            let target = "/login";
            let query = "";

            if (user) {
                // Check if they have accepted the code of conduct
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("accepted_code_of_conduct")
                    .eq("id", user.id)
                    .single();

                if (profile?.accepted_code_of_conduct) {
                    target = "/home";
                    query = name ? `?name=${encodeURIComponent(name)}&initial=${encodeURIComponent(initial || "")}` : "";
                } else {
                    target = "/onboarding";
                }
            }

            await delay;
            router.push(`${target}${query}`);
        };

        checkRedirect();
    }, [router, name, initial]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-warm-paper text-warm-grey relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-soft-blush/20 to-sage-green/20 animate-pulse" />

            <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                <div className="mb-8 p-6 rounded-full bg-white/40 backdrop-blur-md shadow-sm animate-bounce-slow">
                    <Image
                        src="/logo.png"
                        alt="Selahly Lotus"
                        width={80}
                        height={80}
                        className="opacity-80"
                    />
                </div>

                <h2 className="font-serif text-3xl md:text-4xl text-warm-grey mb-3">
                    Entering Sanctuary...
                </h2>
                <p className="text-warm-cocoa/60 font-medium tracking-wide text-sm uppercase">
                    Locating Christian sisters near you...
                </p>
            </div>
        </div>
    );
}

export default function Transition() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-warm-paper" />}>
            <TransitionContent />
        </Suspense>
    );
}
