"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BibleReader } from "../../components/bible/BibleReader";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Book } from "lucide-react";

const BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

import { Suspense } from "react";

// ... existing imports ...

// ... existing constants ...

function BiblePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialBook = searchParams.get("book") || "Genesis";
    const initialChapter = parseInt(searchParams.get("chapter") || "1");

    const [book, setBook] = useState(initialBook);
    const [chapter, setChapter] = useState(initialChapter);
    const [loading, setLoading] = useState(false);

    // Sync state with URL if params change externally
    useEffect(() => {
        const b = searchParams.get("book");
        const c = searchParams.get("chapter");
        if (b) setBook(b);
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
        <div className="min-h-screen bg-warm-paper font-serif transition-colors duration-500">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-8 bg-white/50 p-4 rounded-2xl backdrop-blur-sm border border-warm-grey/10 sticky top-4 z-40 shadow-sm">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/home")} className="text-warm-grey/50 hover:text-warm-cocoa">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Home
                    </Button>

                    <div className="flex items-center gap-2">
                        <select
                            value={book}
                            onChange={(e) => handleNavigate(e.target.value, 1)}
                            className="bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none cursor-pointer hover:bg-white/50 rounded-lg p-1"
                        >
                            {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <span className="text-warm-grey/40">Ch.</span>
                        <input
                            type="number"
                            value={chapter}
                            onChange={(e) => handleNavigate(book, parseInt(e.target.value) || 1)}
                            className="w-16 bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none p-1"
                        />
                    </div>

                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" disabled={chapter <= 1} onClick={prevChapter}>
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={nextChapter}>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Reader Content */}
                <div className="min-h-[60vh] bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-warm-grey/5 mb-20 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-soft-rose/10 to-transparent rounded-tr-3xl pointer-events-none" />
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-transparent rounded-tl-3xl pointer-events-none" />

                    <BibleReader book={book} chapter={chapter} onLoading={setLoading} />
                </div>
            </div>
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
