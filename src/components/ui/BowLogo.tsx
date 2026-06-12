import React from "react";

interface BowLogoProps {
    className?: string;
    size?: number | string;
}

export function BowLogo({ className = "", size }: BowLogoProps) {
    const sizeStyle = size ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
    } : {
        width: '1em',
        height: '1em',
    };

    return (
        <img 
            src="/images/selahly_bow.png" 
            alt="Selahly Bow" 
            className={`inline-block select-none object-contain ${className}`}
            style={sizeStyle}
        />
    );
}

