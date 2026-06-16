// ─── Bible-Themed Card Deck ─────────────────────────────────
// 4 Suits × 13 Ranks = 52 Cards
// Each suit represents a biblical era with unique face characters

export type Suit = "patriarchs" | "kingdom" | "prophets" | "gospel";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    character?: string; // Bible character name (face cards only)
    emoji?: string;     // Character emoji (face cards only)
    value: number;      // Numeric value for comparison (A=14, K=13, Q=12, J=11)
}

export interface SuitInfo {
    name: string;
    symbol: string;
    color: string;      // Tailwind text color
    bgColor: string;    // Tailwind bg color
    borderColor: string;
}

// ─── Suit Definitions ───────────────────────────────────────

export const SUITS: Record<Suit, SuitInfo> = {
    patriarchs: {
        name: "Patriarchs",
        symbol: "🌿",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
    },
    kingdom: {
        name: "Kingdom",
        symbol: "⭐",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
    },
    prophets: {
        name: "Prophets",
        symbol: "🕊️",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
    },
    gospel: {
        name: "Gospel",
        symbol: "🌸",
        color: "text-pink-700",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
    },
};

// ─── Face Card → Bible Character Mapping ────────────────────

export const FACE_CARDS: Record<Suit, Record<"K" | "Q" | "J" | "A", { character: string; emoji: string }>> = {
    patriarchs: {
        K: { character: "Abraham", emoji: "👴" },
        Q: { character: "Sarah", emoji: "👩" },
        J: { character: "Isaac", emoji: "👦" },
        A: { character: "Jacob", emoji: "🤼" },
    },
    kingdom: {
        K: { character: "David", emoji: "👑" },
        Q: { character: "Esther", emoji: "💎" },
        J: { character: "Solomon", emoji: "🦁" },
        A: { character: "Joshua", emoji: "⚔️" },
    },
    prophets: {
        K: { character: "Moses", emoji: "🔥" },
        Q: { character: "Miriam", emoji: "🪘" },
        J: { character: "Elijah", emoji: "🌪️" },
        A: { character: "Daniel", emoji: "🦁" },
    },
    gospel: {
        K: { character: "Jesus", emoji: "✝️" },
        Q: { character: "Mary", emoji: "🌹" },
        J: { character: "Peter", emoji: "🗝️" },
        A: { character: "Paul", emoji: "✉️" },
    },
};

// ─── Rank Values ────────────────────────────────────────────

const RANK_VALUES: Record<Rank, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6,
    "7": 7, "8": 8, "9": 9, "10": 10,
    J: 11, Q: 12, K: 13, A: 14,
};

const ALL_RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const ALL_SUITS: Suit[] = ["patriarchs", "kingdom", "prophets", "gospel"];

// ─── Deck Functions ─────────────────────────────────────────

export function createDeck(): Card[] {
    const deck: Card[] = [];

    for (const suit of ALL_SUITS) {
        for (const rank of ALL_RANKS) {
            const isFace = rank === "K" || rank === "Q" || rank === "J" || rank === "A";
            const faceInfo = isFace ? FACE_CARDS[suit][rank as "K" | "Q" | "J" | "A"] : undefined;

            deck.push({
                id: `${suit}-${rank}`,
                suit,
                rank,
                character: faceInfo?.character,
                emoji: faceInfo?.emoji,
                value: RANK_VALUES[rank],
            });
        }
    }

    return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Deal cards equally to N players.
 * Returns an array of N hands (card arrays).
 * Extra cards go to earlier players.
 */
export function dealCards(deck: Card[], playerCount: number): Card[][] {
    const hands: Card[][] = Array.from({ length: playerCount }, () => []);
    const shuffled = shuffleDeck(deck);

    shuffled.forEach((card, i) => {
        hands[i % playerCount].push(card);
    });

    return hands;
}

export function isFaceCard(rank: Rank): boolean {
    return rank === "A" || rank === "K" || rank === "Q" || rank === "J";
}

export function getRankDisplay(rank: Rank): string {
    return rank;
}
