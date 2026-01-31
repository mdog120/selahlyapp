import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <nav className="bg-white/80 backdrop-blur-md border-b border-warm-grey/10 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-warm-grey hover:text-warm-cocoa transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Selahly</span>
                    </Link>

                    <div className="flex items-center gap-2 text-warm-cocoa">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-bold uppercase tracking-wider">Legal Center</span>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-warm-grey/5">
                    {children}
                </div>

                <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-warm-grey/60">
                    <Link href="/legal/privacy" className="hover:text-warm-cocoa underline decoration-warm-cocoa/30">Privacy Policy</Link>
                    <span>•</span>
                    <Link href="/legal/terms" className="hover:text-warm-cocoa underline decoration-warm-cocoa/30">Terms of Service</Link>
                    <span>•</span>
                    <Link href="/legal/safety" className="hover:text-warm-cocoa underline decoration-warm-cocoa/30">Safety & Risk (DPIA)</Link>
                </div>
            </main>
        </div>
    );
}
