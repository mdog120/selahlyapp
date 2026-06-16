export interface SketchPrompt {
    word: string;
    category: "character" | "place" | "event" | "object";
    hint: string;
}

export const SKETCH_PROMPTS: SketchPrompt[] = [
    // ─── Characters ─────────────────────────────────────────
    { word: "Adam", category: "character", hint: "The first man God created" },
    { word: "Eve", category: "character", hint: "The first woman, formed from a rib" },
    { word: "Noah", category: "character", hint: "He built the ark before the great flood" },
    { word: "Abraham", category: "character", hint: "The father of many nations" },
    { word: "Sarah", category: "character", hint: "She laughed when told she'd have a son" },
    { word: "Isaac", category: "character", hint: "The child of promise born to elderly parents" },
    { word: "Jacob", category: "character", hint: "He wrestled with an angel and was renamed" },
    { word: "Joseph", category: "character", hint: "He had a coat of many colors" },
    { word: "Moses", category: "character", hint: "He led Israel out of Egypt" },
    { word: "Miriam", category: "character", hint: "Moses' sister who danced with a tambourine" },
    { word: "David", category: "character", hint: "A shepherd boy who became king" },
    { word: "Goliath", category: "character", hint: "A giant defeated by a sling and a stone" },
    { word: "Solomon", category: "character", hint: "The wisest king who built the temple" },
    { word: "Ruth", category: "character", hint: "She gleaned in the fields and stayed loyal" },
    { word: "Esther", category: "character", hint: "A queen who saved her people" },
    { word: "Daniel", category: "character", hint: "He was thrown into the lions' den" },
    { word: "Jonah", category: "character", hint: "Swallowed by a great fish" },
    { word: "Samson", category: "character", hint: "His strength was in his hair" },
    { word: "Elijah", category: "character", hint: "He called down fire from heaven" },
    { word: "Mary", category: "character", hint: "The mother of Jesus" },
    { word: "Jesus", category: "character", hint: "The Savior of the world" },
    { word: "Paul", category: "character", hint: "Formerly Saul, he wrote letters to churches" },
    { word: "Peter", category: "character", hint: "He walked on water but then sank" },
    { word: "John the Baptist", category: "character", hint: "He baptized people in the river" },
    { word: "Rahab", category: "character", hint: "She hid the spies with a scarlet cord" },

    // ─── Places ─────────────────────────────────────────────
    { word: "Garden of Eden", category: "place", hint: "The perfect paradise where it all began" },
    { word: "Noah's Ark", category: "place", hint: "A massive boat built for a flood" },
    { word: "Tower of Babel", category: "place", hint: "People tried to build up to heaven" },
    { word: "Mount Sinai", category: "place", hint: "Where the Ten Commandments were given" },
    { word: "Red Sea", category: "place", hint: "Its waters were parted for Israel to cross" },
    { word: "Bethlehem", category: "place", hint: "The birthplace of Jesus" },
    { word: "Nazareth", category: "place", hint: "The town where Jesus grew up" },
    { word: "Jerusalem", category: "place", hint: "The holy city with the temple" },
    { word: "Jordan River", category: "place", hint: "Where Jesus was baptized" },
    { word: "Sea of Galilee", category: "place", hint: "Where Jesus calmed the storm" },
    { word: "Jericho", category: "place", hint: "Its walls came tumbling down" },
    { word: "Egypt", category: "place", hint: "The land of pharaohs and slavery" },
    { word: "Promised Land", category: "place", hint: "Flowing with milk and honey" },
    { word: "Gethsemane", category: "place", hint: "The garden where Jesus prayed" },

    // ─── Events ─────────────────────────────────────────────
    { word: "Creation", category: "event", hint: "God made everything in six days" },
    { word: "The Flood", category: "event", hint: "Rain fell for forty days and nights" },
    { word: "Burning Bush", category: "event", hint: "A bush on fire that didn't burn up" },
    { word: "Parting the Red Sea", category: "event", hint: "Water stood as walls on both sides" },
    { word: "Ten Plagues", category: "event", hint: "Frogs, darkness, and more struck Egypt" },
    { word: "David and Goliath", category: "event", hint: "A sling, a stone, and a giant fell" },
    { word: "Daniel in the Lions' Den", category: "event", hint: "Lions didn't touch him all night" },
    { word: "Jonah and the Whale", category: "event", hint: "Three days inside a great fish" },
    { word: "Birth of Jesus", category: "event", hint: "A baby in a manger, angels sang" },
    { word: "Feeding the 5000", category: "event", hint: "Five loaves and two fish fed a crowd" },
    { word: "Walking on Water", category: "event", hint: "Steps taken on top of the sea" },
    { word: "The Last Supper", category: "event", hint: "A final meal with bread and wine" },
    { word: "The Crucifixion", category: "event", hint: "The cross on the hill" },
    { word: "The Resurrection", category: "event", hint: "The stone was rolled away, the tomb empty" },
    { word: "The Ascension", category: "event", hint: "He rose up into the clouds" },
    { word: "Pentecost", category: "event", hint: "Tongues of fire appeared and the Spirit came" },
    { word: "Walls of Jericho", category: "event", hint: "Marching and trumpets brought them down" },
    { word: "The Exodus", category: "event", hint: "An entire nation left slavery" },
    { word: "Baptism of Jesus", category: "event", hint: "A dove descended from above" },
    { word: "The Transfiguration", category: "event", hint: "His face shone like the sun on the mountain" },

    // ─── Objects ─────────────────────────────────────────────
    { word: "Ark of the Covenant", category: "object", hint: "A golden chest carrying the commandments" },
    { word: "Stone Tablets", category: "object", hint: "The Ten Commandments written in stone" },
    { word: "Crown of Thorns", category: "object", hint: "A painful crown placed on Jesus' head" },
    { word: "Manger", category: "object", hint: "A feeding trough used as a crib" },
    { word: "Dove", category: "object", hint: "A bird symbolizing peace and the Spirit" },
    { word: "Rainbow", category: "object", hint: "God's sign of His covenant with Noah" },
    { word: "Loaves and Fish", category: "object", hint: "A small lunch that multiplied" },
    { word: "Sling and Stone", category: "object", hint: "A shepherd boy's weapon against a giant" },
    { word: "Staff of Moses", category: "object", hint: "A rod that turned into a snake" },
    { word: "Golden Calf", category: "object", hint: "An idol made while Moses was on the mountain" },
    { word: "Coat of Many Colors", category: "object", hint: "A special gift from a father to his son" },
    { word: "Scarlet Cord", category: "object", hint: "Hung from a window to mark safety" },
    { word: "Oil Lamp", category: "object", hint: "Ten maidens waited with these" },
    { word: "Mustard Seed", category: "object", hint: "The smallest seed that grows into the largest plant" },
    { word: "Fish and Net", category: "object", hint: "Follow me and I'll make you fishers of men" },
    { word: "Cross", category: "object", hint: "The symbol of sacrifice and salvation" },
];

/** Pick a random prompt that hasn't been used yet in this session */
export function pickRandomPrompt(usedWords: string[]): SketchPrompt {
    const available = SKETCH_PROMPTS.filter((p) => !usedWords.includes(p.word));
    if (available.length === 0) {
        // All prompts used — reset
        return SKETCH_PROMPTS[Math.floor(Math.random() * SKETCH_PROMPTS.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
}

/** Generate the hidden word display (e.g. "_ _ _ _ _") with word length hint */
export function getHiddenWord(word: string): string {
    return word
        .split("")
        .map((ch) => (ch === " " ? "  " : "_"))
        .join(" ");
}
