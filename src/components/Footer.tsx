import Link from "next/link";
import { Instagram, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full bg-stone-50 border-t border-stone-200 py-8 mt-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-serif text-warm-cocoa font-bold">Selahly</span>
                    <span className="text-xs text-warm-grey">© {new Date().getFullYear()}</span>
                </div>

                <div className="flex items-center gap-6">
                    <a
                        href="https://instagram.com/selahlyapp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-warm-grey hover:text-sage-green transition-colors text-sm group"
                    >
                        <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        @selahlyapp
                    </a>
                </div>

                <div className="flex items-center gap-1 text-xs text-warm-grey/60">
                    Made with <Heart className="w-3 h-3 text-muted-rose fill-muted-rose" /> for Sisters
                </div>
            </div>
        </footer>
    );
}
