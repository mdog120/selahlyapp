"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImagePlus, Loader2 } from "lucide-react";

const SCRAPBOOK_FRAMES = [
    { name: "polaroid", label: "Polaroid 📸" },
    { name: "lace", label: "Lace 🎀" },
    { name: "gingham", label: "Gingham 🏁" },
    { name: "polka", label: "Polka Dot ⚪" }
];

interface ScrapbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ScrapbookModal({ isOpen, onClose, onSuccess }: ScrapbookModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [selectedFrame, setSelectedFrame] = useState("polaroid");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!file || !caption) return;
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Upload Image
            const fileName = `${user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from("scrapbook")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("scrapbook")
                .getPublicUrl(fileName);

            // 2. Insert Entry
            const { error: dbError } = await supabase.from("scrapbook_entries").insert({
                user_id: user.id,
                image_url: publicUrl,
                caption: caption,
                styles: { filter: "polaroid", frame: selectedFrame }
            });

            if (dbError) throw dbError;

            // Reset & Close
            setFile(null);
            setPreview(null);
            setCaption("");
            setSelectedFrame("polaroid");
            onSuccess();

        } catch (error) {
            console.error("Scrapbook upload failed:", error);
            alert("Failed to upload memory. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-warm-paper">
                <DialogHeader>
                    <DialogTitle>New Memory 📸</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Image Preview / Upload Area */}
                    <div
                        className={`aspect-square mx-auto w-64 relative cursor-pointer group transition-transform hover:scale-[1.02] ${
                            selectedFrame === 'polaroid' ? 'border-polaroid' :
                            selectedFrame === 'lace' ? 'border-lace' :
                            selectedFrame === 'gingham' ? 'border-gingham' :
                            selectedFrame === 'polka' ? 'border-polka' : 'border-polaroid'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-full h-full flex flex-col justify-between">
                            <div className="flex-1 bg-stone-100 overflow-hidden relative rounded filter sepia-[.2] contrast-110 brightness-110">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/20 to-blue-50/10 pointer-events-none mix-blend-overlay"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-warm-grey/40 group-hover:text-muted-rose transition-colors p-4">
                                        <ImagePlus className="w-8 h-8 mb-1" />
                                        <span className="text-xs font-medium">Click to upload photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="h-6 flex items-center justify-center mt-2 overflow-hidden shrink-0">
                                <p className="font-handwriting text-warm-grey text-base truncate px-1">
                                    {caption || "Memory lane..."}
                                </p>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-warm-grey uppercase tracking-widest">Caption</label>
                        <Input
                            placeholder="Write something cute..."
                            value={caption}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaption(e.target.value)}
                            className="font-handwriting text-lg"
                            maxLength={40}
                        />
                        <p className="text-[10px] text-warm-grey/40 text-right">{caption.length}/40</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-warm-grey uppercase tracking-widest">Select Frame</label>
                        <div className="flex flex-wrap gap-2">
                            {SCRAPBOOK_FRAMES.map((frame) => (
                                <button
                                    key={frame.name}
                                    type="button"
                                    onClick={() => setSelectedFrame(frame.name)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        selectedFrame === frame.name
                                            ? "bg-muted-rose text-white border-muted-rose shadow-sm"
                                            : "bg-white text-warm-grey/70 border-warm-grey/10 hover:bg-stone-50"
                                    }`}
                                >
                                    {frame.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || !caption || uploading}
                            className="bg-muted-rose text-white hover:bg-muted-rose/90"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Memory"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
