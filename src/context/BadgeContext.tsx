"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { BadgeUnlockModal } from "@/components/gamification/BadgeUnlockModal";

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
