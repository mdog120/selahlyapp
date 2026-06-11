import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { subscription } = body;

        if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            return NextResponse.json({ error: "Invalid subscription details" }, { status: 400 });
        }

        const { error } = await supabase
            .from("push_subscriptions")
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }, {
                onConflict: "endpoint"
            });

        if (error) {
            console.error("Error saving subscription:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Subscribe API crash:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
