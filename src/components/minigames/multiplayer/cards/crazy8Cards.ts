// ─── Christian Crazy 8s — Card Definitions ──────────────────
// 4 Virtue Suits × 13 Ranks + 4 Wild Characters + 4 Virtue +4 = 60 cards

export type Suit = "love" | "faith" | "hope" | "grace";
export type SpecialType = "wild" | "plus4";

export interface GameCard {
    id: string;
    suit: Suit | null;        // null for wild/+4 cards
    rank: number | null;      // 0-9, null for action/wild cards
    type: "number" | "skip" | "reverse" | "draw2" | "wild" | "plus4";
    character: string;        // Bible character or virtue name
    emoji: string;
    label: string;            // Display label
}

export interface SuitInfo {
    name: string;
    symbol: string;
    color: string;
    bgColor: string;
    borderColor: string;
    ringColor: string;
}

// ─── Suit Definitions ───────────────────────────────────────

export const SUITS: Record<Suit, SuitInfo> = {
    love: {
        name: "Love",
        symbol: "❤️",
        color: "text-rose-700",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        ringColor: "ring-rose-400",
    },
    faith: {
        name: "Faith",
        symbol: "⭐",
        color: "text-amber-700",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        ringColor: "ring-amber-400",
    },
    hope: {
        name: "Hope",
        symbol: "🕊️",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        ringColor: "ring-blue-400",
    },
    grace: {
        name: "Grace",
        symbol: "🌿",
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        ringColor: "ring-emerald-400",
    },
};

// ─── Bible Characters for Number Cards ──────────────────────
// Each number (0-9) has a Bible character

const NUMBER_CHARACTERS: { character: string; emoji: string }[] = [
    { character: "Adam", emoji: "🌱" },
    { character: "Noah", emoji: "🌊" },
    { character: "Abraham", emoji: "⭐" },
    { character: "Sarah", emoji: "👩" },
    { character: "Jacob", emoji: "🤼" },
    { character: "Joseph", emoji: "🧥" },
    { character: "Ruth", emoji: "🌾" },
    { character: "Samuel", emoji: "📖" },
    { character: "Solomon", emoji: "👑" },
    { character: "Esther", emoji: "💎" },
];

// ─── Action Card Characters ─────────────────────────────────

const SKIP_CHARACTERS: Record<Suit, { character: string; emoji: string }> = {
    love: { character: "Jonah", emoji: "🐋" },      // Jonah ran from God
    faith: { character: "Pharaoh", emoji: "🐍" },   // Hardened heart
    hope: { character: "Goliath", emoji: "⚔️" },    // Blocked the way
    grace: { character: "Judas", emoji: "💰" },      // Betrayer
};

const REVERSE_CHARACTERS: Record<Suit, { character: string; emoji: string }> = {
    love: { character: "Paul", emoji: "✉️" },       // Changed direction
    faith: { character: "Peter", emoji: "🗝️" },    // Denied then reversed
    hope: { character: "Saul", emoji: "⚡" },       // Became Paul
    grace: { character: "Zacchaeus", emoji: "🌳" }, // Turned his life around
};

const DRAW2_CHARACTERS: Record<Suit, { character: string; emoji: string }> = {
    love: { character: "Samson", emoji: "💪" },     // Strength
    faith: { character: "Joshua", emoji: "🏰" },   // Walls fell
    hope: { character: "Elijah", emoji: "🔥" },    // Fire from heaven
    grace: { character: "Daniel", emoji: "🦁" },   // Lions' den
};

// ─── Wild Cards (Bible Characters) ──────────────────────────

const WILD_CARDS = [
    { character: "Moses", emoji: "🔥", label: "Wild — Moses" },
    { character: "David", emoji: "👑", label: "Wild — David" },
    { character: "Miriam", emoji: "🪘", label: "Wild — Miriam" },
    { character: "Mary", emoji: "🌹", label: "Wild — Mary" },
];

// ─── Virtue +4 Cards ────────────────────────────────────────

const PLUS4_CARDS = [
    { character: "Patience", emoji: "🙏", label: "+4 Patience" },
    { character: "Kindness", emoji: "💝", label: "+4 Kindness" },
    { character: "Joy", emoji: "✨", label: "+4 Joy" },
    { character: "Peace", emoji: "☮️", label: "+4 Peace" },
];

// ─── Deck Creation ──────────────────────────────────────────

const ALL_SUITS: Suit[] = ["love", "faith", "hope", "grace"];

export function createCrazy8Deck(): GameCard[] {
    const deck: GameCard[] = [];
    let idCounter = 0;

    for (const suit of ALL_SUITS) {
        // Number cards 0-9 (two of each 0, one of 1-9... actually for Crazy 8 let's do one of each)
        for (let rank = 0; rank <= 9; rank++) {
            const char = NUMBER_CHARACTERS[rank];
            deck.push({
                id: `c${idCounter++}`,
                suit,
                rank,
                type: "number",
                character: char.character,
                emoji: char.emoji,
                label: `${rank}`,
            });
        }

        // Skip card
        const skip = SKIP_CHARACTERS[suit];
        deck.push({
            id: `c${idCounter++}`,
            suit,
            rank: null,
            type: "skip",
            character: skip.character,
            emoji: skip.emoji,
            label: "Skip",
        });

        // Reverse card
        const rev = REVERSE_CHARACTERS[suit];
        deck.push({
            id: `c${idCounter++}`,
            suit,
            rank: null,
            type: "reverse",
            character: rev.character,
            emoji: rev.emoji,
            label: "Reverse",
        });

        // Draw 2 card
        const d2 = DRAW2_CHARACTERS[suit];
        deck.push({
            id: `c${idCounter++}`,
            suit,
            rank: null,
            type: "draw2",
            character: d2.character,
            emoji: d2.emoji,
            label: "+2",
        });
    }

    // 4 Wild cards
    for (const wild of WILD_CARDS) {
        deck.push({
            id: `c${idCounter++}`,
            suit: null,
            rank: null,
            type: "wild",
            character: wild.character,
            emoji: wild.emoji,
            label: wild.label,
        });
    }

    // 4 Virtue +4 cards
    for (const v4 of PLUS4_CARDS) {
        deck.push({
            id: `c${idCounter++}`,
            suit: null,
            rank: null,
            type: "plus4",
            character: v4.character,
            emoji: v4.emoji,
            label: v4.label,
        });
    }

    return deck; // 52 suited + 4 wild + 4 plus4 = 60 cards
}

export function shuffleDeck(deck: GameCard[]): GameCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function dealHands(deck: GameCard[], playerCount: number, cardsPerPlayer: number = 7): {
    hands: GameCard[][];
    drawPile: GameCard[];
    firstDiscard: GameCard;
} {
    const shuffled = shuffleDeck(deck);
    const hands: GameCard[][] = Array.from({ length: playerCount }, () => []);

    let idx = 0;
    for (let c = 0; c < cardsPerPlayer; c++) {
        for (let p = 0; p < playerCount; p++) {
            hands[p].push(shuffled[idx++]);
        }
    }

    // Find a non-wild card for first discard
    let firstDiscard: GameCard | undefined;
    let drawPile: GameCard[] = shuffled.slice(idx);

    for (let i = 0; i < drawPile.length; i++) {
        if (drawPile[i].type === "number") {
            firstDiscard = drawPile[i];
            drawPile = [...drawPile.slice(0, i), ...drawPile.slice(i + 1)];
            break;
        }
    }

    if (!firstDiscard) {
        firstDiscard = drawPile.shift()!;
    }

    return { hands, drawPile, firstDiscard };
}

/**
 * Check if a card can be played on top of the current discard.
 */
export function canPlay(card: GameCard, topCard: GameCard, currentSuit: Suit): boolean {
    // Wild and +4 can always be played
    if (card.type === "wild" || card.type === "plus4") return true;

    // Match suit
    if (card.suit === currentSuit) return true;

    // Match rank (number cards only)
    if (card.rank !== null && topCard.rank !== null && card.rank === topCard.rank) return true;

    // Match action type (skip on skip, reverse on reverse, draw2 on draw2)
    if (card.type !== "number" && card.type === topCard.type) return true;

    return false;
}

/**
 * Check if a player has any playable cards.
 */
export function hasPlayableCard(hand: GameCard[], topCard: GameCard, currentSuit: Suit): boolean {
    return hand.some((card) => canPlay(card, topCard, currentSuit));
}

export function getCardColor(card: GameCard): string {
    if (card.type === "wild") return "text-purple-700";
    if (card.type === "plus4") return "text-red-700";
    if (card.suit) return SUITS[card.suit].color;
    return "text-warm-grey";
}

export function getCardBg(card: GameCard): string {
    if (card.type === "wild") return "linear-gradient(180deg, #f3e8ff 0%, #ede9fe 100%)";
    if (card.type === "plus4") return "linear-gradient(180deg, #fee2e2 0%, #fecaca 100%)";
    if (card.suit === "love") return "linear-gradient(180deg, #fff1f2 0%, #fecdd3 100%)";
    if (card.suit === "faith") return "linear-gradient(180deg, #fffbeb 0%, #fde68a 100%)";
    if (card.suit === "hope") return "linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)";
    if (card.suit === "grace") return "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)";
    return "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
}

export function getCardBorder(card: GameCard): string {
    if (card.type === "wild") return "#c4b5fd";
    if (card.type === "plus4") return "#fecaca";
    if (card.suit === "love") return "#fecdd3";
    if (card.suit === "faith") return "#fde68a";
    if (card.suit === "hope") return "#bfdbfe";
    if (card.suit === "grace") return "#a7f3d0";
    return "rgba(148,163,184,0.35)";
}
