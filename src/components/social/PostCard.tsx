"use client";

import { useState, useRef, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Trash2, Flag, X, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Post = {
    id: string;
    image_url: string | null;
    media_urls: string[] | null;
    type: 'image' | 'video' | 'carousel' | 'text';
    caption: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
        id?: string;
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    user_id?: string;
    user_has_liked?: boolean;
};

// ... (existing code)

// Helper to render media content
const renderMedia = () => {
    if (post.type === 'video' && post.media_urls?.[0]) {
        return (
            <div className="aspect-[9/16] max-h-[500px] w-full bg-black rounded-2xl overflow-hidden mb-4 relative">
                <video
                    src={post.media_urls[0]}
                    controls
                    className="w-full h-full object-contain"
                    playsInline
                />
            </div>
        );
    }

    if (post.type === 'carousel' && post.media_urls && post.media_urls.length > 0) {
        return (
            <div className="relative mb-4 group">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 rounded-2xl scrollbar-hide">
                    {post.media_urls.map((url, idx) => (
                        <div key={idx} className="w-full flex-shrink-0 snap-center aspect-square bg-stone-100 relative">
                            {url.includes('.mp4') || url.includes('.mov') ? ( // Fallback check if mixed types ever happen, though we enforce type at post level
                                <video src={url} controls className="w-full h-full object-cover" />
                            ) : (
                                <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full">
                                {idx + 1}/{post.media_urls!.length}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Fallback / standard image
    const imgUrl = post.media_urls?.[0] || post.image_url;
    if (imgUrl) {
        return (
            <div className="aspect-square rounded-2xl bg-stone-100 mb-4 overflow-hidden relative group">
                <img
                    src={imgUrl}
                    alt="Post content"
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return null;
};


return (
    <div className="glass-card p-6 rounded-3xl animate-fade-in-up mb-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
            {/* ... header content ... */}
            <div className="flex items-center gap-3">
                <Link href={`/profile/${post.author?.username || ""}`} className="group flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-soft-blush flex items-center justify-center text-sm font-serif overflow-hidden group-hover:ring-2 ring-sage-green transition-all">
                        {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-warm-grey uppercase text-xs">
                                {(post.author?.first_name?.[0] || "")}
                                {(post.author?.last_name?.[0] || "")}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-warm-grey text-sm group-hover:text-sage-green transition-colors">
                            {formattedName}
                        </p>
                        <p className="text-xs text-warm-grey/40">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                    </div>
                </Link>
            </div>

            {/* Menu Dropdown */}
            <div className="relative" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} className="text-warm-grey/40 hover:text-warm-grey p-1">
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-8 bg-white/90 backdrop-blur-md border border-white/60 shadow-lg rounded-xl overflow-hidden min-w-[150px] z-50 animate-fade-in">
                        {isOwner ? (
                            <button
                                onClick={handleDelete}
                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-stone-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Post
                            </button>
                        ) : (
                            <button
                                onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                                className="w-full text-left px-4 py-3 text-sm text-warm-grey hover:bg-stone-50 flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4" /> Report
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Media Content */}
        {renderMedia()}

        {/* Caption */}
        <p className="font-serif text-lg text-warm-grey mb-4 leading-relaxed">
            {post.caption}
        </p>

        {/* Actions */}
        <div className="flex gap-6 border-t border-white/50 pt-4 mb-2">
            <button
                onClick={handleLike}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${liked ? "text-muted-rose" : "text-warm-grey/60 hover:text-muted-rose"}`}
            >
                <Heart className={`w-5 h-5 transition-transform duration-300 ${liked ? "fill-current scale-110" : ""} ${animating ? "animate-bounce" : ""}`} />
                {likesCount}
            </button>
            <button
                onClick={toggleComments}
                className="flex items-center gap-2 text-xs text-warm-grey/60 font-medium hover:text-warm-cocoa transition-colors"
            >
                <MessageCircle className="w-5 h-5" /> {commentsCount}
            </button>
            <button onClick={handleShare} className="ml-auto flex items-center gap-2 text-xs text-warm-grey/60 font-medium hover:text-warm-cocoa transition-colors">
                <Share2 className="w-5 h-5" />
            </button>
        </div>

        {/* Comments Section */}
        {showComments && (
            <div className="bg-white/40 rounded-xl p-4 mt-2 animate-fade-in-up">
                {loadingComments ? (
                    <p className="text-xs text-warm-grey/40 text-center py-2">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-warm-grey/40 text-center py-2 mb-2">No comments yet. Be the first!</p>
                ) : (
                    <div className="flex flex-col gap-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-soft-blush flex-shrink-0 flex items-center justify-center text-[10px] overflow-hidden">
                                    {comment.author?.avatar_url ? (
                                        <img src={comment.author.avatar_url} alt={comment.author.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{comment.author?.first_name?.[0] || "?"}</span>
                                    )}
                                </div>
                                <div className="bg-white/60 px-3 py-2 rounded-lg rounded-tl-none text-xs text-warm-grey flex-1">
                                    <span className="font-bold mr-1">{comment.author?.first_name}:</span>
                                    {comment.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Comment Input */}
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/60 border-none rounded-full px-4 py-2 text-xs text-warm-grey outline-none focus:ring-1 ring-sage-green/30"
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    />
                    <button
                        onClick={handlePostComment}
                        disabled={!newComment.trim()}
                        className="bg-sage-green text-white p-2 rounded-full hover:bg-sage-green/90 transition-colors disabled:opacity-50"
                    >
                        <Send className="w-3 h-3" />
                    </button>
                </div>
            </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-4/5 border border-stone-100 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-400" /> Report Post
                        </h3>
                        <button onClick={() => setShowReportModal(false)}><X className="w-5 h-5 text-warm-grey/50" /></button>
                    </div>
                    <p className="text-xs text-warm-grey/60 mb-3">Please select a reason for reporting this content:</p>

                    <div className="flex flex-col gap-2 mb-4">
                        {["Inappropriate Content", "Spam", "Harassment", "Other"].map(reason => (
                            <label key={reason} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                                <input
                                    type="radio"
                                    name="reason"
                                    value={reason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="text-sage-green focus:ring-sage-green"
                                />
                                <span className="text-sm text-warm-grey">{reason}</span>
                            </label>
                        ))}
                    </div>

                    <Button onClick={handleReport} disabled={!reportReason} className="w-full">
                        Submit Report
                    </Button>
                </div>
            </div>
        )}
    </div>
);
}
