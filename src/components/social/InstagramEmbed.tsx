"use client";

import { useEffect } from "react";
import Script from "next/script";

export function InstagramEmbed() {
    useEffect(() => {
        // Force reprocessing of embeds if script is already loaded
        if ((window as any).instgrm) {
            (window as any).instgrm.Embeds.process();
        }
    }, []);

    return (
        <div className="w-full flex justify-center my-8">
            <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/selahly.app/"
                data-instgrm-version="14"
                style={{
                    background: "#FFF",
                    border: "0",
                    borderRadius: "3px",
                    boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                    margin: "1px",
                    maxWidth: "540px",
                    minWidth: "326px",
                    padding: "0",
                    width: "99.375%",
                    // @ts-ignore
                    WebkitCalc: "100% - 2px",
                    calc: "100% - 2px",
                }}
            >
                <div style={{ padding: "16px" }}>
                    <a href="https://www.instagram.com/selahly.app/" style={{ background: "#FFFFFF", lineHeight: "0", padding: "0 0", textAlign: "center", textDecoration: "none", width: "100%" }} target="_blank">
                        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                            <div style={{ backgroundColor: "#F4F4F4", borderRadius: "50%", flexGrow: 0, height: "40px", marginRight: "14px", width: "40px" }}></div>
                            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyItems: "flex-start" }}>
                                <div style={{ backgroundColor: "#F4F4F4", borderRadius: "4px", flexGrow: 0, height: "14px", marginBottom: "6px", width: "100px" }}></div>
                                <div style={{ backgroundColor: "#F4F4F4", borderRadius: "4px", flexGrow: 0, height: "14px", width: "60px" }}></div>
                            </div>
                        </div>
                        <div style={{ padding: "19% 0" }}></div>
                        <div style={{ display: "block", height: "50px", margin: "0 auto 12px", width: "50px" }}></div>
                        <div style={{ paddingTop: "8px" }}>
                            <div style={{ color: "#3897f0", fontFamily: "Arial,sans-serif", fontSize: "14px", fontStyle: "normal", fontWeight: "550", lineHeight: "18px" }}>
                                View this post on Instagram
                            </div>
                        </div>
                        <div style={{ padding: "12.5% 0" }}></div>
                        <div style={{ display: "flex", flexDirection: "row", marginBottom: "14px", alignItems: "center" }}>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyItems: "flex-center", marginBottom: "24px" }}>
                            <div style={{ backgroundColor: "#F4F4F4", borderRadius: "4px", flexGrow: 0, height: "14px", marginBottom: "6px", width: "224px" }}></div>
                            <div style={{ backgroundColor: "#F4F4F4", borderRadius: "4px", flexGrow: 0, height: "14px", width: "144px" }}></div>
                        </div>
                    </a>
                </div>
            </blockquote>
            <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
        </div>
    );
}
