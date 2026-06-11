"use client";

import { SelectedText } from "./types";
import { MessageCircle, PenLine, Share2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface HighlightMenuProps {
    selection: SelectedText;
    onHighlight: (color: string) => void;
    onShare: (type: 'lilypad' | 'notes') => void;
    onDelete?: () => void;
}

const COLORS = [
    { id: "rose", bg: "bg-soft-blush", hex: "#FCEADE" }, // Soft Blush
    { id: "sage", bg: "bg-sage-green", hex: "#D8E2DC" }, // Sage
    { id: "lavender", bg: "bg-purple-100", hex: "#E9D5FF" }, // Lavender
    { id: "blue", bg: "bg-blue-100", hex: "#DBEAFE" }, // Sky
];

export function HighlightMenu({ selection, onHighlight, onShare, onDelete }: HighlightMenuProps) {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (selection.rect) {
            // Position above the selection
            const top = selection.rect.top + window.scrollY - 60;
            let left = selection.rect.left + (selection.rect.width / 2) - 100; // Center approximation
            
            // Clamp position so it doesn't overflow mobile screens
            if (typeof window !== "undefined") {
                const menuWidth = 220; // estimate based on elements
                const padding = 12;
                const maxLeft = window.innerWidth - menuWidth - padding;
                left = Math.max(padding, Math.min(left, maxLeft));
            }
            
            setPosition({ top, left });
        }
    }, [selection]);

    if (!selection.rect) return null;

    return createPortal(
        <div
            className="absolute z-50 flex items-center gap-2 bg-white rounded-full shadow-xl border border-warm-grey/10 p-2 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()}
            data-highlight-menu="true"
        >
            {/* Colors */}
            <div className="flex items-center gap-1 pr-2 border-r border-gray-100">
                {COLORS.map((c) => (
                    <button
                        key={c.id}
                        onClick={() => onHighlight(c.id)}
                        className={`w-6 h-6 rounded-full ${c.bg} hover:scale-110 transition-transform border border-black/5 cursor-pointer`}
                        title={`Highlight ${c.id}`}
                    />
                ))}
            </div>

            {/* Actions */}
            <button
                onClick={() => onShare('lilypad')}
                className="p-1.5 text-warm-grey hover:text-warm-cocoa hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                title="Share to Lily Pad"
            >
                <Share2 className="w-4 h-4" />
            </button>

            <button
                onClick={() => onShare('notes')}
                className="p-1.5 text-warm-grey hover:text-warm-cocoa hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                title="Add to Selahly Notes"
            >
                <PenLine className="w-4 h-4" />
            </button>

            {selection.highlightId && onDelete && (
                <button
                    onClick={onDelete}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors border-l border-gray-100 pl-2 ml-1 cursor-pointer"
                    title="Delete Highlight"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>,
        document.body
    );
}
