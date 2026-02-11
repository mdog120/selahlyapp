"use client";

import { useState, useEffect, useRef } from "react";
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



export function BibleReader({ book, chapter, onLoading }: BibleReaderProps) {
    const [data, setData] = useState<BibleResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Selection & Highlight State
    const [selection, setSelection] = useState<SelectedText | null>(null);
    const [shareData, setShareData] = useState<{ content: string, reference: string } | null>(null);
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
            } catch (err) {
                setError("Could not load chapter. Please check the reference.");
            } finally {
                setLoading(false);
                onLoading(false);
            }
        };

        fetchChapter();
        fetchChapter();
    }, [book, chapter, onLoading]);

    // Fetch User Highlights
    useEffect(() => {
        const fetchHighlights = async () => {
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
                    text: h.text, // Assuming full text matches are okay for now
                    color: h.color
                })));
            }
        };
        fetchHighlights();
    }, [book, chapter, userId]);

    // Handle Text Selection
    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed || sel.toString().trim() === "") {
                // Don't clear immediately if clicking menu
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const text = sel.toString();

            // Find verse ID context
            let verseId: number | undefined;
            // Iterate up from start container to find verse wrapper
            let node: Node | null = range.startContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

            while (node && node instanceof HTMLElement) {
                if (node.id?.startsWith("verse-")) {
                    verseId = parseInt(node.id.replace("verse-", ""));
                    break;
                }
                node = node.parentElement;
            }

            // Clean up text - Remove verse numbers if accidentally selected
            // Regex to remove leading digits & whitespace if at start
            const cleanText = text.replace(/^\d+\s*/, "").trim();

            if (!cleanText) return;

            setSelection({
                text: cleanText,
                rect,
                verseRef: `${book} ${chapter}${verseId ? `:${verseId}` : ''}`,
                verseId
            });
        };

        const handleDocClick = (e: MouseEvent) => {
            // Clear selection if clicking outside menu/selection
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

    const addHighlight = (colorId: string) => {
        if (!selection || !selection.verseId) return;

        const colorMap: Record<string, string> = {
            rose: "bg-soft-blush", // Changed from soft-rose to match globals
            sage: "bg-sage-green",
            lavender: "bg-purple-100",
            blue: "bg-blue-100",
        };

        const newHighlight = {
            verseId: selection.verseId,
            text: selection.text,
            color: colorMap[colorId] || "bg-yellow-200"
        };

        setHighlights(prev => [...prev, newHighlight]);

        // Persist to DB
        if (userId) {
            const saveHighlight = async () => {
                const { error } = await supabase
                    .from('bible_highlights')
                    .insert({
                        user_id: userId,
                        book: book,
                        chapter: chapter,
                        verse: selection.verseId,
                        text: selection.text,
                        color: colorMap[colorId] || "yellow"
                    });
                if (error) console.error("Error saving highlight", error);
            };
            saveHighlight();
        }

        // Clear selection
        window.getSelection()?.removeAllRanges();
        setSelection(null);
    };

    const renderVerseText = (verseId: number, text: string) => {
        const verseHighlights = highlights.filter(h => h.verseId === verseId);
        if (verseHighlights.length === 0) return text;

        // Simple overlay approach for MVP:
        // Split text by highlight phrases. 
        // Note: This is a basic implementation and won't handle overlapping highlights well.
        // It blindly highlights the *first* occurrence of the text in the verse fragment.

        let parts: React.ReactNode[] = [text];

        verseHighlights.forEach(h => {
            const newParts: React.ReactNode[] = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    if (part.includes(h.text)) {
                        const split = part.split(h.text);
                        // Join back with highlight wrapper
                        // Limitation: split invalidates if text appears multiple times, it highlights all or complex.
                        // We will just do the first split to be safe-ish for now.
                        const pre = split[0];
                        const post = split.slice(1).join(h.text); // reconstruct rest

                        if (pre) newParts.push(pre);
                        newParts.push(
                            <span key={`${verseId}-${h.text}-${Math.random()}`} className={`${h.color} rounded px-0.5 box-decoration-clone`}>
                                {h.text}
                            </span>
                        );
                        if (post) newParts.push(post); // Should recurse? 
                        // For MVP this simple split map is "Okay" but buggy for multiple same words.
                        // A better approach is index-based but we don't have indexes from api easily without more logic.
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
                {data?.verses.map((v) => (
                    <span key={v.verse} className="relative hover:bg-warm-grey/5 transition-colors duration-300 rounded px-1 -mx-1 block md:inline" id={`verse-${v.verse}`}>
                        <sup className="text-xs text-warm-grey/40 font-sans mr-1 select-none font-bold align-top top-2">{v.verse}</sup>
                        <span className="selection:bg-soft-rose/30 selection:text-warm-cocoa">
                            {renderVerseText(v.verse, v.text)}
                        </span>{" "}
                    </span>
                ))}
            </div>

            {selection && selection.rect && (
                <HighlightMenu
                    selection={selection}
                    onHighlight={addHighlight}
                    onShare={(type) => {
                        setShareData({
                            content: selection.text,
                            reference: selection.verseRef || `${book} ${chapter}`
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
