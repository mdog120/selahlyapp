import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export async function POST(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Missing Supabase URL or Service Role Key in build/run environment.");
            return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
        }

        // Initialize admin supabase client using service role key to bypass RLS
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Configure VAPID keys
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webpush.setVapidDetails(
                "mailto:notifications@selahly.com",
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
        }
        const body = await req.json();
        
        // Supabase HTTP webhook sends the newly inserted row in "record"
        const record = body.record || body;

        if (!record || !record.user_id) {
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        const { user_id, actor_id, type, resource_id, resource_type } = record;

        // 1. Fetch all push subscriptions for the recipient
        const { data: subscriptions, error: subError } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", user_id);

        if (subError || !subscriptions || subscriptions.length === 0) {
            // Recipient has no active subscriptions
            return NextResponse.json({ message: "No active push subscriptions for user" });
        }

        // 2. Fetch actor's name
        let actorName = "A sister";
        if (actor_id) {
            const { data: actor } = await supabaseAdmin
                .from("profiles")
                .select("first_name")
                .eq("id", actor_id)
                .single();
            if (actor?.first_name) {
                actorName = actor.first_name;
            }
        }

        // 3. Construct message details
        let bodyText = "New activity on Selahly!";
        let clickUrl = "/home";

        switch (type) {
            case "like":
                bodyText = `${actorName} liked your post.`;
                clickUrl = "/home";
                break;
            case "comment":
                bodyText = `${actorName} commented on your post.`;
                clickUrl = "/home";
                break;
            case "reply":
                bodyText = `${actorName} replied to your Velvet Vault discussion.`;
                clickUrl = resource_id ? `/velvet-vault/thread/${resource_id}` : "/velvet-vault";
                break;
            case "pray":
            case "prayer":
                bodyText = `${actorName} added your request to her prayers. You are not alone! 🤍`;
                clickUrl = "/prayer-pocket";
                break;
            case "friend_request":
                bodyText = `${actorName} sent you a friend request.`;
                clickUrl = "/home";
                break;
            case "message":
                bodyText = `${actorName} sent you a message.`;
                clickUrl = resource_id ? `/messages/${resource_id}` : "/messages";
                break;
        }

        const payload = JSON.stringify({
            title: "Selahly ౨ৎ",
            body: bodyText,
            url: clickUrl
        });

        // 4. Send pushes in parallel
        const sendPromises = subscriptions.map((sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushSubscription, payload)
                .catch(async (err) => {
                    // Clean up invalid or expired subscriptions
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log("Removing expired push endpoint:", sub.endpoint);
                        await supabaseAdmin
                            .from("push_subscriptions")
                            .delete()
                            .eq("endpoint", sub.endpoint);
                    } else {
                        console.error("WebPush send error:", err);
                    }
                });
        });

        await Promise.all(sendPromises);

        return NextResponse.json({ success: true, count: subscriptions.length });
    } catch (e: any) {
        console.error("Send API webhook crash:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
