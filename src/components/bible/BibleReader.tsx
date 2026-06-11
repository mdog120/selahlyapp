"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HighlightMenu } from "@/components/bible/HighlightMenu";
import { ShareModal } from "@/components/bible/ShareModal";
import { Loader2 } from "lucide-react";
import { BibleResponse, SelectedText } from "./types";
import { createClient } from "@/lib/supabase/client";

interface BibleReaderProps {
    book: string;
    chapter: number;
    onLoading: (loading: boolean) => void;
}

// Map database color string (IDs like 'rose' or class names like 'bg-soft-blush') to theme-compliant Tailwind background classes
const getColorClass = (colorVal: string): string => {
    const clean = colorVal?.toLowerCase() || '';
    if (clean.includes('rose') || clean.includes('blush')) return 'bg-soft-blush';
    if (clean.includes('sage') || clean.includes('green')) return 'bg-sage-green';
    if (clean.includes('lavender') || clean.includes('purple')) return 'bg-purple-100';
    if (clean.includes('blue') || clean.includes('sky')) return 'bg-blue-100';
    return 'bg-yellow-200'; // Default yellow highlight
};

export function BibleReader({ book, chapter, onLoading }: BibleReaderProps) {
    const [data, setData] = useState<BibleResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Selection & Highlight State
    const [selection, setSelection] = useState<SelectedText | null>(null);
    const [shareData, setShareData] = useState<{
        content: string;
        reference: string;
        book?: string;
        chapter?: number;
        verse?: number;
    } | null>(null);
    const [highlights, setHighlights] = useState<{ id?: string; verseId: number; text: string; color: string }[]>([]);

    // Auth & DB
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);

    // Initial Auth Check
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        checkUser();
    }, []);

    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchChapter = async () => {
            setLoading(true);
            onLoading(true);
            setError(null);
            try {
                const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=kjv`);
                if (!res.ok) throw new Error("Could not find chapter");
                const json = await res.json();
                setData(json);

                // Record Bible Read for "Rooted" Badge
                // Only record if successful load
                if (userId) {
                    await supabase.rpc('record_bible_read');
                }
            } catch (err) {
                setError("Could not load chapter. Please check the reference.");
            } finally {
                setLoading(false);
                onLoading(false);
            }
        };

        fetchChapter();
    }, [book, chapter, onLoading, userId]);

    // Fetch User Highlights
    const fetchHighlights = useCallback(async () => {
        if (!userId) return;
        const { data } = await supabase
            .from('bible_highlights')
            .select('*')
            .eq('user_id', userId)
            .eq('book', book)
            .eq('chapter', chapter);

        if (data) {
            setHighlights(data.map(h => ({
                id: h.id,
                verseId: h.verse,
                text: h.text,
                color: getColorClass(h.color)
            })));
        }
    }, [book, chapter, userId, supabase]);

    useEffect(() => {
        fetchHighlights();
    }, [fetchHighlights]);

    // Handle Text Selection
    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.toString().trim() === "") {
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const text = sel.toString();

            // Find verse ID context
            let startVerseId: number | undefined;
            let startNode: Node | null = range.startContainer;
            if (startNode.nodeType === Node.TEXT_NODE) startNode = startNode.parentElement;

            while (startNode && startNode instanceof HTMLElement) {
                if (startNode.id?.startsWith("verse-")) {
                    startVerseId = parseInt(startNode.id.replace("verse-", ""));
                    break;
                }
                startNode = startNode.parentElement;
            }

            let endVerseId: number | undefined;
            let endNode: Node | null = range.endContainer;
            if (endNode.nodeType === Node.TEXT_NODE) endNode = endNode.parentElement;

            while (endNode && endNode instanceof HTMLElement) {
                if (endNode.id?.startsWith("verse-")) {
                    endVerseId = parseInt(endNode.id.replace("verse-", ""));
                    break;
                }
                endNode = endNode.parentElement;
            }

            // If selection crosses multiple verses, or is not in a verse, ignore
            if (!startVerseId || startVerseId !== endVerseId) {
                return;
            }

            const verseId = startVerseId;

            // Clean up text - Remove verse numbers if accidentally selected
            const cleanText = text.replace(/^\d+\s*/, "").trim();

            if (!cleanText) return;

            setSelection({
                text: cleanText,
                rect,
                verseRef: `${book} ${chapter}:${verseId}`,
                verseId
            });
        };

        const handleDocClick = (e: MouseEvent) => {
            // Ignore clicks originating inside the highlight menu
            const target = e.target as HTMLElement;
            if (target.closest('[data-highlight-menu="true"]')) {
                return;
            }

            // Clear selection if clicking outside
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
            }
        };

        document.addEventListener("selectionchange", handleSelection);
        document.addEventListener("mousedown", handleDocClick);
        return () => {
            document.removeEventListener("selectionchange", handleSelection);
            document.removeEventListener("mousedown", handleDocClick);
        };
    }, [book, chapter]);

    // Handle clicking a verse directly (for ease of highlighting, particularly on mobile)
    const handleVerseClick = (e: React.MouseEvent<HTMLSpanElement>, verseId: number, verseText: string) => {
        // If the user has active text selection, do not intercept as tap selection
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim() !== "") {
            return;
        }

        // If clicking the currently selected verse again, deselect it
        if (selection && selection.verseId === verseId && !selection.highlightId) {
            setSelection(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        
        // Check if there is an existing highlight on this verse
        const existingHighlight = highlights.find(h => h.verseId === verseId);

        if (existingHighlight) {
            setSelection({
                text: existingHighlight.text,
                rect,
                verseRef: `${book} ${chapter}:${verseId}`,
                verseId,
                highlightId: existingHighlight.id
            });
        } else {
            setSelection({
                text: verseText,
                rect,
                verseRef: `${book} ${chapter}:${verseId}`,
                verseId
            });
        }
    };

    const addHighlight = async (colorId: string) => {
        if (!selection || !selection.verseId) return;

        const colorMap: Record<string, string> = {
            rose: "bg-soft-blush",
            sage: "bg-sage-green",
            lavender: "bg-purple-100",
            blue: "bg-blue-100",
        };

        const newColorClass = colorMap[colorId] || "bg-yellow-200";

        if (selection.highlightId) {
            // Update existing highlight color (optimistic UI update)
            setHighlights(prev => prev.map(h => 
                h.id === selection.highlightId 
                    ? { ...h, color: newColorClass } 
                    : h
            ));

            if (userId) {
                const { error } = await supabase
                    .from('bible_highlights')
                    .update({ color: colorId })
                    .eq('id', selection.highlightId);
                if (error) console.error("Error updating highlight color", error);
            }
        } else {
            // Create a new highlight.
            // If user highlights the whole verse, clean up any existing highlights in that verse to prevent overlaps
            const verseRefText = data?.verses.find(v => v.verse === selection.verseId)?.text || "";
            const isFullVerse = selection.text.trim() === verseRefText.trim();

            if (isFullVerse && userId) {
                await supabase
                    .from('bible_highlights')
                    .delete()
                    .eq('user_id', userId)
                    .eq('book', book)
                    .eq('chapter', chapter)
                    .eq('verse', selection.verseId);
                
                setHighlights(prev => prev.filter(h => h.verseId !== selection.verseId));
            }

            const tempId = `temp-${Math.random()}`;
            const newHighlight = {
                id: tempId,
                verseId: selection.verseId,
                text: selection.text,
                color: newColorClass
            };

            setHighlights(prev => [...prev, newHighlight]);

            // Persist to DB
            if (userId) {
                const { data: savedData, error } = await supabase
                    .from('bible_highlights')
                    .insert({
                        user_id: userId,
                        book: book,
                        chapter: chapter,
                        verse: selection.verseId,
                        text: selection.text,
                        color: colorId
                    })
                    .select('id')
                    .single();

                if (error) {
                    console.error("Error saving highlight", error);
                    // Rollback on error
                    setHighlights(prev => prev.filter(h => h.id !== tempId));
                } else if (savedData) {
                    // Update the state with the real database ID
                    setHighlights(prev => prev.map(h => 
                        h.id === tempId ? { ...h, id: savedData.id } : h
                    ));
                }
            }
        }

        // Clear selection
        window.getSelection()?.removeAllRanges();
        setSelection(null);
    };

    const deleteHighlight = async () => {
        if (!selection || !selection.highlightId) return;

        const targetId = selection.highlightId;

        // Optimistic UI update
        setHighlights(prev => prev.filter(h => h.id !== targetId));
        setSelection(null);

        if (userId) {
            const { error } = await supabase
                .from('bible_highlights')
                .delete()
                .eq('id', targetId);

            if (error) {
                console.error("Error deleting highlight", error);
                // Revert on error by refetching
                fetchHighlights();
            }
        }
    };

    const renderVerseText = (verseId: number, text: string) => {
        const verseHighlights = highlights.filter(h => h.verseId === verseId);
        if (verseHighlights.length === 0) return text;

        let parts: React.ReactNode[] = [text];

        verseHighlights.forEach(h => {
            const newParts: React.ReactNode[] = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    if (part.includes(h.text)) {
                        const split = part.split(h.text);
                        const pre = split[0];
                        const post = split.slice(1).join(h.text); // Reconstruct rest of occurrences

                        if (pre) newParts.push(pre);
                        newParts.push(
                            <span key={`${verseId}-${h.text}-${Math.random()}`} className={`${h.color} rounded px-0.5 box-decoration-clone`}>
                                {h.text}
                            </span>
                        );
                        if (post) newParts.push(post);
                    } else {
                        newParts.push(part);
                    }
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return parts;
    };

    if (loading) return <div className="flex h-40 items-center justify-center text-warm-grey/40"><Loader2 className="animate-spin w-8 h-8" /></div>;
    if (error) return <div className="text-red-400 text-center py-10 font-serif">{error}</div>;

    return (
        <div className="relative animate-fade-in" ref={contentRef}>
            <h2 className="font-serif text-3xl text-warm-cocoa mb-6 text-center">{data?.reference}</h2>

            <div className="space-y-4 font-serif text-lg leading-loose text-warm-grey select-text">
                {data?.verses.map((v) => {
                    const isSelected = selection?.verseId === v.verse && !selection.highlightId;
                    
                    return (
                        <span 
                            key={v.verse} 
                            className={`relative hover:bg-warm-grey/5 transition-colors duration-300 rounded px-1 -mx-1 block md:inline cursor-pointer ${
                                isSelected ? 'bg-warm-cocoa/5 ring-1 ring-warm-cocoa/10 shadow-sm' : ''
                            }`} 
                            id={`verse-${v.verse}`}
                            onClick={(e) => handleVerseClick(e, v.verse, v.text)}
                        >
                            <sup className="text-xs text-warm-grey/40 font-sans mr-1 select-none font-bold align-top top-2">{v.verse}</sup>
                            <span className="selection:bg-soft-rose/30 selection:text-warm-cocoa">
                                {renderVerseText(v.verse, v.text)}
                            </span>{" "}
                        </span>
                    );
                })}
            </div>

            {selection && selection.rect && (
                <HighlightMenu
                    selection={selection}
                    onHighlight={addHighlight}
                    onDelete={deleteHighlight}
                    onShare={(type) => {
                        setShareData({
                            content: selection.text,
                            reference: selection.verseRef || `${book} ${chapter}`,
                            book: book,
                            chapter: chapter,
                            verse: selection.verseId
                        });
                        setSelection(null);
                    }}
                />
            )}

            {shareData && (
                <ShareModal
                    data={shareData}
                    onClose={() => setShareData(null)}
                />
            )}
        </div>
    );
}
