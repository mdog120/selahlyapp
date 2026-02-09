export interface InstagramPost {
    id: string;
    caption: string;
    media_url: string; // The image URL
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    permalink: string;
    timestamp: string;
    thumbnail_url?: string; // For videos
    username: string;
}

// Mock Data for when API is not available
const MOCK_POSTS: InstagramPost[] = [
    {
        id: 'mock-1',
        caption: "Finding stillness in the chaos 🕊️ #Selahly #Faith #Peace",
        media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
        media_type: 'IMAGE',
        permalink: "https://instagram.com/selahlyapp",
        timestamp: new Date().toISOString(),
        username: "selahlyapp"
    },
    {
        id: 'mock-2',
        caption: "Bible study essentials 📖✨ What are you reading today?",
        media_url: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1000&auto=format&fit=crop",
        media_type: 'IMAGE',
        permalink: "https://instagram.com/selahlyapp",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        username: "selahlyapp"
    },
    {
        id: 'mock-3',
        caption: "Sisterhood is a gift. Tag your prayer partner! 👯‍♀️💖",
        media_url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop",
        media_type: 'IMAGE',
        permalink: "https://instagram.com/selahlyapp",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        username: "selahlyapp"
    },
    {
        id: 'mock-4',
        caption: "Morning devotionals just hit different. ☕☀️",
        media_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
        media_type: 'IMAGE',
        permalink: "https://instagram.com/selahlyapp",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        username: "selahlyapp"
    }
];

export async function getInstagramPosts(): Promise<InstagramPost[]> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!token) {
        console.warn("No INSTAGRAM_ACCESS_TOKEN found, using mock data.");
        return MOCK_POSTS;
    }

    try {
        const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${token}`;
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

        if (!response.ok) {
            console.error("Failed to fetch Instagram posts:", response.statusText);
            return MOCK_POSTS;
        }

        const data = await response.json();
        return data.data || MOCK_POSTS;

    } catch (error) {
        console.error("Error fetching Instagram posts:", error);
        return MOCK_POSTS;
    }
}
