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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-soft-blush/20 p-2.5 rounded-lg text-muted-rose shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">Grace & Glow</h3>
                                <p className="text-[10px] text-warm-grey/60">Daily gratitude journal.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-sage-green/10 p-2.5 rounded-lg text-sage-green shrink-0">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">The Lily Pad</h3>
                                <p className="text-[10px] text-warm-grey/60">Community social feed.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-warm-cocoa/10 p-2.5 rounded-lg text-warm-cocoa shrink-0">
                                <Heart className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">Velvet Vault</h3>
                                <p className="text-[10px] text-warm-grey/60">Anonymous Q&A.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-blue-100 p-2.5 rounded-lg text-blue-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">Prayer Pocket</h3>
                                <p className="text-[10px] text-warm-grey/60">Share & receive prayers.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-purple-100 p-2.5 rounded-lg text-purple-500 shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">Vibe Board</h3>
                                <p className="text-[10px] text-warm-grey/60">Music & podcasts.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                            <div className="bg-yellow-100 p-2.5 rounded-lg text-yellow-600 shrink-0">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-serif text-warm-cocoa font-medium text-sm">Bible</h3>
                                <p className="text-[10px] text-warm-grey/60">Read & meditate.</p>
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
