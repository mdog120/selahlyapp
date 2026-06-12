"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutContentProps {
    children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();
    const isGraceInhale = pathname === "/grace-inhale";

    const transitionVariants = {
        initial: { opacity: 0, x: 12 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
    };

    if (isGraceInhale) {
        return (
            <div className="flex flex-col min-h-screen overflow-x-hidden">
                <main className="flex-1 w-full h-full">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={pathname}
                            variants={transitionVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
                            className="w-full h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden">
            <Navbar />
            <main className="flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        variants={transitionVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
                        className="w-full h-full"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
            <BottomNav />
        </div>
    );
}
