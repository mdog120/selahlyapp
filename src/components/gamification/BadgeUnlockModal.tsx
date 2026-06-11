"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

type BadgeUnlockModalProps = {
    isOpen: boolean;
    onClose: () => void;
    badgeName: string;
    badgeDescription: string;
    icon?: React.ReactNode;
};

export function BadgeUnlockModal({ isOpen, onClose, badgeName, badgeDescription, icon }: BadgeUnlockModalProps) {
    const [show, setShow] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            setIsCollecting(false);
            // Trigger initial welcome confetti
            const duration = 2000;
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

    const handleCollect = () => {
        setIsCollecting(true);
        // Stamp explosion confetti
        confetti({
            particleCount: 35,
            spread: 80,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#FCEADE', '#D4A5A5', '#8D7B68', '#FBBF24']
        });
        // Wait for fly-away animation to finish
        setTimeout(() => {
            onClose();
            setIsCollecting(false);
        }, 850);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-warm-cocoa/40 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-500 ${show ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10"}`}>
                
                {!isCollecting && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-warm-grey/40 hover:text-warm-grey hover:bg-stone-100 rounded-full transition-colors z-30"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                <div className="flex flex-col items-center text-center">
                    {/* Sticker Bubble container */}
                    <div className="mb-6 relative h-28 flex items-center justify-center w-full">
                        <div className="absolute inset-0 bg-yellow-100 rounded-full blur-xl opacity-40 animate-pulse" />
                        
                        <motion.div
                            animate={isCollecting ? {
                                scale: [1, 1.3, 1.3, 0.15],
                                rotate: [0, -15, 20, 75],
                                x: [0, 0, 80, 280],
                                y: [0, -30, 80, 480],
                                opacity: [1, 1, 1, 0]
                            } : {}}
                            transition={{ duration: 0.85, times: [0, 0.2, 0.45, 1], ease: "easeInOut" }}
                            className="w-24 h-24 bg-gradient-to-br from-white to-stone-50 rounded-full shadow-inner border border-stone-100 flex items-center justify-center relative z-10 drop-shadow-sticker filter"
                        >
                            {icon || <Sparkles className="w-12 h-12 text-yellow-400" />}
                        </motion.div>
                        
                        {!isCollecting && (
                            <div className="absolute -top-2 -right-2 bg-sage-green text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm rotate-12 z-20">
                                NEW!
                            </div>
                        )}
                    </div>

                    {/* Fading text content when collecting */}
                    <AnimatePresence>
                        {!isCollecting && (
                            <motion.div
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.25 }}
                                className="w-full flex flex-col items-center"
                            >
                                <h2 className="font-serif text-3xl text-warm-cocoa mb-2">Congrats!</h2>
                                <p className="text-sm font-medium text-sage-green uppercase tracking-widest mb-4">You Unlocked a Sticker</p>

                                <div className="bg-stone-50 rounded-xl p-4 w-full mb-6 border border-stone-100">
                                    <h3 className="font-serif text-lg text-warm-grey mb-1">{badgeName}</h3>
                                    <p className="text-sm text-warm-grey/60 italic">{badgeDescription}</p>
                                </div>

                                <button
                                    onClick={handleCollect}
                                    className="w-full bg-warm-cocoa text-white py-3 rounded-xl font-serif hover:bg-warm-cocoa/90 transition-transform active:scale-95 shadow-lg shadow-warm-cocoa/20"
                                >
                                    Collect Sticker ౨ৎ
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
