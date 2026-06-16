// ─── Board Data for Bible Monopoly Lite ─────────────────────

export type SpaceType = "go" | "property" | "scripture_card" | "wilderness" | "tithe" | "free_parking";

export interface PropertySpace {
    type: "property";
    name: string;
    color: string;           // color group key
    colorHex: string;        // display color
    cost: number;
    rent: number;
    emoji: string;
    verse: string;           // short Bible reference
}

export interface SpecialSpace {
    type: "go" | "scripture_card" | "wilderness" | "tithe" | "free_parking";
    name: string;
    emoji: string;
    description: string;
}

export type BoardSpace = PropertySpace | SpecialSpace;

// ─── Color Groups ────────────────────────────────────────────
export const COLOR_GROUPS: Record<string, { label: string; hex: string; properties: string[] }> = {
    brown:      { label: "Brown",      hex: "#8B6914", properties: ["Bethlehem", "Nazareth"] },
    lightblue:  { label: "Light Blue", hex: "#6BB5E0", properties: ["Capernaum", "Galilee", "Jericho"] },
    pink:       { label: "Pink",       hex: "#E88DA8", properties: ["Samaria", "Bethany", "Cana"] },
    orange:     { label: "Orange",     hex: "#E89040", properties: ["Mount Sinai", "Mount Carmel", "Hebron"] },
    red:        { label: "Red",        hex: "#D94F4F", properties: ["Nineveh", "Babylon", "Damascus"] },
    yellow:     { label: "Yellow",     hex: "#E8C840", properties: ["Antioch", "Corinth", "Ephesus"] },
    green:      { label: "Green",      hex: "#4CAF50", properties: ["Rome", "Athens", "Tarsus"] },
    darkblue:   { label: "Dark Blue",  hex: "#3B5998", properties: ["Jerusalem", "Eden"] },
};

// ─── 28 Board Spaces (clockwise from GO) ─────────────────────
export const BOARD: BoardSpace[] = [
    // Bottom row (right to left): GO + Brown + Scripture Card + Light Blue
    { type: "go", name: "GO", emoji: "⭐", description: "Collect 200 shekels when you pass" },
    { type: "property", name: "Bethlehem", color: "brown", colorHex: "#8B6914", cost: 60, rent: 10, emoji: "🌟", verse: "Micah 5:2" },
    { type: "scripture_card", name: "Scripture Card", emoji: "📜", description: "Draw a Scripture Card" },
    { type: "property", name: "Nazareth", color: "brown", colorHex: "#8B6914", cost: 60, rent: 10, emoji: "🏘️", verse: "Matt 2:23" },
    { type: "property", name: "Capernaum", color: "lightblue", colorHex: "#6BB5E0", cost: 100, rent: 20, emoji: "🏛️", verse: "Matt 4:13" },
    { type: "property", name: "Galilee", color: "lightblue", colorHex: "#6BB5E0", cost: 100, rent: 20, emoji: "🌊", verse: "Matt 4:18" },
    { type: "tithe", name: "Tithe", emoji: "💰", description: "Pay 100 shekels to the pot" },

    // Left column (bottom to top): Light Blue + Pink + Scripture Card + Orange
    { type: "property", name: "Jericho", color: "lightblue", colorHex: "#6BB5E0", cost: 120, rent: 25, emoji: "🏰", verse: "Josh 6:20" },
    { type: "property", name: "Samaria", color: "pink", colorHex: "#E88DA8", cost: 140, rent: 30, emoji: "⛲", verse: "John 4:4" },
    { type: "property", name: "Bethany", color: "pink", colorHex: "#E88DA8", cost: 140, rent: 30, emoji: "🌿", verse: "John 11:1" },
    { type: "scripture_card", name: "Scripture Card", emoji: "📜", description: "Draw a Scripture Card" },
    { type: "property", name: "Cana", color: "pink", colorHex: "#E88DA8", cost: 160, rent: 35, emoji: "🍷", verse: "John 2:1" },
    { type: "property", name: "Mount Sinai", color: "orange", colorHex: "#E89040", cost: 180, rent: 40, emoji: "⛰️", verse: "Exod 19:20" },
    { type: "property", name: "Mount Carmel", color: "orange", colorHex: "#E89040", cost: 180, rent: 40, emoji: "🔥", verse: "1 Kings 18:38" },

    // Top row (left to right): Free Parking + Orange + Yellow + Scripture Card
    { type: "free_parking", name: "Free Parking", emoji: "🅿️", description: "Collect the pot!" },
    { type: "property", name: "Hebron", color: "orange", colorHex: "#E89040", cost: 200, rent: 45, emoji: "🕊️", verse: "Gen 13:18" },
    { type: "property", name: "Nineveh", color: "red", colorHex: "#D94F4F", cost: 220, rent: 50, emoji: "🐋", verse: "Jonah 1:2" },
    { type: "property", name: "Babylon", color: "red", colorHex: "#D94F4F", cost: 220, rent: 50, emoji: "🏗️", verse: "Dan 4:30" },
    { type: "property", name: "Damascus", color: "red", colorHex: "#D94F4F", cost: 240, rent: 55, emoji: "⚡", verse: "Acts 9:3" },
    { type: "scripture_card", name: "Scripture Card", emoji: "📜", description: "Draw a Scripture Card" },
    { type: "property", name: "Antioch", color: "yellow", colorHex: "#E8C840", cost: 260, rent: 60, emoji: "✝️", verse: "Acts 11:26" },

    // Right column (top to bottom): Yellow + Green + Scripture Card + Dark Blue
    { type: "property", name: "Corinth", color: "yellow", colorHex: "#E8C840", cost: 260, rent: 60, emoji: "📬", verse: "1 Cor 1:2" },
    { type: "property", name: "Ephesus", color: "yellow", colorHex: "#E8C840", cost: 280, rent: 65, emoji: "⚔️", verse: "Eph 6:11" },
    { type: "wilderness", name: "Wilderness", emoji: "🏜️", description: "Rest here — skip your next turn" },
    { type: "property", name: "Rome", color: "green", colorHex: "#4CAF50", cost: 300, rent: 70, emoji: "🏟️", verse: "Rom 1:7" },
    { type: "property", name: "Athens", color: "green", colorHex: "#4CAF50", cost: 300, rent: 70, emoji: "🏛️", verse: "Acts 17:22" },
    { type: "property", name: "Tarsus", color: "green", colorHex: "#4CAF50", cost: 320, rent: 75, emoji: "📖", verse: "Acts 21:39" },
    { type: "scripture_card", name: "Scripture Card", emoji: "📜", description: "Draw a Scripture Card" },
    { type: "property", name: "Jerusalem", color: "darkblue", colorHex: "#3B5998", cost: 350, rent: 90, emoji: "🕌", verse: "Psalm 122:6" },
    { type: "property", name: "Eden", color: "darkblue", colorHex: "#3B5998", cost: 400, rent: 100, emoji: "🌳", verse: "Gen 2:8" },
];

// Wrap around: total 30 spaces (28 planned + 2 extra to make even sides of 8)
// Actually we have 30 spaces above, but let's keep 28 as planned by adjusting
// We'll use all 30 — the board will be an 8x8 perimeter = 28, but we added 2 extra
// Let's trim to exactly 28 by removing the last 2 and putting Jerusalem/Eden before the last scripture card:

// NOTE: The board has exactly 30 spaces. A standard Monopoly perimeter of 8 per side = 
// (8-1)*4 = 28 spaces. We have 30, so let's keep it — 8 spaces per side with corners = 32 - 4 overlap = 28.
// Actually let's just use all 30 spaces. The board rendering will handle it.

// ─── Scripture Cards ─────────────────────────────────────────
export interface ScriptureCard {
    text: string;
    emoji: string;
    action: "receive" | "pay" | "move_to" | "move_forward" | "skip_turn" | "collect_from_each";
    amount?: number;
    destination?: number; // board index to move to
    spaces?: number;       // for move_forward
}

export const SCRIPTURE_CARDS: ScriptureCard[] = [
    {
        text: "\"The Lord blesses you abundantly\" — Receive 150 shekels",
        emoji: "✨",
        action: "receive",
        amount: 150,
    },
    {
        text: "\"Go up to Jerusalem to worship\" — Go to Jerusalem",
        emoji: "🕌",
        action: "move_to",
        destination: 28, // Jerusalem index
    },
    {
        text: "\"Your prayers are answered\" — Collect 100 shekels from each player",
        emoji: "🙏",
        action: "collect_from_each",
        amount: 100,
    },
    {
        text: "\"40 days in the wilderness\" — Skip your next turn",
        emoji: "🏜️",
        action: "skip_turn",
    },
    {
        text: "\"Return to the beginning\" — Advance to GO, collect 200 shekels",
        emoji: "⭐",
        action: "move_to",
        destination: 0,
        amount: 200,
    },
    {
        text: "\"Bring your offering to the temple\" — Pay 75 shekels",
        emoji: "🏛️",
        action: "pay",
        amount: 75,
    },
    {
        text: "\"The Good Samaritan helps you\" — Receive 50 shekels",
        emoji: "❤️",
        action: "receive",
        amount: 50,
    },
    {
        text: "\"The Spirit leads you forward\" — Move forward 3 spaces",
        emoji: "🕊️",
        action: "move_forward",
        spaces: 3,
    },
];

// ─── Player Colors & Tokens ──────────────────────────────────
export const PLAYER_TOKENS = [
    { emoji: "🐑", color: "#E88DA8", label: "Lamb" },
    { emoji: "🕊️", color: "#6BB5E0", label: "Dove" },
    { emoji: "🌿", color: "#4CAF50", label: "Olive Branch" },
    { emoji: "⭐", color: "#E8C840", label: "Star" },
    { emoji: "🐟", color: "#8B6914", label: "Fish" },
    { emoji: "🔥", color: "#D94F4F", label: "Fire" },
];

// ─── Constants ───────────────────────────────────────────────
export const STARTING_MONEY = 1500;
export const GO_BONUS = 200;
export const TITHE_AMOUNT = 100;
export const MAX_ROUNDS = 15;
export const BOARD_SIZE = BOARD.length;
