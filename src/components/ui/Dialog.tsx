"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function Dialog({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => onOpenChange(false)}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={`p-6 ${className}`}>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4 text-center">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="font-serif text-xl font-bold text-warm-cocoa">{children}</h2>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="mt-6 flex justify-end gap-2">{children}</div>;
}

// Minimal trigger compatibility wrapper
export function DialogTrigger({ children, onClick }: any) {
    return <div onClick={onClick}>{children}</div>;
}
