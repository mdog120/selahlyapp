export interface SpyfallRole {
    name: string;
    emoji: string;
}

export interface SpyfallScenario {
    id: string;
    event: string;
    emoji: string;
    description: string;
    roles: SpyfallRole[]; // at least 5 roles per scenario
}

export const SPYFALL_SCENARIOS: SpyfallScenario[] = [
    {
        id: "last-supper",
        event: "The Last Supper",
        emoji: "🍞",
        description: "Jesus shares a final meal with His disciples",
        roles: [
            { name: "Jesus", emoji: "✝️" },
            { name: "Judas", emoji: "💰" },
            { name: "Peter", emoji: "🪨" },
            { name: "John", emoji: "📜" },
            { name: "Thomas", emoji: "🤔" },
        ],
    },
    {
        id: "noahs-ark",
        event: "Noah's Ark",
        emoji: "🚢",
        description: "Noah builds an ark to survive the great flood",
        roles: [
            { name: "Noah", emoji: "🧔" },
            { name: "Shem", emoji: "🪵" },
            { name: "Ham", emoji: "🔨" },
            { name: "Japheth", emoji: "⛵" },
            { name: "Noah's Wife", emoji: "👩" },
        ],
    },
    {
        id: "garden-of-eden",
        event: "The Garden of Eden",
        emoji: "🌿",
        description: "The first humans in paradise",
        roles: [
            { name: "Adam", emoji: "🧑" },
            { name: "Eve", emoji: "👩" },
            { name: "The Serpent", emoji: "🐍" },
            { name: "The Cherubim", emoji: "👼" },
            { name: "The Tree of Life", emoji: "🌳" },
        ],
    },
    {
        id: "the-exodus",
        event: "The Exodus from Egypt",
        emoji: "🌊",
        description: "Moses leads the Israelites out of slavery",
        roles: [
            { name: "Moses", emoji: "🪄" },
            { name: "Aaron", emoji: "🗣️" },
            { name: "Pharaoh", emoji: "👑" },
            { name: "Miriam", emoji: "🎵" },
            { name: "Joshua", emoji: "⚔️" },
        ],
    },
    {
        id: "david-and-goliath",
        event: "David vs. Goliath",
        emoji: "🪨",
        description: "A shepherd boy faces a giant warrior",
        roles: [
            { name: "David", emoji: "🎵" },
            { name: "Goliath", emoji: "🗡️" },
            { name: "King Saul", emoji: "👑" },
            { name: "Jesse", emoji: "🧓" },
            { name: "Armor Bearer", emoji: "🛡️" },
        ],
    },
    {
        id: "nativity",
        event: "The Birth of Jesus",
        emoji: "⭐",
        description: "Jesus is born in a manger in Bethlehem",
        roles: [
            { name: "Mary", emoji: "💙" },
            { name: "Joseph", emoji: "🪚" },
            { name: "Shepherd", emoji: "🐑" },
            { name: "Wise Man", emoji: "🎁" },
            { name: "Innkeeper", emoji: "🏠" },
        ],
    },
    {
        id: "burning-bush",
        event: "The Burning Bush",
        emoji: "🔥",
        description: "God speaks to Moses through a bush on fire",
        roles: [
            { name: "Moses", emoji: "👞" },
            { name: "Jethro", emoji: "🧓" },
            { name: "Zipporah", emoji: "👩" },
            { name: "The Flock", emoji: "🐑" },
            { name: "An Angel", emoji: "👼" },
        ],
    },
    {
        id: "daniel-lions-den",
        event: "Daniel in the Lions' Den",
        emoji: "🦁",
        description: "Daniel is thrown into a pit of hungry lions",
        roles: [
            { name: "Daniel", emoji: "🙏" },
            { name: "King Darius", emoji: "👑" },
            { name: "The Satraps", emoji: "📜" },
            { name: "An Angel", emoji: "👼" },
            { name: "The Lion", emoji: "🦁" },
        ],
    },
    {
        id: "tower-of-babel",
        event: "The Tower of Babel",
        emoji: "🏗️",
        description: "Humanity tries to build a tower to heaven",
        roles: [
            { name: "Nimrod", emoji: "👑" },
            { name: "Brick Layer", emoji: "🧱" },
            { name: "Architect", emoji: "📐" },
            { name: "Translator", emoji: "🗣️" },
            { name: "Lookout", emoji: "👀" },
        ],
    },
    {
        id: "red-sea-crossing",
        event: "Crossing the Red Sea",
        emoji: "🌊",
        description: "The Israelites cross the parted Red Sea",
        roles: [
            { name: "Moses", emoji: "🪄" },
            { name: "Pharaoh's General", emoji: "⚔️" },
            { name: "An Israelite Mother", emoji: "👩‍👧" },
            { name: "A Charioteer", emoji: "🐴" },
            { name: "A Child of Israel", emoji: "👦" },
        ],
    },
    {
        id: "fiery-furnace",
        event: "The Fiery Furnace",
        emoji: "🔥",
        description: "Three men refuse to bow and are thrown into fire",
        roles: [
            { name: "Shadrach", emoji: "🔥" },
            { name: "Meshach", emoji: "🔥" },
            { name: "Abednego", emoji: "🔥" },
            { name: "King Nebuchadnezzar", emoji: "👑" },
            { name: "The Fourth Figure", emoji: "✨" },
        ],
    },
    {
        id: "jonah-whale",
        event: "Jonah and the Whale",
        emoji: "🐋",
        description: "Jonah runs from God and ends up inside a great fish",
        roles: [
            { name: "Jonah", emoji: "🏃" },
            { name: "The Captain", emoji: "⚓" },
            { name: "A Sailor", emoji: "🌊" },
            { name: "The Great Fish", emoji: "🐋" },
            { name: "A Ninevite", emoji: "🏙️" },
        ],
    },
    {
        id: "jericho",
        event: "The Battle of Jericho",
        emoji: "🎺",
        description: "The walls of Jericho fall after Israel marches around them",
        roles: [
            { name: "Joshua", emoji: "⚔️" },
            { name: "Rahab", emoji: "🧣" },
            { name: "A Priest with Trumpet", emoji: "🎺" },
            { name: "An Israelite Soldier", emoji: "🛡️" },
            { name: "A Jericho Guard", emoji: "🏰" },
        ],
    },
    {
        id: "jesus-baptism",
        event: "The Baptism of Jesus",
        emoji: "💧",
        description: "John baptizes Jesus in the Jordan River",
        roles: [
            { name: "Jesus", emoji: "✝️" },
            { name: "John the Baptist", emoji: "💧" },
            { name: "A Pharisee", emoji: "📜" },
            { name: "A Disciple of John", emoji: "🚶" },
            { name: "A Dove", emoji: "🕊️" },
        ],
    },
    {
        id: "feeding-5000",
        event: "Feeding the 5,000",
        emoji: "🐟",
        description: "Jesus multiplies loaves and fish to feed a crowd",
        roles: [
            { name: "Jesus", emoji: "✝️" },
            { name: "Andrew", emoji: "🐟" },
            { name: "The Boy with Loaves", emoji: "🍞" },
            { name: "Philip", emoji: "🤷" },
            { name: "A Hungry Pilgrim", emoji: "😋" },
        ],
    },
    {
        id: "pauls-shipwreck",
        event: "Paul's Shipwreck",
        emoji: "⛵",
        description: "Paul survives a storm and shipwreck on the way to Rome",
        roles: [
            { name: "Paul", emoji: "⛓️" },
            { name: "Julius the Centurion", emoji: "🛡️" },
            { name: "The Ship Captain", emoji: "⚓" },
            { name: "Luke", emoji: "📝" },
            { name: "A Maltese Islander", emoji: "🏝️" },
        ],
    },
    {
        id: "resurrection",
        event: "The Resurrection of Jesus",
        emoji: "☀️",
        description: "Jesus rises from the tomb on the third day",
        roles: [
            { name: "Mary Magdalene", emoji: "😢" },
            { name: "Peter", emoji: "🏃" },
            { name: "John", emoji: "📜" },
            { name: "An Angel at the Tomb", emoji: "👼" },
            { name: "A Roman Guard", emoji: "🛡️" },
        ],
    },
    {
        id: "pentecost",
        event: "The Day of Pentecost",
        emoji: "🔥",
        description: "The Holy Spirit descends on the apostles",
        roles: [
            { name: "Peter", emoji: "🗣️" },
            { name: "John", emoji: "📜" },
            { name: "Mary (Mother of Jesus)", emoji: "💙" },
            { name: "A Foreign Pilgrim", emoji: "🌍" },
            { name: "A Skeptic in the Crowd", emoji: "🤨" },
        ],
    },
    {
        id: "good-samaritan",
        event: "The Good Samaritan",
        emoji: "🩹",
        description: "A Samaritan helps a wounded stranger on the road",
        roles: [
            { name: "The Samaritan", emoji: "🩹" },
            { name: "The Wounded Traveler", emoji: "🤕" },
            { name: "The Priest", emoji: "⛪" },
            { name: "The Levite", emoji: "🚶" },
            { name: "The Innkeeper", emoji: "🏠" },
        ],
    },
    {
        id: "prodigal-son",
        event: "The Prodigal Son",
        emoji: "🐷",
        description: "A lost son returns home to his father",
        roles: [
            { name: "The Prodigal Son", emoji: "😔" },
            { name: "The Father", emoji: "🤗" },
            { name: "The Elder Brother", emoji: "😤" },
            { name: "A Servant", emoji: "🍖" },
            { name: "The Pig Farmer", emoji: "🐷" },
        ],
    },
    {
        id: "samson-delilah",
        event: "Samson and Delilah",
        emoji: "💇",
        description: "Delilah discovers the secret of Samson's strength",
        roles: [
            { name: "Samson", emoji: "💪" },
            { name: "Delilah", emoji: "💇" },
            { name: "A Philistine Lord", emoji: "💰" },
            { name: "A Servant of Delilah", emoji: "✂️" },
            { name: "A Temple Pillar", emoji: "🏛️" },
        ],
    },
    {
        id: "creation",
        event: "Creation of the World",
        emoji: "🌍",
        description: "God creates the heavens and the earth in six days",
        roles: [
            { name: "The Light", emoji: "💡" },
            { name: "The Waters", emoji: "🌊" },
            { name: "The Sun", emoji: "☀️" },
            { name: "The First Bird", emoji: "🦅" },
            { name: "The First Fish", emoji: "🐟" },
        ],
    },
    {
        id: "road-to-emmaus",
        event: "The Road to Emmaus",
        emoji: "🛤️",
        description: "Two disciples walk with the risen Jesus without recognizing Him",
        roles: [
            { name: "Cleopas", emoji: "🚶" },
            { name: "The Other Disciple", emoji: "🚶" },
            { name: "The Stranger (Jesus)", emoji: "✝️" },
            { name: "An Innkeeper", emoji: "🏠" },
            { name: "A Traveler on the Road", emoji: "🧳" },
        ],
    },
    {
        id: "esther-banquet",
        event: "Esther's Banquet",
        emoji: "👸",
        description: "Queen Esther risks her life to save her people",
        roles: [
            { name: "Queen Esther", emoji: "👸" },
            { name: "King Xerxes", emoji: "👑" },
            { name: "Haman", emoji: "😈" },
            { name: "Mordecai", emoji: "🧓" },
            { name: "A Palace Servant", emoji: "🍷" },
        ],
    },
];

export function getRandomScenario(exclude: string[]): SpyfallScenario {
    const available = SPYFALL_SCENARIOS.filter((s) => !exclude.includes(s.id));
    if (available.length === 0)
        return SPYFALL_SCENARIOS[Math.floor(Math.random() * SPYFALL_SCENARIOS.length)];
    return available[Math.floor(Math.random() * available.length)];
}
