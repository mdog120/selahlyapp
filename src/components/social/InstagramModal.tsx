"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { InstagramPost } from "@/lib/instagram";
import { Button } from "@/components/ui/Button";

interface InstagramModalProps {
    post: InstagramPost | null;
    onClose: () => void;
}

export function InstagramModal({ post, onClose }: InstagramModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (post) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [post]);

    if (!post) return null;

    // Format timestamp
    const date = new Date(post.timestamp).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                className="absolute inset-0"
                onClick={onClose}
                aria-label="Close modal"
            />

            <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] animate-scale-in">

                {/* Close Button Mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white md:hidden"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Media Section */}
                <div className="w-full md:w-[60%] bg-black flex items-center justify-center relative min-h-[300px] md:min-h-full">
                    <div className="relative w-full h-full min-h-[300px]">
                        <Image
                            src={post.media_url}
                            alt={post.caption || "Instagram Post"}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="w-full md:w-[40%] flex flex-col h-full bg-white">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white p-[2px]">
                                    {/* Placeholder Avatar */}
                                    <div className="w-full h-full rounded-full bg-gray-200" />
                                </div>
                            </div>
                            <span className="font-semibold text-sm">{post.username}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="hidden md:block text-gray-400 hover:text-gray-900"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {post.caption}
                        </p>
                        <p className="text-xs text-gray-400 mt-4 uppercase tracking-wider">
                            {date}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-4 mb-4">
                            <Heart className="w-6 h-6 text-gray-800 hover:text-red-500 cursor-pointer transition-colors" />
                            <MessageCircle className="w-6 h-6 text-gray-800 hover:text-blue-500 cursor-pointer transition-colors" />
                        </div>

                        <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                        >
                            <Button variant="outline" className="w-full flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                View on Instagram
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
