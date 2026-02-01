export type MannaPrescription = {
    mood: string;
    emoji: string;
    verse: {
        text: string;
        reference: string;
    };
    prayer: string;
    song: {
        title: string;
        artist: string;
        url: string; // Spotify or YouTube link
    };
};

export const MANNA_DATA: MannaPrescription[] = [
    {
        mood: "Anxious",
        emoji: "🌪️",
        verse: {
            text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
            reference: "Philippians 4:6"
        },
        prayer: "Lord, quiet my racing heart. I trade my worry for Your peace right now. Take this heavy burden; I trust You with the outcome.",
        song: {
            title: "Peace",
            artist: "Bethel Music",
            url: "https://open.spotify.com/track/6g1jXhC8x9Jx9x9x9x9x9x" // Placeholder, real link would be better
        }
    },
    {
        mood: "Lonely",
        emoji: "🌑",
        verse: {
            text: "The Lord himself goes before you and will be with you; he will never leave you nor forsake you.",
            reference: "Deuteronomy 31:8"
        },
        prayer: "Father, I feel alone, but I know You are here. Wrap me in Your presence. Remind me that I am seen, known, and loved by You.",
        song: {
            title: "You Are Not Alone",
            artist: "Kari Jobe",
            url: "https://open.spotify.com/track/..."
        }
    },
    {
        mood: "Tired",
        emoji: "💤",
        verse: {
            text: "Come to me, all you who are weary and burdened, and I will give you rest.",
            reference: "Matthew 11:28"
        },
        prayer: "Jesus, my soul is tired. I come to You for rest. Refresh my spirit and give me the strength to keep going. I rest in You.",
        song: {
            title: "Rest",
            artist: "Brooke Ligertwood",
            url: "https://open.spotify.com/track/..."
        }
    },
    {
        mood: "Grateful",
        emoji: "✨",
        verse: {
            text: "Give thanks to the Lord, for he is good; his love endures forever.",
            reference: "Psalm 107:1"
        },
        prayer: "God, thank You! My heart is full. Help me to never take Your blessings for granted. I praise You for Your goodness!",
        song: {
            title: "Goodness of God",
            artist: "CeCe Winans",
            url: "https://open.spotify.com/track/..."
        }
    },
    {
        mood: "Insecure",
        emoji: "🪞",
        verse: {
            text: "I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
            reference: "Psalm 139:14"
        },
        prayer: "Lord, silence the lies. Remind me of who I am in You. I am chose, loved, and enough because You say so.",
        song: {
            title: "Who You Say I Am",
            artist: "Hillsong Worship",
            url: "https://open.spotify.com/track/..."
        }
    }
];
