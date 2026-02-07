"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImagePlus, Loader2 } from "lucide-react";

interface ScrapbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ScrapbookModal({ isOpen, onClose, onSuccess }: ScrapbookModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
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
                styles: { filter: "polaroid" }
            });

            if (dbError) throw dbError;

            // Reset & Close
            setFile(null);
            setPreview(null);
            setCaption("");
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
                        className="aspect-square bg-white shadow-lg mx-auto w-64 relative cursor-pointer group flex items-center justify-center border-8 border-white border-b-[3rem] transition-transform hover:scale-[1.02]"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {preview ? (
                            <div className="w-full h-full relative overflow-hidden filter sepia-[.2] contrast-110 brightness-110">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/20 to-blue-50/10 pointer-events-none mix-blend-overlay"></div>
                            </div>
                        ) : (
                            <div className="text-center text-warm-grey/40 group-hover:text-muted-rose transition-colors">
                                <ImagePlus className="w-12 h-12 mx-auto mb-2" />
                                <span className="text-sm font-medium">Click to upload photo</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />

                        {/* Simulation of handwritten caption on the frame bottom */}
                        {caption && (
                            <div className="absolute -bottom-10 left-0 right-0 text-center font-handwriting text-warm-grey truncate px-2">
                                {caption}
                            </div>
                        )}
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
