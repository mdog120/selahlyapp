import { getInstagramPosts } from "@/lib/instagram";
import { InstagramFeedClient } from "./InstagramFeedClient";

export async function InstagramFeed() {
    const posts = await getInstagramPosts();

    return <InstagramFeedClient posts={posts} />;
}
