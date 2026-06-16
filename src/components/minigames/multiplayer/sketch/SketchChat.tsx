"use client";

import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  text: string;
  isCorrect?: boolean;
  isSystem?: boolean;
  timestamp: number;
}

interface SketchChatProps {
  messages: ChatMessage[];
  onSendGuess: (text: string) => void;
  disabled: boolean;
  disabledMessage?: string;
  currentUserId: string;
}

const getAvatarBg = (id: string) => {
  const colors = [
    "bg-pink-100 text-pink-700",
    "bg-emerald-100 text-emerald-800",
    "bg-purple-100 text-purple-800",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-800",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return colors[hash % colors.length];
};

export function SketchChat({
  messages,
  onSendGuess,
  disabled,
  disabledMessage = "You're drawing! No guessing 🎨",
  currentUserId,
}: SketchChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSendGuess(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin space-y-1 px-3 py-2"
      >
        {messages.map((msg) => {
          // System messages
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="flex items-center justify-center py-1"
              >
                <span className="text-[10px] italic text-warm-grey/40 text-center">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isOwn = msg.user_id === currentUserId;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-1.5 rounded-lg px-2 py-1 transition-colors ${
                msg.isCorrect
                  ? "bg-emerald-50 border-l-2 border-emerald-400"
                  : isOwn
                    ? "bg-amber-50/40"
                    : ""
              }`}
            >
              {/* Avatar */}
              {msg.avatar_url ? (
                <img
                  src={msg.avatar_url}
                  alt={msg.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold ${getAvatarBg(msg.user_id)}`}
                >
                  {msg.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-warm-cocoa">
                  {msg.name}
                </span>
                {msg.isCorrect ? (
                  <p className="text-xs font-bold text-emerald-700 break-words">
                    ✨ {msg.text}
                  </p>
                ) : (
                  <p className="text-xs text-warm-grey break-words">
                    {msg.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-warm-grey/5 px-3 py-2">
        {disabled ? (
          <div className="flex items-center justify-center rounded-xl bg-warm-grey/5 px-3 py-2">
            <span className="text-[11px] text-warm-grey/40 italic text-center">
              {disabledMessage}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your guess..."
              className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs outline-none focus:border-warm-cocoa/30 focus:ring-1 focus:ring-warm-cocoa/10 transition-all placeholder:text-warm-grey/30"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-warm-cocoa text-white transition-all active:scale-95 disabled:opacity-30 disabled:active:scale-100 hover:bg-warm-cocoa/90"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
