"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BibleReader } from "../../components/bible/BibleReader";
import { CommunityHighlights } from "@/components/bible/CommunityHighlights";
import { YourNotes } from "@/components/bible/YourNotes";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Book, Home } from "lucide-react";
import { QuietTimeAudio } from "@/components/ui/QuietTimeAudio";

const BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

import { Suspense } from "react";

// ... existing imports ...

// ... existing constants ...

const normalizeBookName = (name: string | null): string => {
    if (!name) return "Genesis";
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === "psalm") return "Psalms";
    // Capitalize first letter to match BOOKS options
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

function BiblePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialBook = normalizeBookName(searchParams.get("book"));
    const initialChapter = parseInt(searchParams.get("chapter") || "1");

    const [book, setBook] = useState(initialBook);
    const [chapter, setChapter] = useState(initialChapter);
    const [loading, setLoading] = useState(false);

    // Sync state with URL if params change externally
    useEffect(() => {
        const b = searchParams.get("book");
        const c = searchParams.get("chapter");
        if (b) setBook(normalizeBookName(b));
        if (c) setChapter(parseInt(c));
    }, [searchParams]);

    const handleNavigate = (newBook: string, newChapter: number) => {
        setBook(newBook);
        setChapter(newChapter);
        router.push(`/bible?book=${encodeURIComponent(newBook)}&chapter=${newChapter}`);
    };

    const nextChapter = () => {
        handleNavigate(book, chapter + 1);
    };

    const prevChapter = () => {
        if (chapter > 1) {
            handleNavigate(book, chapter - 1);
        }
    };

    return (
        <div className="min-h-screen bg-warm-paper font-serif transition-colors duration-500 max-w-full overflow-x-hidden">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8 bg-white/50 p-3 sm:p-4 rounded-2xl backdrop-blur-sm border border-warm-grey/10 sticky top-4 z-40 shadow-sm max-w-full">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/home")} className="text-warm-grey/50 hover:text-warm-cocoa px-2 sm:px-3">
                        <Home className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Home</span>
                    </Button>

                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <select
                            value={book}
                            onChange={(e) => handleNavigate(e.target.value, 1)}
                            className="bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none cursor-pointer hover:bg-white/50 rounded-lg p-1 w-[90px] sm:w-auto truncate"
                        >
                            {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <span className="text-warm-grey/40 text-sm sm:text-base">Ch.</span>
                        <input
                            type="number"
                            value={chapter}
                            onChange={(e) => handleNavigate(book, parseInt(e.target.value) || 1)}
                            className="w-10 sm:w-16 bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none p-1 text-center"
                        />
                    </div>

                    <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" disabled={chapter <= 1} onClick={prevChapter} className="p-1 sm:p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={nextChapter} className="p-1 sm:p-2">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content: Bible Reader */}
                    <div className="lg:col-span-8">
                        <div className="min-h-[60vh] bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-warm-grey/5 mb-20 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-soft-rose/10 to-transparent rounded-tr-3xl pointer-events-none" />
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-transparent rounded-tl-3xl pointer-events-none" />

                            <BibleReader book={book} chapter={chapter} onLoading={setLoading} />
                        </div>
                    </div>

                    {/* Sidebar: Widgets */}
                    <div className="lg:col-span-4 space-y-6">
                        <CommunityHighlights />
                        <YourNotes />
                    </div>
                </div>
            </div>
            <QuietTimeAudio />
        </div>
    );
}

export default function BiblePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-warm-paper flex items-center justify-center text-warm-grey">Loading Scripture...</div>}>
            <BiblePageContent />
        </Suspense>
    );
}
