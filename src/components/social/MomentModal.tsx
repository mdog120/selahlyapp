"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type Moment = {
    id: string;
    media_url: string | null;
    caption: string | null;
    background_color: string;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string;
        username: string;
        avatar_url: string | null;
    };
};

type MomentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    moments: Moment[];
    userName: string;
    userAvatar: string | null;
};

export function MomentModal({ isOpen, onClose, moments, userName, userAvatar }: MomentModalProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isOpen || moments.length === 0) return;

        setActiveIndex(0);
        setProgress(0);
    }, [isOpen, moments]);

    useEffect(() => {
        if (!isOpen || moments.length === 0) return;

        setProgress(0);
        const duration = 5000; // 5 seconds per story
        const intervalTime = 50;
        const steps = duration / intervalTime;
        
        let elapsed = 0;
        const timer = setInterval(() => {
            elapsed += intervalTime;
            setProgress((elapsed / duration) * 100);

            if (elapsed >= duration) {
                clearInterval(timer);
                handleNext();
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isOpen, activeIndex, moments]);

    if (!isOpen || moments.length === 0) return null;

    const currentMoment = moments[activeIndex];

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        } else {
            // Restart current
            setProgress(0);
        }
    };

    const handleNext = () => {
        if (activeIndex < moments.length - 1) {
            setActiveIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    // Get background class for styling text-only moments
    const getBgClass = (bg: string) => {
        switch (bg) {
            case 'rose': return 'bg-muted-rose text-white';
            case 'blue': return 'bg-indigo-400 text-white';
            case 'green': return 'bg-sage-green text-warm-grey';
            case 'orange': return 'bg-orange-400 text-white';
            case 'purple': return 'bg-purple-400 text-white';
            case 'yellow': return 'bg-yellow-400 text-warm-grey';
            default: return 'bg-warm-paper text-warm-grey';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
            {/* Click zones */}
            <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
                <div className="w-1/3 h-full" onClick={onClose} />
                <div className="w-1/3 h-full cursor-e-resize" onClick={handleNext} />
            </div>

            {/* Modal Card */}
            <div className="relative w-full max-w-md h-[80vh] mx-4 bg-stone-900 rounded-[2.5rem] overflow-hidden flex flex-col justify-between shadow-2xl border border-stone-800 z-10">
                {/* Progress Indicators */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                    {moments.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white transition-all duration-75"
                                style={{ 
                                    width: idx < activeIndex 
                                        ? '100%' 
                                        : idx === activeIndex 
                                            ? `${progress}%` 
                                            : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Profile Info */}
                <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-soft-blush overflow-hidden border border-white/20 shadow-sm">
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-xs text-warm-grey font-serif bg-white uppercase">
                                    {userName[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs shadow-sm">{userName}</p>
                            <p className="text-[10px] text-white/60 shadow-sm">Active Moment</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors border border-white/10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-stone-950">
                    {currentMoment.media_url ? (
                        <>
                            <img 
                                src={currentMoment.media_url} 
                                alt="Moment Content" 
                                className="w-full h-full object-contain" 
                            />
                            {currentMoment.caption && (
                                <div className="absolute bottom-16 left-4 right-4 bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
                                    <p className="text-white text-sm font-medium">{currentMoment.caption}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${getBgClass(currentMoment.background_color)}`}>
                            <p className="font-serif text-2xl md:text-3xl leading-relaxed italic max-w-xs">
                                "{currentMoment.caption || "Be still, and know..."}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Nav Controls (Desktop Only) */}
                <button 
                    onClick={handlePrev} 
                    className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hidden md:flex"
                    title="Previous"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext} 
                    className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hidden md:flex"
                    title="Next"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
