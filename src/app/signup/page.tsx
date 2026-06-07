"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function Signup() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/home");
            }
        };
        checkSession();
    }, [router]);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        password: ""
    });
    const [ageVerified, setAgeVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!ageVerified) {
            setError("You must be between 13-25 years old to join.");
            setLoading(false);
            return;
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setError("Supabase keys are missing in .env.local");
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                },
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // Success! Redirect to transition
        // We can still pass params for immediate visual feedback, 
        // or rely on the session (which might need a moment to propagate if email confirm is off).
        // For now, let's keep the params for the smooth transition effect.
        const initial = formData.lastName ? formData.lastName.charAt(0) : "";
        router.push(`/transition?name=${encodeURIComponent(formData.firstName)}&initial=${encodeURIComponent(initial)}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-warm-paper text-warm-grey relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-sage-green rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
            <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-soft-blush rounded-full mix-blend-multiply filter blur-3xl opacity-50" />

            <div className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center max-w-md relative z-10">
                <Link href="/" className="inline-flex items-center text-warm-grey/60 hover:text-warm-grey mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Link>

                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2">Join the Circle</h1>
                    <p className="text-warm-grey/60">Create your account to start your journey.</p>
                </div>

                <div className="glass-card p-8 rounded-3xl backdrop-blur-xl bg-white/40">
                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-warm-grey"
                                    placeholder="Jane"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-warm-grey"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-warm-grey"
                                placeholder="(555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-warm-grey"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-warm-cocoa">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white focus:outline-none focus:ring-2 focus:ring-sage-green/50 transition-all text-warm-grey"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-white/30 rounded-xl border border-white/50">
                            <div className="flex items-center h-5">
                                <input
                                    id="age-verification"
                                    name="age-verification"
                                    type="checkbox"
                                    checked={ageVerified}
                                    onChange={(e) => setAgeVerified(e.target.checked)}
                                    className="h-4 w-4 rounded border-warm-grey/30 text-sage-green focus:ring-sage-green"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="age-verification" className="font-medium text-warm-cocoa">
                                    I verify that I am 13-25 years old
                                </label>
                                <p className="text-warm-grey/60 text-xs">
                                    Selahly is designed specifically for this age group.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" size="lg" className="w-full bg-sage-green hover:bg-sage-green/90 text-warm-grey" disabled={loading}>
                                {loading ? "Creating..." : "Create Account"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-warm-grey/60">
                        <p>Already have an account? <Link href="/login" className="text-warm-cocoa font-medium hover:underline">Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
