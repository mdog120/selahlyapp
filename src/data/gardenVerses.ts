export type FlowerType =
    | 'daisy' | 'rose' | 'lily' | 'sunflower' | 'tulip'
    | 'orchid' | 'peony' | 'lavender' | 'daffodil' | 'hibiscus'
    | 'cherry_blossom' | 'iris' | 'violet' | 'marigold' | 'lily_of_valley';

export type GardenVerse = {
    id: string;
    text: string; // The verse text
    reference: string; // e.g. "Psalm 23:1"
    missingWord: string; // The word to guess (case insensitive)
    difficulty: 'easy' | 'medium' | 'hard';
};

export const FLOWERS: Record<FlowerType, { name: string, difficulty: 'easy' | 'medium' | 'hard', growthTimeMs: number, cost: number }> = {
    // Original 5
    'daisy': { name: "Daisy", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60, cost: 10 },
    'tulip': { name: "Tulip", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60 * 2, cost: 20 },
    'sunflower': { name: "Sunflower", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 6, cost: 30 },
    'rose': { name: "Rose", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 4, cost: 50 },
    'lily': { name: "Lily", difficulty: 'hard', growthTimeMs: 1000 * 60 * 60 * 12, cost: 100 },

    // New 10
    'daffodil': { name: "Daffodil", difficulty: 'easy', growthTimeMs: 1000 * 60 * 45, cost: 15 },
    'marigold': { name: "Marigold", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60 * 1.5, cost: 15 },
    'violet': { name: "Violet", difficulty: 'easy', growthTimeMs: 1000 * 60 * 60 * 3, cost: 25 },

    'lavender': { name: "Lavender", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 5, cost: 40 },
    'peony': { name: "Peony", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 8, cost: 60 },
    'iris': { name: "Iris", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 7, cost: 55 },
    'hibiscus': { name: "Hibiscus", difficulty: 'medium', growthTimeMs: 1000 * 60 * 60 * 10, cost: 75 },

    'cherry_blossom': { name: "Cherry Blossom", difficulty: 'hard', growthTimeMs: 1000 * 60 * 60 * 18, cost: 120 },
    'orchid': { name: "Orchid", difficulty: 'hard', growthTimeMs: 1000 * 60 * 60 * 24, cost: 150 },
    'lily_of_valley': { name: "Lily of the Valley", difficulty: 'hard', growthTimeMs: 1000 * 60 * 60 * 48, cost: 250 },
};

export const VERSES: GardenVerse[] = [
    // --- EASY VERSES ---
    { id: 'e1', text: "The Lord is my ______; I shall not want.", reference: "Psalm 23:1", missingWord: "shepherd", difficulty: 'easy' },
    { id: 'e2', text: "I can do all things through ______ who strengthens me.", reference: "Philippians 4:13", missingWord: "Christ", difficulty: 'easy' },
    { id: 'e3', text: "In the beginning ______ created the heavens and the earth.", reference: "Genesis 1:1", missingWord: "God", difficulty: 'easy' },
    { id: 'e4', text: "For God so loved the ______ that he gave his one and only Son.", reference: "John 3:16", missingWord: "world", difficulty: 'easy' },
    { id: 'e5', text: "We love because he first ______ us.", reference: "1 John 4:19", missingWord: "loved", difficulty: 'easy' },
    { id: 'e6', text: "Jesus wept.", reference: "John 11:35", missingWord: "wept", difficulty: 'easy' },
    { id: 'e7', text: "Rejoice in the Lord ______.", reference: "Philippians 4:4", missingWord: "always", difficulty: 'easy' },
    { id: 'e8', text: "The Lord bless you and ______ you.", reference: "Numbers 6:24", missingWord: "keep", difficulty: 'easy' },
    { id: 'e9', text: "Your word is a ______ to my feet and a light to my path.", reference: "Psalm 119:105", missingWord: "lamp", difficulty: 'easy' },
    { id: 'e10', text: "Come to me, all you who are weary and burdened, and I will give you ______.", reference: "Matthew 11:28", missingWord: "rest", difficulty: 'easy' },
    { id: 'e11', text: "Cast all your anxiety on him because he ______ for you.", reference: "1 Peter 5:7", missingWord: "cares", difficulty: 'easy' },
    { id: 'e12', text: "When I am afraid, I put my ______ in you.", reference: "Psalm 56:3", missingWord: "trust", difficulty: 'easy' },

    // --- MEDIUM VERSES ---
    { id: 'm1', text: "For I know the ______ I have for you, declares the Lord.", reference: "Jeremiah 29:11", missingWord: "plans", difficulty: 'medium' },
    { id: 'm2', text: "Trust in the Lord with all your ______ and lean not on your own understanding.", reference: "Proverbs 3:5", missingWord: "heart", difficulty: 'medium' },
    { id: 'm3', text: "But the fruit of the ______ is love, joy, peace, patience...", reference: "Galatians 5:22", missingWord: "Spirit", difficulty: 'medium' },
    { id: 'm4', text: "Do not be anxious about anything, but in every situation, by prayer and ______...", reference: "Philippians 4:6", missingWord: "petition", difficulty: 'medium' },
    { id: 'm5', text: "The Lord will fight for you; you need only to be ______.", reference: "Exodus 14:14", missingWord: "still", difficulty: 'medium' },
    { id: 'm6', text: "He heals the brokenhearted and binds up their ______.", reference: "Psalm 147:3", missingWord: "wounds", difficulty: 'medium' },
    { id: 'm7', text: "Let all that you do be done in ______.", reference: "1 Corinthians 16:14", missingWord: "love", difficulty: 'medium' },
    { id: 'm8', text: "For the wages of sin is death, but the gift of God is eternal ______...", reference: "Romans 6:23", missingWord: "life", difficulty: 'medium' },
    { id: 'm9', text: "Therefore, if anyone is in Christ, he is a new ______.", reference: "2 Corinthians 5:17", missingWord: "creation", difficulty: 'medium' },
    { id: 'm10', text: "Be strong and ______.", reference: "Joshua 1:9", missingWord: "courageous", difficulty: 'medium' },
    { id: 'm11', text: "But those who hope in the Lord will renew their ______.", reference: "Isaiah 40:31", missingWord: "strength", difficulty: 'medium' },
    { id: 'm12', text: "Set your minds on things ______, not on earthly things.", reference: "Colossians 3:2", missingWord: "above", difficulty: 'medium' },
    { id: 'm13', text: "Create in me a pure heart, O God, and renew a ______ spirit within me.", reference: "Psalm 51:10", missingWord: "steadfast", difficulty: 'medium' },

    // --- HARD VERSES ---
    { id: 'h1', text: "And we know that in all things God works for the ______ of those who love him.", reference: "Romans 8:28", missingWord: "good", difficulty: 'hard' },
    { id: 'h2', text: "The grass withers and the flowers fall, but the ______ of our God endures forever.", reference: "Isaiah 40:8", missingWord: "word", difficulty: 'hard' },
    { id: 'h3', text: "Now faith is confidence in what we hope for and ______ about what we do not see.", reference: "Hebrews 11:1", missingWord: "assurance", difficulty: 'hard' },
    { id: 'h4', text: "But you are a chosen people, a royal priesthood, a holy ______...", reference: "1 Peter 2:9", missingWord: "nation", difficulty: 'hard' },
    { id: 'h5', text: "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and ______ in righteousness.", reference: "2 Timothy 3:16", missingWord: "training", difficulty: 'hard' },
    { id: 'h6', text: "For we are God's handiwork, created in Christ Jesus to do good ______...", reference: "Ephesians 2:10", missingWord: "works", difficulty: 'hard' },
    { id: 'h7', text: "And without faith it is ______ to please God.", reference: "Hebrews 11:6", missingWord: "impossible", difficulty: 'hard' },
    { id: 'h8', text: "Take delight in the Lord, and he will give you the ______ of your heart.", reference: "Psalm 37:4", missingWord: "desires", difficulty: 'hard' },
    { id: 'h9', text: "Therefore put on the full ______ of God, so that when the day of evil comes...", reference: "Ephesians 6:13", missingWord: "armor", difficulty: 'hard' },
    { id: 'h10', text: "If any of you lacks wisdom, you should ask God, who gives ______ to all without finding fault...", reference: "James 1:5", missingWord: "generously", difficulty: 'hard' },
];

export const getRandomVerse = (difficulty: 'easy' | 'medium' | 'hard') => {
    const filtered = VERSES.filter(v => v.difficulty === difficulty);
    return filtered[Math.floor(Math.random() * filtered.length)];
};
