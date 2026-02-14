"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Copy, Check, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DonatePage() {
    const [copied, setCopied] = useState(false);
    const ZELLE_NUMBER = "682-812-0796";

    const handleCopy = () => {
        navigator.clipboard.writeText(ZELLE_NUMBER);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-warm-paper font-serif selection:bg-muted-rose/20">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20 max-w-2xl">
                {/* Article Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-block p-4 rounded-full bg-soft-blush/30 mb-6">
                        <Heart className="w-8 h-8 text-muted-rose fill-muted-rose/20" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-warm-cocoa mb-6 leading-tight">
                        Sowing into Good Ground
                    </h1>
                    <p className="text-warm-grey text-lg italic">
                        Partnering with Selahly to build a digital sanctuary for sisters in Christ.
                    </p>
                </div>

                {/* Article Content */}
                <div className="prose prose-stone prose-lg mx-auto text-warm-grey/80 leading-relaxed animate-fade-in-up animation-delay-200">
                    <p className="mb-6 first-letter:text-5xl first-letter:font-serif first-letter:text-warm-cocoa first-letter:mr-1 first-letter:float-left">
                        Selahly is more than just an app; it is a labor of love, a ministry, and a growing community dedicated to providing a peaceful, Christ-centered space for women to connect, reflect, and grow.
                    </p>
                    <p className="mb-8">
                        Your support helps us maintain our servers, develop new features (like the Bible study tools and shared journals!), and keep this space safe and ads-free. Every seed sown goes directly into nurturing this digital garden.
                    </p>

                    <div className="my-12 p-8 bg-white border border-warm-grey/10 rounded-3xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-soft-blush/20 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                        <h3 className="text-2xl font-serif text-warm-cocoa mb-2">Support via Zelle</h3>
                        <p className="text-sm text-warm-grey/60 mb-6">Send your gift directly using the number below.</p>

                        <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100 relative">
                            <div className="flex-1 font-mono text-xl text-warm-grey tracking-wider">
                                {ZELLE_NUMBER}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-warm-grey/60 hover:text-muted-rose active:scale-95"
                                title="Copy number"
                            >
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        {copied && (
                            <p className="text-xs text-muted-rose mt-2 absolute bottom-2 right-8 animate-fade-in">
                                Copied to clipboard!
                            </p>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            <a
                                href={`https://enroll.zellepay.com/qr-codes?data=${ZELLE_NUMBER}`} // Fallback/General Zelle link since deep linking varies by bank app
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-deep-velvet text-white py-3 px-6 rounded-xl font-sans text-sm font-bold shadow-lg shadow-deep-velvet/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2"
                            >
                                Open Zelle App <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <p className="italic text-sm text-center text-warm-grey/60 mt-12">
                        "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." <br />
                        <span className="font-bold not-italic">— 2 Corinthians 9:7</span>
                    </p>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/home" className="inline-flex items-center text-warm-cocoa hover:text-deep-velvet transition-colors border-b border-transparent hover:border-deep-velvet pb-0.5">
                        <ArrowRight className="w-4 h-4 mr-2 rotate-180" /> Back to the Lily Pad
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
