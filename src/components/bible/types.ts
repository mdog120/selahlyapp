export type Verse = {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
};

export type BibleResponse = {
    reference: string;
    verses: Verse[];
    text: string;
    translation_id: string;
    translation_name: string;
    translation_note: string;
};

export type SelectedText = {
    text: string;
    rect: DOMRect | null;
    verseRef?: string; // e.g. "John 3:16"
    verseId?: number;
    highlightId?: string;
};

