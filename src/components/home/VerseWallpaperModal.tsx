"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Download, Share2, Loader2, Sparkles } from "lucide-react";

interface VerseWallpaperModalProps {
    isOpen: boolean;
    onClose: () => void;
    verseText: string;
    verseReference: string;
}

const SOLID_COLORS = [
    { name: "Cream 🍦", value: "#FDFBF7", font: "#4A3E3D" },
    { name: "Soft Blush 🌸", value: "#FFF0EB", font: "#7C524F" },
    { name: "Sage Green 🌿", value: "#F1F5E8", font: "#3D4F3D" },
    { name: "Lavender ☂️", value: "#F5EFFB", font: "#4A3D54" },
    { name: "Slate Blue 🌊", value: "#ECEFF4", font: "#3B4A5C" },
    { name: "Deep Velvet 🌌", value: "#1A1322", font: "#E6E0EC" }
];

const GRADIENTS = [
    { name: "Blush & Gold Sunset 🌅", colors: ["#FFF0EB", "#FDE68A", "#FED7AA"], font: "#7C524F" },
    { name: "Sage & Mist 🌬️", colors: ["#E8F0E6", "#D1FAE5", "#A7F3D0"], font: "#2D3E35" },
    { name: "Velvet Starry Night 🌌", colors: ["#1A1322", "#3B1E54", "#110D18"], font: "#FDFBF7" }
];

const PATTERNS = [
    { name: "Gingham Checkered 🏁", type: "gingham", bg: "#FFF0EB", stripe: "rgba(212, 165, 165, 0.25)", dot: "", font: "#7C524F" },
    { name: "Cute Polka Dot ⚪", type: "polka", bg: "#FDFBF7", stripe: "", dot: "rgba(124, 82, 79, 0.08)", font: "#4A3E3D" }
];

export function VerseWallpaperModal({ isOpen, onClose, verseText, verseReference }: VerseWallpaperModalProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [bgType, setBgType] = useState<"solid" | "gradient" | "pattern">("solid");
    const [selectedSolid, setSelectedSolid] = useState(0);
    const [selectedGradient, setSelectedGradient] = useState(0);
    const [selectedPattern, setSelectedPattern] = useState(0);
    const [borderStyle, setBorderStyle] = useState<"none" | "double" | "dashed">("double");
    const [watermarkPos, setWatermarkPos] = useState<"top" | "bottom" | "none">("bottom");
    
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    // Redraw wallpaper whenever customization settings change
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set dimensions (standard mobile aspect ratio 1080x1920)
        canvas.width = 1080;
        canvas.height = 1920;

        // Determine colors & font styles
        let fontColor = "#4A3E3D";
        let isDark = false;

        // 1. Draw Background
        if (bgType === "solid") {
            const solid = SOLID_COLORS[selectedSolid];
            ctx.fillStyle = solid.value;
            ctx.fillRect(0, 0, 1080, 1920);
            fontColor = solid.font;
            isDark = solid.value === "#1A1322";
        } else if (bgType === "gradient") {
            const grad = GRADIENTS[selectedGradient];
            const canvasGrad = ctx.createLinearGradient(0, 0, 0, 1920);
            grad.colors.forEach((c, i) => {
                canvasGrad.addColorStop(i / (grad.colors.length - 1), c);
            });
            ctx.fillStyle = canvasGrad;
            ctx.fillRect(0, 0, 1080, 1920);
            fontColor = grad.font;
            isDark = grad.colors[0] === "#1A1322";
        } else {
            const pattern = PATTERNS[selectedPattern];
            ctx.fillStyle = pattern.bg;
            ctx.fillRect(0, 0, 1080, 1920);
            fontColor = pattern.font;

            if (pattern.type === "gingham") {
                // Draw horizontal stripes
                ctx.fillStyle = pattern.stripe;
                for (let y = 0; y < 1920; y += 120) {
                    ctx.fillRect(0, y, 1080, 60);
                }
                // Draw vertical stripes
                for (let x = 0; x < 1080; x += 120) {
                    ctx.fillRect(x, 0, 60, 1920);
                }
            } else if (pattern.type === "polka") {
                ctx.fillStyle = pattern.dot;
                for (let x = 60; x < 1080; x += 120) {
                    for (let y = 60; y < 1920; y += 120) {
                        ctx.beginPath();
                        ctx.arc(x, y, 12, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

        // 2. Draw Borders
        ctx.strokeStyle = fontColor;
        if (borderStyle === "double") {
            ctx.lineWidth = 4;
            ctx.strokeRect(50, 50, 980, 1820);
            ctx.lineWidth = 12;
            ctx.strokeRect(70, 70, 940, 1780);
        } else if (borderStyle === "dashed") {
            ctx.lineWidth = 6;
            ctx.setLineDash([25, 25]);
            ctx.strokeRect(60, 60, 960, 1800);
            ctx.setLineDash([]);
        }

        // 3. Draw Watermark/Logo ౨ৎ
        if (watermarkPos !== "none") {
            ctx.fillStyle = fontColor;
            ctx.textAlign = "center";
            ctx.font = "italic 90px Georgia, serif";
            
            const wY = watermarkPos === "top" ? 280 : 1680;
            ctx.fillText("౨ৎ", 540, wY);

            ctx.font = "bold tracking-widest 24px sans-serif";
            const sY = watermarkPos === "top" ? 330 : 1720;
            ctx.fillText("SELAHLY", 540, sY);
        }

        // 4. Draw Scripture Verse Text
        ctx.fillStyle = fontColor;
        ctx.textAlign = "center";
        
        // Draw quotation mark
        ctx.font = "italic bold 180px Georgia, serif";
        ctx.fillStyle = fontColor + "20"; // 12% opacity
        ctx.fillText("“", 540, 650);

        // Draw actual verse wrapped
        ctx.fillStyle = fontColor;
        ctx.font = "italic 46px Georgia, serif";
        const maxTextWidth = 760;
        const lineHt = 70;
        
        const lines = wrapText(ctx, `"${verseText}"`, maxTextWidth);
        const startY = 960 - ((lines.length - 1) * lineHt) / 2;

        lines.forEach((line, idx) => {
            ctx.fillText(line, 540, startY + idx * lineHt);
        });

        // Draw scripture reference
        ctx.font = "bold 32px Georgia, serif";
        ctx.fillText(`— ${verseReference}`, 540, startY + lines.length * lineHt + 60);

        // Generate data URL for preview img
        setPreviewUrl(canvas.toDataURL("image/png"));

    }, [isOpen, bgType, selectedSolid, selectedGradient, selectedPattern, borderStyle, watermarkPos, verseText, verseReference]);

    // Text wrap utility
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement("a");
        link.download = `Selahly_${verseReference.replace(/[: ]/g, "_")}_Wallpaper.png`;
        link.href = previewUrl;
        link.click();
    };

    const handlePostToLilyPad = async () => {
        if (!previewUrl) return;
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Convert dataURL to Blob
            const response = await fetch(previewUrl);
            const blob = await response.blob();

            const fileName = `${user.id}/wallpaper-${Date.now()}.png`;

            // 1. Upload to Supabase bucket 'posts'
            const { error: uploadError } = await supabase.storage
                .from("posts")
                .upload(fileName, blob, {
                    contentType: "image/png"
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("posts")
                .getPublicUrl(fileName);

            // 2. Insert feed post
            const postCaption = `Created a custom wallpaper card for my daily reflection: "${verseText}" (${verseReference}) ✨ ౨ৎ`;
            const { error: dbError } = await supabase.from("posts").insert({
                user_id: user.id,
                caption: postCaption,
                media_urls: [publicUrl],
                type: "image",
                image_url: publicUrl
            });

            if (dbError) throw dbError;

            alert("Successfully posted to Lily Pad! 🌸");
            onClose();
            window.location.reload();
        } catch (error) {
            console.error("Failed to post wallpaper:", error);
            alert("Failed to share wallpaper. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-warm-paper flex flex-col max-h-[85vh] max-h-[85dvh] min-h-0 overflow-hidden">
                <div className="shrink-0 pb-2 border-b border-warm-grey/5 text-center mb-2 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-muted-rose" />
                    <DialogTitle className="font-serif">Aesthetic Wallpaper Creator</DialogTitle>
                </div>

                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-1">
                        
                        {/* Wallpaper Preview Column (Left) */}
                        <div className="md:col-span-6 flex flex-col items-center">
                            <div className="aspect-[9/16] w-full max-w-[240px] bg-stone-100 rounded-2xl overflow-hidden shadow-lg border border-warm-grey/15 relative">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Wallpaper Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-warm-grey/40 text-xs italic">
                                        Generating...
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-warm-grey/40 text-center mt-2 italic">
                                Phone Lockscreen Preview (1080 x 1920 px)
                            </p>
                        </div>

                        {/* Configuration Controls (Right) */}
                        <div className="md:col-span-6 space-y-4 text-left">
                            {/* Hidden canvas for drawing */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Background Type */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-warm-grey uppercase tracking-widest block">
                                    Background Mode
                                </label>
                                <div className="flex gap-2">
                                    {(["solid", "gradient", "pattern"] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setBgType(t)}
                                            className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold capitalize border transition-all ${
                                                bgType === t
                                                    ? "bg-muted-rose text-white border-muted-rose shadow-sm"
                                                    : "bg-white text-warm-grey/70 border-warm-grey/10 hover:bg-stone-50"
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Background Style Selectors */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-warm-grey uppercase tracking-widest block">
                                    Background Style
                                </label>
                                <div className="max-h-24 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                                    {bgType === "solid" &&
                                        SOLID_COLORS.map((color, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedSolid(idx)}
                                                className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                                    selectedSolid === idx
                                                        ? "border-muted-rose bg-muted-rose/5 text-muted-rose font-bold"
                                                        : "border-warm-grey/10 bg-white hover:bg-stone-50 text-warm-grey"
                                                }`}
                                            >
                                                <span>{color.name}</span>
                                                <span 
                                                    className="w-3.5 h-3.5 rounded-full border border-warm-grey/10 shadow-sm"
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            </button>
                                        ))}

                                    {bgType === "gradient" &&
                                        GRADIENTS.map((grad, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedGradient(idx)}
                                                className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                                    selectedGradient === idx
                                                        ? "border-muted-rose bg-muted-rose/5 text-muted-rose font-bold"
                                                        : "border-warm-grey/10 bg-white hover:bg-stone-50 text-warm-grey"
                                                }`}
                                            >
                                                <span>{grad.name}</span>
                                                <span 
                                                    className="w-7 h-3.5 rounded-md border border-warm-grey/10 shadow-sm"
                                                    style={{ background: `linear-gradient(to right, ${grad.colors.join(", ")})` }}
                                                />
                                            </button>
                                        ))}

                                    {bgType === "pattern" &&
                                        PATTERNS.map((pat, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedPattern(idx)}
                                                className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                                    selectedPattern === idx
                                                        ? "border-muted-rose bg-muted-rose/5 text-muted-rose font-bold"
                                                        : "border-warm-grey/10 bg-white hover:bg-stone-50 text-warm-grey"
                                                }`}
                                            >
                                                <span>{pat.name}</span>
                                                <span className="text-[10px] text-warm-grey/40">Pattern Overlay</span>
                                            </button>
                                        ))}
                                </div>
                            </div>

                            {/* Border Style */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-warm-grey uppercase tracking-widest block">
                                    Border Outline
                                </label>
                                <div className="flex gap-2">
                                    {(["none", "double", "dashed"] as const).map((b) => (
                                        <button
                                            key={b}
                                            onClick={() => setBorderStyle(b)}
                                            className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold capitalize border transition-all ${
                                                borderStyle === b
                                                    ? "bg-muted-rose text-white border-muted-rose shadow-sm"
                                                    : "bg-white text-warm-grey/70 border-warm-grey/10 hover:bg-stone-50"
                                            }`}
                                        >
                                            {b}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Logo Position */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-warm-grey uppercase tracking-widest block">
                                    Selahly ౨ৎ Watermark
                                </label>
                                <div className="flex gap-2">
                                    {(["top", "bottom", "none"] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setWatermarkPos(p)}
                                            className={`flex-1 py-1 px-2.5 rounded-full text-xs font-bold capitalize border transition-all ${
                                                watermarkPos === p
                                                    ? "bg-muted-rose text-white border-muted-rose shadow-sm"
                                                    : "bg-white text-warm-grey/70 border-warm-grey/10 hover:bg-stone-50"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-warm-grey/5 shrink-0">
                    <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
                    
                    <Button
                        variant="secondary"
                        onClick={handleDownload}
                        disabled={saving}
                        className="bg-stone-100 hover:bg-stone-200 text-warm-grey flex items-center gap-1.5"
                    >
                        <Download className="w-4 h-4" /> Download
                    </Button>

                    <Button
                        onClick={handlePostToLilyPad}
                        disabled={saving}
                        className="bg-muted-rose text-white hover:bg-muted-rose/90 flex items-center gap-1.5"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Share2 className="w-4 h-4" />
                        )}
                        Post to Lily Pad
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
