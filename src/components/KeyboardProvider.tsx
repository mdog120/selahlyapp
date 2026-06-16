"use client";

import { useEffect } from "react";

/**
 * Global keyboard detector.
 * Adds a `keyboard-open` class to <html> when the mobile virtual keyboard is visible.
 * Any component/CSS can react to this class without needing its own detection logic.
 */
export function KeyboardProvider() {
    useEffect(() => {
        if (typeof window === "undefined" || !window.visualViewport) return;

        const vv = window.visualViewport;
        const threshold = 0.75; // If viewport < 75% of window height, keyboard is likely open

        const handleResize = () => {
            const ratio = vv.height / window.innerHeight;
            if (ratio < threshold) {
                document.documentElement.classList.add("keyboard-open");
            } else {
                document.documentElement.classList.remove("keyboard-open");
            }
        };

        vv.addEventListener("resize", handleResize);
        return () => {
            vv.removeEventListener("resize", handleResize);
            document.documentElement.classList.remove("keyboard-open");
        };
    }, []);

    return null; // No UI, just the side effect
}
