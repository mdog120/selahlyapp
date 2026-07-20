"use client";

import { useEffect } from "react";
import Script from "next/script";
import { Instagram } from "lucide-react";

export function InstagramEmbed() {
    useEffect(() => {
        // Force reprocessing of embeds if script is already loaded
        if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
        }
    }, []);

    return (
        <div className="w-full flex justify-center my-4 overflow-hidden">
            <blockquote
                className="instagram-media w-full"
                data-instgrm-permalink="https://www.instagram.com/selahlyapp/"
                data-instgrm-version="14"
                style={{
                    background: "#FFF",
                    border: "0",
                    borderRadius: "24px",
                    boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)",
                    margin: "1px",
                    maxWidth: "540px",
                    minWidth: "326px",
                    padding: "0",
                    width: "calc(100% - 2px)",
                }}
            >
                {/* Clean, themed fallback blockquote content */}
                <div className="p-6 flex flex-col items-center justify-center text-center bg-white rounded-[24px]">
                    <div className="w-12 h-12 rounded-full bg-muted-rose/10 flex items-center justify-center mb-3">
                        <Instagram className="w-6 h-6 text-muted-rose" />
                    </div>
                    <a 
                        href="https://www.instagram.com/selahlyapp/" 
                        className="text-warm-cocoa font-bold font-serif hover:underline text-sm block mb-1"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        @selahlyapp
                    </a>
                    <p className="text-[11px] text-warm-grey/50 mb-4 leading-normal">
                        Click to view our daily inspiration on Instagram
                    </p>
                    <a 
                        href="https://www.instagram.com/selahlyapp/"
                        className="px-4 py-2 bg-warm-cocoa text-white text-xs font-serif font-bold rounded-xl shadow-sm hover:shadow hover:scale-[1.02] active:scale-95 transition-all"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View Profile
                    </a>
                </div>
            </blockquote>
            <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
        </div>
    );
}
