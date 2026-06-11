"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BowLogo } from "@/components/ui/BowLogo";

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-warm-grey relative overflow-hidden">
            {/* Ambient background blobs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FCEADE] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#E3E9E2] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4A5A5]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

            <div className="relative z-10 glass-card px-8 py-10 rounded-[2.5rem] flex flex-col items-center shadow-2xl border border-white/80 max-w-sm w-[90%] mx-4 bg-white/45 backdrop-blur-xl animate-fade-in-up">
                {/* Bow logo wrapper */}
                <div className="mb-6 p-5 rounded-full bg-white/80 shadow-md border border-[#FCEADE]/40 animate-bounce-slow flex items-center justify-center">
                    <BowLogo className="text-5xl text-[#D4A5A5]" />
                </div>

                <h2 className="font-serif text-2xl md:text-3xl text-warm-grey mb-3 text-center">
                    Entering Sanctuary...
                </h2>
                
                {/* Glowing breathing loader bar */}
                <div className="w-28 h-1 bg-[#E3E9E2] rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-[#D4A5A5] rounded-full w-full origin-left animate-pulse" style={{ animationDuration: '1.6s' }} />
                </div>

                <p className="text-warm-cocoa/75 font-semibold tracking-wide text-xs uppercase text-center leading-relaxed">
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
