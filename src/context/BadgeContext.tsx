"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { BadgeUnlockModal } from "@/components/gamification/BadgeUnlockModal";
import { Sun, Feather, Sparkles } from "lucide-react";

type BadgeContextType = {
    triggerBadge: (name: string, description: string, icon?: ReactNode) => void;
};

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export function BadgeProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [badgeName, setBadgeName] = useState("");
    const [badgeDescription, setBadgeDescription] = useState("");
    const [badgeIcon, setBadgeIcon] = useState<ReactNode | undefined>(undefined);

    const triggerBadge = (name: string, description: string, icon?: ReactNode) => {
        setBadgeName(name);
        setBadgeDescription(description);
        setBadgeIcon(icon);
        setIsOpen(true);
    };

    useEffect(() => {
        // Delay slightly to let page transitions settle
        const timer = setTimeout(() => {
            const stored = localStorage.getItem('justEarnedBadge');
            if (stored) {
                try {
                    const badge = JSON.parse(stored);
                    let icon: ReactNode | undefined;
                    if (badge.name === 'Sunshine') {
                        icon = <Sun className="w-12 h-12 text-yellow-500 fill-yellow-500/20" />;
                    } else if (badge.name === 'Voice of Grace') {
                        icon = <Feather className="w-12 h-12 text-blue-400" />;
                    } else {
                        icon = <Sparkles className="w-12 h-12 text-yellow-400" />;
                    }
                    triggerBadge(badge.name, badge.description, icon);
                    localStorage.removeItem('justEarnedBadge');
                } catch (e) {
                    console.error(e);
                }
            }
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <BadgeContext.Provider value={{ triggerBadge }}>
            {children}
            <BadgeUnlockModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                badgeName={badgeName}
                badgeDescription={badgeDescription}
                icon={badgeIcon}
            />
        </BadgeContext.Provider>
    );
}

export function useBadge() {
    const context = useContext(BadgeContext);
    if (context === undefined) {
        throw new Error("useBadge must be used within a BadgeProvider");
    }
    return context;
}
