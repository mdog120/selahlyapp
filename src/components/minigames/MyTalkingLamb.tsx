"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, Moon, Sun, Utensils, MessageCircle, Send, ShieldAlert, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export function MyTalkingLamb() {
  // ─── Stats States ──────────────────────────────────────────
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(60);
  const [cleanliness, setCleanliness] = useState(80);
  const [energy, setEnergy] = useState(50);
  
  const [isSleeping, setIsSleeping] = useState(false);
  const [accessory, setAccessory] = useState<"none" | "bow" | "bell" | "crown" | "scarf">("none");
  const [lastAction, setLastAction] = useState<"none" | "feeding" | "petting" | "bathing" | "sleeping">("none");
  
  // ─── Chat & Dialogue States ────────────────────────────────
  const [dialogue, setDialogue] = useState("Baa! Hello, sweet sister! Welcome to my quiet pasture. 🐑");
  const [chatInput, setChatInput] = useState("");
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // ─── Visual Particles ──────────────────────────────────────
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // ─── Local Storage Initialization ─────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selahly_talking_lamb");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHunger(parsed.hunger ?? 70);
        setHappiness(parsed.happiness ?? 60);
        setCleanliness(parsed.cleanliness ?? 80);
        setEnergy(parsed.energy ?? 50);
        setAccessory(parsed.accessory ?? "none");
        setIsSleeping(parsed.isSleeping ?? false);
      } catch (e) {
        console.error("Failed to load lamb stats", e);
      }
    }
  }, []);

  // Save Stats on Change
  useEffect(() => {
    localStorage.setItem(
      "selahly_talking_lamb",
      JSON.stringify({ hunger, happiness, cleanliness, energy, accessory, isSleeping })
    );
  }, [hunger, happiness, cleanliness, energy, accessory, isSleeping]);

  // ─── Dynamic Draining / Refilling over time ────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSleeping) {
        // Refill energy when sleeping, minor hunger drain
        setEnergy((prev) => Math.min(prev + 4, 100));
        setHunger((prev) => Math.max(prev - 0.5, 0));
        setHappiness((prev) => Math.max(prev - 0.2, 0));
      } else {
        // Normal awake drain
        setHunger((prev) => Math.max(prev - 1.2, 0));
        setHappiness((prev) => Math.max(prev - 0.8, 0));
        setCleanliness((prev) => Math.max(prev - 0.6, 0));
        setEnergy((prev) => Math.max(prev - 1.0, 0));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // ─── Idle Blinking Animation ──────────────────────────────
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isSleeping) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  // ─── Talking mouth movement simulation ────────────────────
  const speak = (text: string) => {
    setDialogue(text);
    setIsTalking(true);
    let count = 0;
    const interval = setInterval(() => {
      setIsTalking((prev) => !prev);
      count++;
      if (count > 6) {
        clearInterval(interval);
        setIsTalking(false);
      }
    }, 200);
  };

  // ─── Spawn Floating Particle Helpers ────────────────────────
  const spawnParticles = (emoji: string, count = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particleIdRef.current += 1;
      newParticles.push({
        id: particleIdRef.current,
        x: Math.random() * 100 - 50, // relative to center
        y: Math.random() * 40 - 20,
        emoji,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    
    // Clear particles after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  };

  // ─── Action Handlers ────────────────────────────────────────
  const handlePet = () => {
    if (isSleeping) {
      speak("Shhh... I am sleeping right now, baa... 💤");
      return;
    }
    setLastAction("petting");
    setHappiness((prev) => Math.min(prev + 10, 100));
    spawnParticles("❤️", 6);
    speak("Baa! That tickles! I love being your friend! 🥰");
    setTimeout(() => setLastAction("none"), 1000);
  };

  const handleFeed = (foodType: "clover" | "apple" | "manna") => {
    if (isSleeping) {
      speak("Baa... feed me when I wake up, please... 💤");
      return;
    }
    setLastAction("feeding");
    let points = 15;
    let emoji = "🍀";
    let message = "Baa! Yummy clover! Thank you, sister! 🍀";

    if (foodType === "apple") {
      points = 25;
      emoji = "🍎";
      message = "Crunch crunch! This apple is so sweet! 🍎";
    } else if (foodType === "manna") {
      points = 40;
      emoji = "🍞";
      message = "Baa! Scripture bread! My spirit and tummy are full! 📖✨";
    }

    setHunger((prev) => Math.min(prev + points, 100));
    setHappiness((prev) => Math.min(prev + 5, 100));
    spawnParticles(emoji, 6);
    speak(message);
    setTimeout(() => setLastAction("none"), 1200);
  };

  const handleClean = (cleanType: "bath" | "brush") => {
    if (isSleeping) {
      speak("Baa... let's wash my wool when the sun rises... 💤");
      return;
    }
    setLastAction("bathing");
    let points = 20;
    let emoji = "✨";
    let message = "Baa! Brush, brush, my wool is getting so neat! 🧼";

    if (cleanType === "bath") {
      points = 40;
      emoji = "🫧";
      message = "Splish splash! A warm bubble bath feels so cozy! 🫧";
    }

    setCleanliness((prev) => Math.min(prev + points, 100));
    setHappiness((prev) => Math.min(prev + 5, 100));
    spawnParticles(emoji, 7);
    speak(message);
    setTimeout(() => setLastAction("none"), 1500);
  };

  const toggleSleep = () => {
    if (isSleeping) {
      setIsSleeping(false);
      setLastAction("none");
      speak("Good morning! Baa! I slept so well! ☀️");
    } else {
      setIsSleeping(true);
      setLastAction("sleeping");
      speak("Goodnight, sweet sister... God watches over us... Zzz... 🌙");
    }
  };

  // ─── Dialogue Match Logic ───────────────────────────────────
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const input = chatInput.trim();
    setChatInput("");

    if (isSleeping) {
      speak("Zzz... (The lamb is fast asleep. Whisper next time!) 🌙");
      return;
    }

    // Update Happiness
    setHappiness((prev) => Math.min(prev + 5, 100));
    spawnParticles("✨", 3);

    const text = input.toLowerCase();
    let reply = "";

    if (text.includes("sad") || text.includes("cry") || text.includes("lonely") || text.includes("hurt")) {
      reply = "Baa... don't be sad, little sister! The Good Shepherd is holding you close today. 🌸";
    } else if (text.includes("scared") || text.includes("afraid") || text.includes("fear") || text.includes("anxious") || text.includes("worry")) {
      reply = "Baa! 'Do not fear, for I am with you.' (Isaiah 41:10) You are safe and sound! 🌿";
    } else if (text.includes("love")) {
      reply = "Baa! I love you too! And remember, Jesus loves you infinitely more! ❤️";
    } else if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("greet")) {
      reply = "Baa! Hello, sweet sister! I'm so happy you came to talk to me! 🐑";
    } else if (text.includes("tired") || text.includes("sleepy") || text.includes("exhausted") || text.includes("weary")) {
      reply = "Baa! Take a deep breath. 'He makes me lie down in green pastures...' (Psalm 23:2) 🌿";
    } else if (text.includes("bible") || text.includes("scripture") || text.includes("god") || text.includes("jesus") || text.includes("faith")) {
      reply = "Baa! 'The Lord is my shepherd, I shall not want.' (Psalm 23:1) He always guides us! 📖";
    } else if (text.includes("name") || text.includes("who are you")) {
      reply = "Baa! My name is Selah, the cute little sanctuary lamb! 🐑";
    } else if (text.includes("hungry") || text.includes("food") || text.includes("eat")) {
      reply = "Baa! Feeding me clover or scripture bread makes my tummy very happy! 🍀";
    } else if (text.includes("clean") || text.includes("bath") || text.includes("dirty")) {
      reply = "Baa! A bubble bath makes my wool so soft and fluffy! 🧼";
    } else if (text.includes("play") || text.includes("game")) {
      reply = "Baa! Playing together is my favorite thing! Pet my wool to make me smile! 🥰";
    } else {
      const randomReplies = [
        "Baa! You are so precious in His sight! ✨",
        "Baa! Have you taken a moment to rest and pray today? 🌸",
        "Baa! A cheerful heart is good medicine! (Proverbs 17:22) 💖",
        "Baa! Your heart is a beautiful garden. Grow in grace! 🌿",
        "Baa! I'm listening, sweet sister! Tell me more. 🥰",
        "Baa! Remember, you are never alone. The Shepherd is always near. 🐑"
      ];
      reply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
    }

    speak(reply);
  };

  // ─── Stat Color Helper ─────────────────────────────────────
  const getBarColor = (val: number) => {
    if (val < 25) return "bg-red-400";
    if (val < 50) return "bg-amber-400";
    return "bg-emerald-400";
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full select-none pb-8 animate-fade-in text-warm-cocoa">
      
      {/* Game Layout Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: Stats and Controls */}
        <div className="md:col-span-5 flex flex-col gap-4">
          
          {/* Stat Box */}
          <div className="bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col gap-3.5 backdrop-blur-sm">
            <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-warm-cocoa/40 mb-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#D4A5A5]" /> Lamb Status
            </h3>

            {/* Hunger */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">🍀 Hunger</span>
                <span>{Math.round(hunger)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(hunger)}`}
                  style={{ width: `${hunger}%` }}
                />
              </div>
            </div>

            {/* Happiness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">❤️ Happiness</span>
                <span>{Math.round(happiness)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(happiness)}`}
                  style={{ width: `${happiness}%` }}
                />
              </div>
            </div>

            {/* Cleanliness */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">🧼 Cleanliness</span>
                <span>{Math.round(cleanliness)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(cleanliness)}`}
                  style={{ width: `${cleanliness}%` }}
                />
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">⚡ Energy</span>
                <span>{Math.round(energy)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(energy)}`}
                  style={{ width: `${energy}%` }}
                />
              </div>
            </div>

            {/* Low Warning alerts */}
            {(hunger < 25 || happiness < 25 || cleanliness < 25 || energy < 25) && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-xl border border-amber-200/50 text-[10px] font-bold text-amber-800 animate-pulse mt-1">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Take care of your lamb! It needs attention.</span>
              </div>
            )}
          </div>

          {/* Action Box */}
          <div className="bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col gap-3 backdrop-blur-sm">
            <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-warm-cocoa/40 mb-1 flex items-center gap-1">
              🛠️ Activities
            </h3>

            {/* Feeding */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Feed Lamb</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleFeed("clover")}
                  className="p-1.5 text-[9px] font-bold bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <span>🍀</span>
                  Clover
                </button>
                <button
                  onClick={() => handleFeed("apple")}
                  className="p-1.5 text-[9px] font-bold bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <span>🍎</span>
                  Apple
                </button>
                <button
                  onClick={() => handleFeed("manna")}
                  className="p-1.5 text-[9px] font-bold bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-all text-center"
                >
                  <span>🍞</span>
                  Manna
                </button>
              </div>
            </div>

            {/* Grooming */}
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Groom Wool</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleClean("brush")}
                  className="py-2 px-3 text-[9px] font-bold bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <span>🪮</span> Brush Wool
                </button>
                <button
                  onClick={() => handleClean("bath")}
                  className="py-2 px-3 text-[9px] font-bold bg-white hover:bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all"
                >
                  <span>🫧</span> Bubble Bath
                </button>
              </div>
            </div>

            {/* Sleep Toggler */}
            <button
              onClick={toggleSleep}
              className={`w-full py-2.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                isSleeping
                  ? "bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-150"
                  : "bg-[#4B3A3A] border-stone-800 text-white hover:bg-stone-800"
              }`}
            >
              {isSleeping ? (
                <>
                  <Sun className="w-3.5 h-3.5" /> Wake Up Lamb
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Put to Sleep
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Virtual Lamb Sandbox */}
        <div className="md:col-span-7 flex flex-col gap-4">
          
          {/* Main Visual Arena Card */}
          <div
            onClick={handlePet}
            className={`flex-1 min-h-[310px] rounded-3xl border border-stone-150 relative overflow-hidden shadow-sm flex flex-col items-center justify-between p-5 transition-all duration-700 cursor-pointer ${
              isSleeping
                ? "bg-gradient-to-b from-slate-900 to-indigo-950 border-slate-900 shadow-inner"
                : "bg-gradient-to-b from-sky-50 to-emerald-50"
            }`}
          >
            {/* Sleeping stars background overlay */}
            {isSleeping && (
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-4 left-6 text-xs text-yellow-200 animate-pulse">⭐️</div>
                <div className="absolute top-12 right-16 text-[10px] text-yellow-100 animate-pulse" style={{ animationDelay: "1s" }}>✨</div>
                <div className="absolute bottom-16 left-12 text-[9px] text-yellow-200 animate-pulse" style={{ animationDelay: "0.5s" }}>⭐️</div>
                <div className="absolute top-24 left-24 text-[8px] text-yellow-100 animate-pulse" style={{ animationDelay: "1.5s" }}>✨</div>
              </div>
            )}

            {/* Dialogue Bubble */}
            <div className="w-full flex justify-center z-10">
              <div className={`max-w-[280px] p-3 rounded-2xl border text-center text-[10.5px] leading-relaxed shadow-sm font-medium relative animate-fade-in ${
                isSleeping
                  ? "bg-indigo-900/60 border-indigo-800 text-yellow-100/90"
                  : "bg-white/90 border-stone-100 text-warm-cocoa"
              }`}>
                {dialogue}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[8px] border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent ${
                  isSleeping ? "border-t-indigo-900/60" : "border-t-white/90"
                }`} />
              </div>
            </div>

            {/* Lamb SVG Rendering */}
            <div className="relative w-44 h-44 flex items-center justify-center select-none">
              
              {/* Float-up Particles */}
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 1, y: 10, scale: 0.8 }}
                    animate={{ opacity: 0, y: -80, scale: 1.5, rotate: p.x }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute text-xl pointer-events-none select-none"
                    style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
                  >
                    {p.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Sleeping Zzz bubbles */}
              {isSleeping && (
                <div className="absolute top-4 right-6 text-sm font-bold text-yellow-100/80 pointer-events-none select-none flex flex-col gap-1.5">
                  <span className="animate-bounce" style={{ animationDelay: "0s", animationDuration: "3s" }}>z</span>
                  <span className="animate-bounce ml-2 text-base" style={{ animationDelay: "1s", animationDuration: "3s" }}>Z</span>
                  <span className="animate-bounce ml-4 text-xs" style={{ animationDelay: "2s", animationDuration: "3s" }}>z</span>
                </div>
              )}

              {/* Main Lamb SVG Drawing */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 200 200"
                className={`transition-all duration-300 ${
                  lastAction === "petting" ? "scale-105" : ""
                } ${lastAction === "feeding" ? "origin-bottom animate-bounce" : ""}`}
                style={{ animationDuration: "0.6s" }}
              >
                {/* 1. FLOPPY LEGS */}
                <rect x="78" y="162" width="10" height="16" rx="4" fill="#FFE2E2" stroke="#E6D3D3" strokeWidth={1.5} />
                <rect x="112" y="162" width="10" height="16" rx="4" fill="#FFE2E2" stroke="#E6D3D3" strokeWidth={1.5} />

                {/* 2. BODY WOOL */}
                <circle cx="82" cy="144" r="15" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="100" cy="148" r="17" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="118" cy="144" r="15" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="90" cy="136" r="14" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="110" cy="136" r="14" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                {/* Fill center body */}
                <circle cx="100" cy="142" r="18" fill="#FFFFFF" />
                <circle cx="90" cy="144" r="12" fill="#FFFFFF" />
                <circle cx="110" cy="144" r="12" fill="#FFFFFF" />

                {/* 3. FLOPPY EARS */}
                {/* Left Ear */}
                <g>
                  <path d="M 66 105 Q 40 102 46 118 Q 58 120 66 112 Z" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={1.5} />
                  <path d="M 62 107 Q 44 106 48 115 Q 56 116 62 111 Z" fill="#FFB7B7" opacity="0.5" />
                </g>
                {/* Right Ear */}
                <g>
                  <path d="M 134 105 Q 160 102 154 118 Q 142 120 134 112 Z" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={1.5} />
                  <path d="M 138 107 Q 156 106 152 115 Q 144 116 138 111 Z" fill="#FFB7B7" opacity="0.5" />
                </g>

                {/* 4. FACE */}
                <ellipse cx="100" cy="115" rx="36" ry="30" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={2} />

                {/* Blush Cheeks */}
                <circle cx="76" cy="122" r="7" fill="#FFB7B7" opacity="0.6" />
                <circle cx="124" cy="122" r="7" fill="#FFB7B7" opacity="0.6" />

                {/* Eyes */}
                {isSleeping ? (
                  // Sleeping / Happy closed eyes
                  <>
                    <path d="M 76 114 Q 82 108 88 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                    <path d="M 112 114 Q 118 108 124 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                  </>
                ) : isBlinking ? (
                  // Blinking eyes
                  <>
                    <path d="M 76 112 Q 82 116 88 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                    <path d="M 112 112 Q 118 116 124 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                  </>
                ) : (
                  // Normal open anime eyes
                  <>
                    {/* Left Eye */}
                    <circle cx="82" cy="112" r="6" fill="#4B3A3A" />
                    <circle cx="80" cy="110" r="2.2" fill="white" />
                    <circle cx="83.5" cy="114" r="0.8" fill="white" />
                    {/* Right Eye */}
                    <circle cx="118" cy="112" r="6" fill="#4B3A3A" />
                    <circle cx="116" cy="110" r="2.2" fill="white" />
                    <circle cx="119.5" cy="114" r="0.8" fill="white" />
                  </>
                )}

                {/* Cute W mouth / smile */}
                {isTalking && !isSleeping ? (
                  <ellipse cx="100" cy="124" rx="3.5" ry="4.5" fill="#C06C84" />
                ) : (
                  <path d="M 96 122 Q 100 125 104 122" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
                )}

                {/* 5. TOP HEAD WOOL CAP */}
                <circle cx="86" cy="94" r="10" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="100" cy="88" r="12" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="114" cy="94" r="10" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
                {/* cover details */}
                <circle cx="94" cy="94" r="10" fill="#FFFFFF" />
                <circle cx="106" cy="94" r="10" fill="#FFFFFF" />
                <circle cx="100" cy="96" r="11" fill="#FFFFFF" />

                {/* ─── ACCESSORIES (Rendered conditionally on top) ─── */}
                {/* A. Flower Crown */}
                {accessory === "crown" && (
                  <g className="animate-fade-in">
                    {/* Flower 1 */}
                    <circle cx="86" cy="84" r="4.5" fill="#F472B6" />
                    <circle cx="91" cy="88.5" r="4.5" fill="#F472B6" />
                    <circle cx="81.5" cy="88.5" r="4.5" fill="#F472B6" />
                    <circle cx="86" cy="87.5" r="2" fill="#FCD34D" />

                    {/* Flower 2 */}
                    <circle cx="100" cy="81" r="5" fill="#60A5FA" />
                    <circle cx="105" cy="85.5" r="5" fill="#60A5FA" />
                    <circle cx="95" cy="85.5" r="5" fill="#60A5FA" />
                    <circle cx="100" cy="85" r="2.2" fill="#FCD34D" />

                    {/* Flower 3 */}
                    <circle cx="114" cy="84" r="4.5" fill="#F472B6" />
                    <circle cx="118.5" cy="88.5" r="4.5" fill="#F472B6" />
                    <circle cx="109.5" cy="88.5" r="4.5" fill="#F472B6" />
                    <circle cx="114" cy="87.5" r="2" fill="#FCD34D" />
                  </g>
                )}

                {/* B. Pink Bow (placed cute on its ear) */}
                {accessory === "bow" && (
                  <g transform="translate(68, 96)" className="animate-fade-in">
                    <path d="M -6 -6 C -12 -12, -12 0, 0 0 C -12 0, -12 12, -6 6" fill="#EC4899" stroke="#BE185D" strokeWidth={1} />
                    <path d="M 6 -6 C 12 -12, 12 0, 0 0 C 12 0, 12 12, 6 6" fill="#EC4899" stroke="#BE185D" strokeWidth={1} />
                    <circle cx="0" cy="0" r="3.5" fill="#FCD34D" />
                  </g>
                )}

                {/* C. Golden Bell (collar) */}
                {accessory === "bell" && (
                  <g className="animate-fade-in">
                    {/* collar band */}
                    <path d="M 80 131 Q 100 136 120 131 L 118 135 Q 100 140 82 135 Z" fill="#EF4444" />
                    {/* bell */}
                    <circle cx="100" cy="139" r="6.5" fill="#FBBF24" stroke="#D97706" strokeWidth={1.2} />
                    <circle cx="100" cy="142.5" r="1.8" fill="#D97706" />
                  </g>
                )}

                {/* D. Cozy Scarf */}
                {accessory === "scarf" && (
                  <g className="animate-fade-in">
                    {/* Scarf neck wrap */}
                    <path d="M 76 132 Q 100 140 124 132 Q 120 148 76 142 Z" fill="#F43F5E" stroke="#E11D48" strokeWidth={1} />
                    {/* Scarf tail */}
                    <path d="M 112 136 Q 118 158 126 166 Q 112 168 102 142 Z" fill="#E11D48" stroke="#BE123C" strokeWidth={1} />
                  </g>
                )}
              </svg>
            </div>

            {/* Instruction tooltip */}
            <span className="text-[10px] text-warm-cocoa/45 font-semibold bg-white/40 border border-white/60 px-3 py-1 rounded-full backdrop-blur-xs select-none">
              {isSleeping ? "💤 Let the lamb rest..." : "👉 Click lamb to pet"}
            </span>
          </div>

          {/* Accessory Selector Card */}
          <div className="bg-white/60 border border-stone-100 p-4 rounded-3xl shadow-sm backdrop-blur-sm">
            <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider mb-2 block">Dress up accessories</span>
            <div className="grid grid-cols-5 gap-1.5">
              {(["none", "bow", "bell", "crown", "scarf"] as const).map((acc) => (
                <button
                  key={acc}
                  onClick={() => {
                    if (isSleeping) {
                      speak("Baa... let me change my accessories when I wake up... 💤");
                      return;
                    }
                    setAccessory(acc);
                    spawnParticles("✨", 3);
                    speak(acc === "none" ? "Baa! All clean and natural! 🌸" : `Baa! Look at my new ${acc}! Cute, right? 🥰`);
                  }}
                  className={`py-2 text-[9.5px] font-bold border rounded-xl capitalize cursor-pointer active:scale-95 transition-all ${
                    accessory === acc
                      ? "bg-[#D4A5A5] border-[#D4A5A5] text-white"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  {acc === "none" ? "None" : acc}
                </button>
              ))}
            </div>
          </div>

          {/* Conversational Dialog Box */}
          <div className="bg-white/60 border border-stone-100 p-4 rounded-3xl shadow-sm flex flex-col gap-2.5 backdrop-blur-sm">
            <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-sky-400" /> Speak with Lamb
            </span>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isSleeping ? "Shhh, lamb is sleeping..." : "Type 'sad', 'scared', 'hello', or scripture keywords..."}
                disabled={isSleeping}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/70 border border-stone-200 text-xs text-warm-cocoa focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]/40 transition-all font-medium disabled:opacity-50 disabled:bg-stone-50"
                maxLength={80}
              />
              <button
                type="submit"
                disabled={isSleeping || !chatInput.trim()}
                className="px-4 py-2.5 rounded-2xl bg-warm-cocoa text-white text-xs font-bold flex items-center gap-1 hover:bg-warm-cocoa/90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:scale-100 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
          
        </div>
        
      </div>

    </div>
  );
}
