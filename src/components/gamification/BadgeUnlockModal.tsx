"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

type BadgeUnlockModalProps = {
    isOpen: boolean;
    onClose: () => void;
    badgeName: string;
    badgeDescription: string;
    icon?: React.ReactNode;
};

export function BadgeUnlockModal({ isOpen, onClose, badgeName, badgeDescription, icon }: BadgeUnlockModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            // Trigger confetti
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#E6B8B8', '#C3B091', '#8A9A5B'] // Selahly colors
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#E6B8B8', '#C3B091', '#8A9A5B']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        } else {
            setShow(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-warm-cocoa/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-500 ${show ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10"}`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-warm-grey/40 hover:text-warm-grey hover:bg-stone-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-yellow-100 rounded-full blur-xl opacity-50 animate-pulse" />
                        <div className="w-24 h-24 bg-gradient-to-br from-white to-stone-50 rounded-full shadow-inner border border-stone-100 flex items-center justify-center relative z-10">
                            {icon || <Sparkles className="w-12 h-12 text-yellow-400" />}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-sage-green text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm rotate-12">
                            NEW!
                        </div>
                    </div>

                    <h2 className="font-serif text-3xl text-warm-cocoa mb-2">Congrats!</h2>
                    <p className="text-sm font-medium text-sage-green uppercase tracking-widest mb-4">You Unlocked a Sticker</p>

                    <div className="bg-stone-50 rounded-xl p-4 w-full mb-6 border border-stone-100">
                        <h3 className="font-serif text-lg text-warm-grey mb-1">{badgeName}</h3>
                        <p className="text-sm text-warm-grey/60 italic">{badgeDescription}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-warm-cocoa text-white py-3 rounded-xl font-serif hover:bg-warm-cocoa/90 transition-transform active:scale-95 shadow-lg shadow-warm-cocoa/20"
                    >
                        Collect Sticker
                    </button>
                </div>
            </div>
        </div>
    );
}
