import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MarqueeProps {
    children: ReactNode;
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
}

export function Marquee({
    children,
    className,
    reverse = false,
    pauseOnHover = false,
}: MarqueeProps) {
    return (
        <div
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                className
            )}
        >
            <div
                className={cn(
                    "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row",
                    {
                        "animate-marquee-reverse": reverse,
                        "group-hover:[animation-play-state:paused]": pauseOnHover,
                    }
                )}
            >
                {children}
            </div>
            <div
                className={cn(
                    "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row",
                    {
                        "animate-marquee-reverse": reverse,
                        "group-hover:[animation-play-state:paused]": pauseOnHover,
                    }
                )}
            >
                {children}
            </div>
        </div>
    );
}
