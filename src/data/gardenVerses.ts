export type FlowerType = 'daisy' | 'rose' | 'lily' | 'sunflower' | 'tulip';

export type GardenVerse = {
    id: string;
    text: string; // The verse text
    reference: string; // e.g. "Psalm 23:1"
    missingWord: string; // The word to guess (case insensitive)
    difficulty: 'easy' | 'medium' | 'hard';
};

export const FLOWERS: Record<FlowerType, { name: string, difficulty: 'easy' | 'medium' | 'hard', growthTimeMs: number, imageIndex: number }> = {
    'daisy': { name: "Daisy", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60, imageIndex: 0 }, // 1 Hour
    'rose': { name: "Rose", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 4, imageIndex: 1 }, // 4 Hours
    'lily': { name: "Lily", difficulty: 'hard', growthTimeMs: 1000 * 60 * 60 * 12, imageIndex: 2 }, // 12 Hours
    'sunflower': { name: "Sunflower", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 6, imageIndex: 3 }, // 6 Hours
    'tulip': { name: "Tulip", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60 * 2, imageIndex: 4 }, // 2 Hours
};

export const VERSES: GardenVerse[] = [
    // Easy
    { id: '1', text: "The Lord is my ______; I shall not want.", reference: "Psalm 23:1", missingWord: "shepherd", difficulty: 'easy' },
    { id: '2', text: "I can do all things through ______ who strengthens me.", reference: "Philippians 4:13", missingWord: "Christ", difficulty: 'easy' },
    { id: '3', text: "In the beginning ______ created the heavens and the earth.", reference: "Genesis 1:1", missingWord: "God", difficulty: 'easy' },

    // Medium
    { id: '4', text: "For I know the ______ I have for you, declares the Lord.", reference: "Jeremiah 29:11", missingWord: "plans", difficulty: 'medium' },
    { id: '5', text: "Trust in the Lord with all your ______ and lean not on your own understanding.", reference: "Proverbs 3:5", missingWord: "heart", difficulty: 'medium' },
    { id: '6', text: "But the fruit of the ______ is love, joy, peace, patience...", reference: "Galatians 5:22", missingWord: "Spirit", difficulty: 'medium' },

    // Hard
    { id: '7', text: "And we know that in all things God works for the ______ of those who love him.", reference: "Romans 8:28", missingWord: "good", difficulty: 'hard' },
    { id: '8', text: "Be ______ and know that I am God.", reference: "Psalm 46:10", missingWord: "still", difficulty: 'hard' },
    { id: '9', text: "The grass withers and the flowers fall, but the ______ of our God endures forever.", reference: "Isaiah 40:8", missingWord: "word", difficulty: 'hard' },
];

export const getRandomVerse = (difficulty: 'easy' | 'medium' | 'hard') => {
    const filtered = VERSES.filter(v => v.difficulty === difficulty);
    return filtered[Math.floor(Math.random() * filtered.length)];
};
