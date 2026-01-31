import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "outline";
    size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-warm-cocoa/20 disabled:opacity-50 disabled:pointer-events-none active:scale-95",
                    {
                        "bg-warm-cocoa text-white hover:bg-warm-cocoa/90 shadow-md hover:shadow-lg hover:shadow-warm-cocoa/20": variant === "primary",
                        "bg-soft-blush text-warm-cocoa hover:bg-muted-rose/20": variant === "secondary",
                        "border border-warm-cocoa/30 text-warm-cocoa hover:bg-warm-cocoa/5": variant === "outline",
                        "text-warm-grey hover:text-warm-cocoa hover:bg-warm-cocoa/5": variant === "ghost",

                        "h-9 px-4 text-sm": size === "sm",
                        "h-11 px-8 text-base": size === "md",
                        "h-14 px-10 text-lg": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, cn };
