"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SessionRedirect() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    router.push("/home");
                }
            }
        };
        checkSession();
    }, [router]);

    return null;
}
