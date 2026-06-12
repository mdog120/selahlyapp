import React from "react";

interface BowLogoProps {
    className?: string;
    size?: number | string;
}

export function BowLogo({ className = "", size }: BowLogoProps) {
    const customStyle = size ? { fontSize: size } : undefined;
    return (
        <span 
            className={`font-serif select-none inline-block tracking-normal leading-none text-muted-rose ${className}`}
            style={customStyle}
        >
            ౨ৎ
        </span>
    );
}

