"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setError("Supabase keys are missing in .env.local");
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            if (signInError.message.includes("Email not confirmed")) {
                setError("Please confirm your email address. Check your inbox and spam folder!");
            } else {
                setError(signInError.message);
            }
            setLoading(false);
            return;
        }

        // Success! 
        // Get user metadata to pass to transition
        const firstName = user?.user_metadata?.first_name || "Sister";
        const lastName = user?.user_metadata?.last_name || "";
        const initial = lastName ? lastName.charAt(0) : "";

        router.push(`/transition?name=${encodeURIComponent(firstName)}&initial=${encodeURIComponent(initial)}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-warm-paper text-warm-grey relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-soft-blush rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-sage-green rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

            <div className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center max-w-md relative z-10">
                <Link href="/" className="inline-flex items-center text-warm-grey/60 hover:text-warm-grey mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                <div className="text-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Selahly Lotus"
                        width={60}
                        height={60}
                        className="mx-auto mb-4 opacity-80"
                    />
                    <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2">Welcome Back</h1>
                    <p className="text-warm-grey/60">Enter your sanctuary.</p>
                </div>

                <div className="glass-card p-8 rounded-3xl backdrop-blur-xl bg-white/40">
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-soft-blush/50 transition-all text-warm-grey placeholder:text-warm-grey/30"
                                placeholder="sister@selahly.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-soft-blush/50 transition-all text-warm-grey placeholder:text-warm-grey/30"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full" disabled={loading}>
                                {loading ? "Logging in..." : "Login"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-warm-grey/60">
                        <p>Don't have an account? <Link href="/signup" className="text-warm-cocoa font-medium hover:underline">Join the Circle</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
