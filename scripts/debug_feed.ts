import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Testing fetch...");
    const { data: { user } } = await supabase.auth.getUser();
    console.log("User:", user?.id || "None");

    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            profiles (username, first_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Full Error:", JSON.stringify(error, null, 2));
    } else {
        console.log("Success! Data length:", data?.length);
    }
}

testFetch();
