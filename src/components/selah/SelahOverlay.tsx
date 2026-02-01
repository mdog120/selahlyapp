"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SelahOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

const BREATH_PRAYERS = [
    { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { text: "My peace I give to you.", reference: "John 14:27" },
    { text: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
    { text: "Cast all your anxiety on Him.", reference: "1 Peter 5:7" },
    { text: "I have loved you with an everlasting love.", reference: "Jeremiah 31:3" },
];

export function SelahOverlay({ isOpen, onClose }: SelahOverlayProps) {
    const [prayerIndex, setPrayerIndex] = useState(0);

    useEffect(() => {
        if (isOpen) {
            // Pick a random prayer when opened
            setPrayerIndex(Math.floor(Math.random() * BREATH_PRAYERS.length));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-100/90 backdrop-blur-xl animate-in fade-in duration-700">
            {/* Close Button */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-6 right-6 text-warm-grey/50 hover:text-warm-grey hover:bg-transparent"
                onClick={onClose}
            >
                <X className="w-8 h-8" />
            </Button>

            <div className="flex flex-col items-center text-center p-6 max-w-md animate-in zoom-in-95 duration-1000 slide-in-from-bottom-4">
                {/* Breathing Circle */}
                <div className="relative mb-12">
                    <div className="w-32 h-32 rounded-full bg-soft-sage/20 animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute inset-0 w-32 h-32 rounded-full bg-soft-sage/10 animate-ping" style={{ animationDuration: '4s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl">☁️</span>
                    </div>
                </div>

                {/* Text */}
                <h2 className="font-serif text-3xl md:text-4xl text-warm-cocoa mb-4 leading-tight">
                    {BREATH_PRAYERS[prayerIndex].text}
                </h2>
                <p className="text-warm-grey font-medium tracking-wide text-sm uppercase">
                    {BREATH_PRAYERS[prayerIndex].reference}
                </p>

                {/* Instruction */}
                <p className="mt-16 text-warm-grey/40 text-xs animate-pulse">
                    Breathe in... Breathe out...
                </p>
            </div>
        </div>
    );
}
