"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Sparkles, BookOpen, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HomeOnboarding() {
    const [show, setShow] = useState(false);
    const [step, setStep] = useState(1);
    const supabase = createClient();

    useEffect(() => {
        const checkTutorial = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("has_seen_tutorial")
                .eq("id", user.id)
                .single();

            if (profile && !profile.has_seen_tutorial) {
                setShow(true);
            }
        };
        checkTutorial();
    }, []);

    const handleClose = async () => {
        setShow(false);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from("profiles")
                .update({ has_seen_tutorial: true })
                .eq("id", user.id);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-warm-paper/80 backdrop-blur-md" />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-fade-in-up">
                {/* Decorative background blobs */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sage-green/10 rounded-full blur-3xl mix-blend-multiply" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-soft-blush/20 rounded-full blur-3xl mix-blend-multiply" />

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 text-warm-grey/40 hover:text-warm-grey z-10 hover:bg-stone-50 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center relative z-10">
                    <div className="w-16 h-16 bg-white shadow-sm rounded-2xl mx-auto mb-6 flex items-center justify-center rotate-3 border border-stone-100">
                        <Sparkles className="w-8 h-8 text-sage-green" />
                    </div>

                    <h2 className="font-serif text-3xl text-warm-cocoa mb-3">Welcome, Sister! 🌸</h2>
                    <p className="text-warm-grey/80 mb-8 leading-relaxed">
                        Selahly is your digital sanctuary. Here's a quick tour of your new home.
                    </p>

                    <div className="space-y-4 text-left">
                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-soft-blush/20 p-2.5 rounded-lg text-muted-rose">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium">Grace & Glow</h3>
                                <p className="text-xs text-warm-grey/60">Your daily gratitude journal to track your walk with God.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-sage-green/10 p-2.5 rounded-lg text-sage-green">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium">The Lily Pad</h3>
                                <p className="text-xs text-warm-grey/60">A safe social feed to share encouragements and prayer requests.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-warm-cocoa/10 p-2.5 rounded-lg text-warm-cocoa">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium">Velvet Vault</h3>
                                <p className="text-xs text-warm-grey/60">Ask anonymous questions and find honest answers from the sisterhood.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Button
                            onClick={handleClose}
                            className="w-full bg-warm-cocoa hover:bg-warm-cocoa/90 text-white py-6 rounded-xl text-lg font-serif shadow-lg shadow-warm-cocoa/20"
                        >
                            Let's Begin ✨
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
