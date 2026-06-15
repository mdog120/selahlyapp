"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { BowLogo } from "@/components/ui/BowLogo";

const COMMUNITY_GUIDELINES = [
    {
        title: "🌿 Christian Sisterhood",
        content: "Selahly is a dedicated space for Christian women. We gather to support, pray for, and uplift one another in our walks of faith, keeping all interactions kind, encouraging, and centered on Christ's love."
    },
    {
        title: "📖 Scripture & Reflection (Selah)",
        content: "We encourage regular engagement with God's Word. Share what you read, record your notes, and use the Selah Timer to dedicate quiet time to study and listen to the Holy Spirit."
    },
    {
        title: "𐙚 Lily Pad & Gratitude Wall",
        content: "Our Lily Pad feed and Gratitude Wall are places of celebration and encouragement. Share scriptures, digital scrapbook memories, and gingham notes of thanksgiving to testify of God's goodness."
    },
    {
        title: "🔒 Privacy & Sanctuary Safety",
        content: "To maintain a safe sanctuary for all sisters, we respect the privacy of profiles and friend lists. Strangers will not see your private lists, and we keep our circles pure and secure."
    },
    {
        title: "✝️ Honor God's Purpose",
        content: "All content, posts, prayers, and reflections should honor God. We do not permit gossip, debate, division, or disrespectful language. We are here to seek His presence together."
    }
];

const REFERRAL_OPTIONS = [
    "Instagram",
    "TikTok",
    "Friend",
    "Search",
    "Other"
];

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState<"referral" | "covenant">("referral");
    const [referralSource, setReferralSource] = useState("");
    const [referralDetails, setReferralDetails] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleReferralSubmit = () => {
        setStep("covenant");
    };

    const handleAccept = async () => {
        setSubmitting(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Update profile with referral and covenant acceptance
            const { error } = await supabase
                .from("profiles")
                .update({
                    accepted_code_of_conduct: true,
                    referral_source: referralSource,
                    referral_details: referralDetails
                })
                .eq("id", user.id);

            if (error) throw error;

            // Redirect to home/dashboard
            router.push("/home"); // or /home depending on final structure
        } catch (error) {
            console.error("Error accepting code of conduct:", error);
            setSubmitting(false);
        }
    };

    if (step === "referral") {
        return (
            <div className="min-h-screen bg-warm-paper text-warm-grey flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full glass-card p-8 rounded-3xl relative overflow-hidden animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-soft-blush/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="text-center mb-8 relative z-10">
                        <BowLogo className="mx-auto mb-4 text-[#D4A5A5]" size="60px" />
                        <h1 className="font-serif text-3xl text-warm-cocoa mb-2">Welcome, Sister.</h1>
                        <p className="text-warm-grey/70">We'd love to know how you found ur way here.</p>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {REFERRAL_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setReferralSource(option)}
                                className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${referralSource === option
                                        ? "bg-sage-green text-white border-sage-green shadow-lg scale-[1.02]"
                                        : "bg-white/50 border-white/50 hover:border-sage-green/50 hover:bg-white/80"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {referralSource === "Friend" && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-sm font-medium text-warm-grey/80 mb-2">Who invited you?</label>
                            <input
                                type="text"
                                value={referralDetails}
                                onChange={(e) => setReferralDetails(e.target.value)}
                                placeholder="Enter your friend's name..."
                                className="w-full p-3 rounded-xl bg-white/50 border border-white focus:ring-2 ring-sage-green/20 outline-none transition-all"
                            />
                        </div>
                    )}

                    {referralSource === "Other" && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-sm font-medium text-warm-grey/80 mb-2">Please specify:</label>
                            <input
                                type="text"
                                value={referralDetails}
                                onChange={(e) => setReferralDetails(e.target.value)}
                                placeholder="Tell us more..."
                                className="w-full p-3 rounded-xl bg-white/50 border border-white focus:ring-2 ring-sage-green/20 outline-none transition-all"
                            />
                        </div>
                    )}

                    <Button
                        onClick={handleReferralSubmit}
                        disabled={!referralSource || (referralSource === "Friend" && !referralDetails)}
                        size="lg"
                        className="w-full mt-8"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-paper text-warm-grey flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full glass-card p-8 rounded-3xl relative overflow-hidden animate-fade-in">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-soft-blush/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="text-center mb-6 relative z-10">
                    <BowLogo className="mx-auto mb-4 text-[#D4A5A5]" size="60px" />
                    <h1 className="font-serif text-3xl text-warm-grey mb-2">Community Guidelines</h1>
                    <p className="text-warm-grey/70">Before you enter, please review how we support and grow together.</p>
                </div>

                <div className="h-96 overflow-y-auto pr-4 mb-6 space-y-6 custom-scrollbar relative z-10 bg-white/30 p-4 rounded-xl border border-white/50">
                    {COMMUNITY_GUIDELINES.map((item, i) => (
                        <div key={i}>
                            <h3 className="font-serif text-lg text-warm-cocoa mb-1">{item.title}</h3>
                            <p className="text-sm text-warm-grey/80 leading-relaxed text-justify">
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${accepted ? "bg-sage-green border-sage-green" : "border-warm-grey/30 group-hover:border-sage-green"}`}>
                            {accepted && <span className="text-white text-sm">✓</span>}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-warm-grey/80">I agree to uphold the Selahly community guidelines.</span>
                    </label>

                    <Button
                        onClick={handleAccept}
                        disabled={!accepted || submitting}
                        size="lg"
                        className="w-full sm:w-auto px-12"
                    >
                        {submitting ? "Joining Sanctuary..." : "Enter Selahly"}
                    </Button>

                    <div className="text-[10px] text-warm-grey/40 text-center mt-2">
                        By entering, you agree to our <a href="/legal/terms" target="_blank" className="underline hover:text-warm-grey">Terms</a>, <a href="/legal/privacy" target="_blank" className="underline hover:text-warm-grey">Privacy Policy</a>, and <a href="/legal/safety" target="_blank" className="underline hover:text-warm-grey">Safety Guidelines</a>.
                    </div>
                </div>
            </div>
        </div>
    );
}
