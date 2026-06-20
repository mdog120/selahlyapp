"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, Moon, Sun, Utensils, MessageCircle, Send, ShieldAlert, Award, Map, ShoppingBag, CheckSquare, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

interface Challenge {
  id: string;
  text: string;
  target: number;
  current: number;
  reward: number;
  claimed: boolean;
}

type RoomType = "living" | "kitchen" | "bedroom" | "bathroom" | "backyard";

export function MyTalkingLamb() {
  // ─── Currency & Unlocking States ────────────────────────────
  const [coins, setCoins] = useState(50);
  const [unlockedRooms, setUnlockedRooms] = useState<RoomType[]>(["living", "kitchen", "bedroom"]);
  const [purchasedAccessories, setPurchasedAccessories] = useState<string[]>(["none", "bow"]);

  // ─── Room Navigation ────────────────────────────────────────
  const [activeRoom, setActiveRoom] = useState<RoomType>("living");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState<"food" | "wardrobe">("food");
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  
  // ─── Drawer Overlays ────────────────────────────────────────
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // ─── Pet Care Stats ─────────────────────────────────────────
  const [hunger, setHunger] = useState(70);
  const [happiness, setHappiness] = useState(60);
  const [cleanliness, setCleanliness] = useState(80);
  const [energy, setEnergy] = useState(50);
  const [isSleeping, setIsSleeping] = useState(false);
  const [accessory, setAccessory] = useState<"none" | "bow" | "bell" | "crown" | "scarf" | "royal">("none");
  const [lastAction, setLastAction] = useState<"none" | "feeding" | "petting" | "bathing" | "sleeping" | "playing">("none");

  // ─── Fridge Inventory Stock ─────────────────────────────────
  const [applesStock, setApplesStock] = useState(2);
  const [mannaStock, setMannaStock] = useState(1);
  const [cookieStock, setCookieStock] = useState(3);
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);

  // ─── Mud & Ball Interactions ────────────────────────────────
  const [mudFactor, setMudFactor] = useState(0); // 0 (clean) to 4 (very dirty)
  const [isChasingBall, setIsChasingBall] = useState(false);

  // ─── Chat & Dialogue States ─────────────────────────────────
  const [dialogue, setDialogue] = useState("Baa! Welcome to my cozy home, sister! 🐑");
  const [chatInput, setChatInput] = useState("");
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // ─── Challenges list ────────────────────────────────────────
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: "feed", text: "Feed the lamb 3 times", target: 3, current: 0, reward: 20, claimed: false },
    { id: "play", text: "Play fetch in backyard 2 times", target: 2, current: 0, reward: 15, claimed: false },
    { id: "wash", text: "Give a warm bubble bath", target: 1, current: 0, reward: 15, claimed: false }
  ]);

  // ─── Particles ──────────────────────────────────────────────
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // ─── Local Storage persistence ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selahly_talking_lamb_house");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setCoins(p.coins ?? 50);
        setUnlockedRooms(p.unlockedRooms ?? ["living", "kitchen", "bedroom"]);
        setPurchasedAccessories(p.purchasedAccessories ?? ["none", "bow"]);
        setHunger(p.hunger ?? 70);
        setHappiness(p.happiness ?? 60);
        setCleanliness(p.cleanliness ?? 80);
        setEnergy(p.energy ?? 50);
        setAccessory(p.accessory ?? "none");
        setIsSleeping(p.isSleeping ?? false);
        setApplesStock(p.applesStock ?? 2);
        setMannaStock(p.mannaStock ?? 1);
        setCookieStock(p.cookieStock ?? 3);
        setMudFactor(p.mudFactor ?? 0);
        setActiveRoom(p.activeRoom ?? "living");
        if (p.challenges) setChallenges(p.challenges);
      } catch (e) {
        console.error("Failed to load lamb house stats", e);
      }
    }
  }, []);

  // Save Stats on Change
  useEffect(() => {
    localStorage.setItem(
      "selahly_talking_lamb_house",
      JSON.stringify({
        coins,
        unlockedRooms,
        purchasedAccessories,
        hunger,
        happiness,
        cleanliness,
        energy,
        accessory,
        isSleeping,
        applesStock,
        mannaStock,
        cookieStock,
        mudFactor,
        activeRoom,
        challenges
      })
    );
  }, [coins, unlockedRooms, purchasedAccessories, hunger, happiness, cleanliness, energy, accessory, isSleeping, applesStock, mannaStock, cookieStock, mudFactor, activeRoom, challenges]);

  // ─── Dynamic Draining / Sleep refilling ──────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSleeping) {
        setEnergy((prev) => Math.min(prev + 5, 100));
        setHunger((prev) => Math.max(prev - 0.4, 0));
        setHappiness((prev) => Math.max(prev - 0.1, 0));
      } else {
        setHunger((prev) => Math.max(prev - 1.0, 0));
        setHappiness((prev) => Math.max(prev - 0.7, 0));
        setCleanliness((prev) => Math.max(prev - 0.5, 0));
        setEnergy((prev) => Math.max(prev - 0.8, 0));
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Blinking cycle
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isSleeping) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, 4500 + Math.random() * 2500);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  // ─── Talk & Particle Helpers ─────────────────────────────────
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

  const spawnParticles = (emoji: string, count = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particleIdRef.current += 1;
      newParticles.push({
        id: particleIdRef.current,
        x: Math.random() * 80 - 40,
        y: Math.random() * 30 - 15,
        emoji,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1500);
  };

  // ─── Progress Challenge Helper ───────────────────────────────
  const progressChallenge = (id: string, amount = 1) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id && !c.claimed) {
          return { ...c, current: Math.min(c.current + amount, c.target) };
        }
        return c;
      })
    );
  };

  const claimChallenge = (id: string, reward: number) => {
    setCoins((prev) => prev + reward);
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, claimed: true, current: 0 }; // reset but mark claimed
        }
        return c;
      })
    );
    speak(`Baa! Challenge completed! You earned 🪙 ${reward} coins! 🎉`);
    
    // Regenerate task after 3 seconds
    setTimeout(() => {
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return { ...c, claimed: false, current: 0 };
          }
          return c;
        })
      );
    }, 3000);
  };

  // ─── Actions & Room Interactions ────────────────────────────
  const handlePet = () => {
    if (isSleeping) {
      speak("Shhh... I am sleeping right now, baa... 💤");
      return;
    }
    setLastAction("petting");
    setHappiness((prev) => Math.min(prev + 12, 100));
    spawnParticles("❤️", 6);
    speak("Baa! That tickles! You are the best shepherd! 🥰");
    setTimeout(() => setLastAction("none"), 1000);
  };

  const handleFeed = (food: "clover" | "apple" | "manna" | "cookie") => {
    if (activeRoom !== "kitchen") {
      speak("Baa! We should go to the Kitchen to eat! 🍳");
      return;
    }
    if (isSleeping) {
      speak("Baa... feed me when I wake up... 💤");
      return;
    }

    // Check stocks
    if (food === "apple" && applesStock <= 0) {
      speak("Baa! No apples left in the fridge! Buy some at the Shop! 🍎");
      return;
    }
    if (food === "manna" && mannaStock <= 0) {
      speak("Baa! No Scripture bread left! Buy some at the Shop! 🍞");
      return;
    }
    if (food === "cookie" && cookieStock <= 0) {
      speak("Baa! No cookies left! Buy some at the Shop! 🍪");
      return;
    }

    setLastAction("feeding");
    let fill = 15;
    let emoji = "🍀";
    let text = "Yummy sweet clover! Baa! 🍀";

    if (food === "apple") {
      setApplesStock((s) => s - 1);
      fill = 25;
      emoji = "🍎";
      text = "Crunch crunch! Sweet apples are my favorite! 🍎";
    } else if (food === "manna") {
      setMannaStock((s) => s - 1);
      fill = 40;
      emoji = "🍞";
      text = "Scripture Bread! 'Give us this day our daily bread...' 📖🍞";
    } else if (food === "cookie") {
      setCookieStock((s) => s - 1);
      fill = 20;
      emoji = "🍪";
      text = "Baa! Chocolate chip cookie! So sweet! 🍪";
    }

    setHunger((prev) => Math.min(prev + fill, 100));
    setHappiness((prev) => Math.min(prev + 8, 100));
    spawnParticles(emoji, 6);
    speak(text);
    progressChallenge("feed", 1);
    setTimeout(() => setLastAction("none"), 1200);
  };

  const handleWash = () => {
    if (activeRoom !== "bathroom") {
      speak("Baa! Put me in the Bathtub first! 🛁");
      return;
    }
    if (isSleeping) {
      speak("Baa... I want to sleep, not bathe... 💤");
      return;
    }
    setLastAction("bathing");
    setCleanliness((prev) => Math.min(prev + 25, 100));
    setHappiness((prev) => Math.min(prev + 5, 100));
    if (mudFactor > 0) {
      setMudFactor((prev) => prev - 1);
    }
    spawnParticles("🫧", 8);
    speak("Splish splash! All the mud is washing away! 🧼🫧");
    progressChallenge("wash", 1);
    setTimeout(() => setLastAction("none"), 1500);
  };

  const handlePlayBall = () => {
    if (activeRoom !== "backyard") {
      speak("Baa! Let's go outside to play fetch! ⚽");
      return;
    }
    if (isSleeping) {
      speak("Baa... too sleepy to play... Zzz... 💤");
      return;
    }
    
    setIsChasingBall(true);
    setLastAction("playing");
    speak("Baa! Throw the ball! I will catch it! ⚽");
    
    setTimeout(() => {
      setIsChasingBall(false);
      setLastAction("none");
      setHappiness((prev) => Math.min(prev + 20, 100));
      setCleanliness((prev) => Math.max(prev - 20, 0));
      setEnergy((prev) => Math.max(prev - 15, 0));
      setMudFactor((prev) => Math.min(prev + 1, 4));
      spawnParticles("⚽", 5);
      speak("Baa! Got it! Look at my jumps! But my wool got dirty... 🐾");
      progressChallenge("play", 1);
    }, 2000);
  };

  const handleToggleSleep = () => {
    if (activeRoom !== "bedroom") {
      speak("Baa! We should go to the Bedroom first! 🛌");
      return;
    }
    if (isSleeping) {
      setIsSleeping(false);
      setLastAction("none");
      speak("Good morning! Baa! Ready for a sweet day! ☀️");
    } else {
      setIsSleeping(true);
      setLastAction("sleeping");
      speak("Goodnight, sweet sister... Zzz... 🌙");
    }
  };

  // ─── Shop Actions ───────────────────────────────────────────
  const buyFood = (type: "apple" | "manna" | "cookie", cost: number) => {
    if (coins < cost) {
      speak("Baa! Not enough coins! Complete challenges to get more! 🪙");
      return;
    }
    setCoins((c) => c - cost);
    if (type === "apple") setApplesStock((s) => s + 1);
    else if (type === "manna") setMannaStock((s) => s + 1);
    else if (type === "cookie") setCookieStock((s) => s + 1);
    spawnParticles("🪙", 3);
    speak(`Purchased a premium ${type}! Added to fridge. 🍎`);
  };

  const buyAccessory = (acc: string, cost: number) => {
    if (coins < cost) {
      speak("Baa! Not enough coins! 🪙");
      return;
    }
    setCoins((c) => c - cost);
    setPurchasedAccessories((prev) => [...prev, acc]);
    spawnParticles("🪙", 4);
    speak(`Baa! You bought the premium ${acc}! Try it on! 🎀`);
  };

  // ─── Map Room Navigation & Unlocks ──────────────────────────
  const travelToRoom = (room: RoomType) => {
    if (unlockedRooms.includes(room)) {
      setActiveRoom(room);
      setIsMapOpen(false);
      if (room === "bedroom" && isSleeping) {
        speak("Zzz... (Lamb is resting comfortably) 🛌🌙");
      } else {
        speak(`Baa! Travelled to the ${room}! ${room === "backyard" ? "Let's play outside! 🌿" : ""}`);
      }
    }
  };

  const unlockRoom = (room: RoomType, cost: number) => {
    if (coins < cost) {
      speak(`Baa! You need 🪙 ${cost} coins to unlock the ${room}! 🔒`);
      return;
    }
    setCoins((c) => c - cost);
    setUnlockedRooms((prev) => [...prev, room]);
    spawnParticles("✨", 8);
    speak(`Baa! The ${room} is now UNLOCKED! Let's explore! 🎉`);
  };

  // ─── Chat Dialogue match ────────────────────────────────────
  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const input = chatInput.trim();
    setChatInput("");

    if (isSleeping) {
      speak("Zzz... (The lamb is fast asleep) 🌙");
      return;
    }

    setHappiness((prev) => Math.min(prev + 4, 100));
    spawnParticles("✨", 2);

    const text = input.toLowerCase();
    let reply = "";

    if (text.includes("sad") || text.includes("cry") || text.includes("lonely") || text.includes("hurt")) {
      reply = "Baa... don't be sad, little sister! The Good Shepherd is holding you close today. 🌸";
    } else if (text.includes("scared") || text.includes("afraid") || text.includes("fear") || text.includes("anxious") || text.includes("worry")) {
      reply = "Baa! 'Do not fear, for I am with you.' (Isaiah 41:10) You are safe! 🌿";
    } else if (text.includes("love")) {
      reply = "Baa! I love you too! And remember, Jesus loves you infinitely more! ❤️";
    } else if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("greet")) {
      reply = "Baa! Hello, sweet sister! I'm so happy you came to visit me! 🐑";
    } else if (text.includes("tired") || text.includes("sleepy") || text.includes("exhausted") || text.includes("weary")) {
      reply = "Baa! Take a deep breath. 'He makes me lie down in green pastures...' (Psalm 23:2) 🌿";
    } else if (text.includes("bible") || text.includes("scripture") || text.includes("god") || text.includes("jesus") || text.includes("faith")) {
      reply = "Baa! 'The Lord is my shepherd, I shall not want.' (Psalm 23:1) He guides us! 📖";
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

  const hasUnclaimedChallenges = challenges.some(c => c.current >= c.target && !c.claimed);

  const getBarColor = (val: number) => {
    if (val < 25) return "bg-red-400";
    if (val < 50) return "bg-amber-400";
    return "bg-emerald-400";
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full select-none pb-8 animate-fade-in text-warm-cocoa font-sans relative">
      
      {/* ─── SCREEN CANVAS VIEWPORT ────────────────────────────── */}
      <div className="relative w-full h-[400px] rounded-[36px] overflow-hidden border border-stone-200 shadow-lg flex flex-col justify-between p-5 bg-stone-100">
        
        {/* ROOM BACKGROUND SVGS */}
        <div className="absolute inset-0 pointer-events-none z-0">
          
          {/* A. LIVING ROOM */}
          {activeRoom === "living" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#FFF5EB" />
              {/* Wallpaper pattern */}
              <line x1="0" y1="220" x2="400" y2="220" stroke="#E6D5C3" strokeWidth="6" />
              <rect y="220" width="400" height="80" fill="#EADBC8" />
              {/* Window */}
              <rect x="150" y="30" width="100" height="100" rx="8" fill="#E0F2FE" stroke="#C2A58F" strokeWidth="5" />
              <line x1="200" y1="30" x2="200" y2="130" stroke="#C2A58F" strokeWidth="3" />
              <line x1="150" y1="80" x2="250" y2="80" stroke="#C2A58F" strokeWidth="3" />
              <circle cx="200" cy="50" r="12" fill="#FDE047" opacity="0.6" />
              {/* Fireplace / Heater */}
              <rect x="40" y="140" width="70" height="80" rx="4" fill="#C2410C" />
              <rect x="50" y="170" width="50" height="50" rx="2" fill="#3F2B1F" />
              <circle cx="75" cy="195" r="10" fill="#F97316" className="animate-pulse" />
              {/* Fluffy Rug */}
              <ellipse cx="200" cy="250" rx="85" ry="30" fill="#FFFFFF" stroke="#F0E2DF" strokeWidth="2" opacity="0.8" />
            </svg>
          )}

          {/* B. KITCHEN */}
          {activeRoom === "kitchen" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#F0FDF4" />
              <line x1="0" y1="210" x2="400" y2="210" stroke="#E2E8F0" strokeWidth="5" />
              <rect y="210" width="400" height="90" fill="#E2E8F0" />
              {/* Counter / Cabinets */}
              <rect x="30" y="160" width="160" height="60" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="2" />
              <line x1="110" y1="160" x2="110" y2="220" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="100" cy="190" r="3" fill="#64748B" />
              <circle cx="120" cy="190" r="3" fill="#64748B" />
              {/* Food Bowl */}
              <path d="M 90 160 Q 110 178 130 160 Z" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2" />
            </svg>
          )}

          {/* C. BEDROOM */}
          {activeRoom === "bedroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill={isSleeping ? "#0F172A" : "#EEF2F6"} />
              <rect y="220" width="400" height="80" fill={isSleeping ? "#1E293B" : "#DFE5EB"} />
              {/* Nightstand & Lamp */}
              <rect x="40" y="160" width="50" height="60" fill={isSleeping ? "#334155" : "#B2C3D2"} />
              <rect x="55" y="140" width="20" height="20" rx="2" fill={isSleeping ? "#1E293B" : "#809bb0"} />
              <path d="M 50 140 L 80 140 L 75 125 L 55 125 Z" fill={isSleeping ? "#FEF08A" : "#F87171"} opacity={isSleeping ? 0.9 : 1} />
              {/* Sleeping light beam */}
              {isSleeping && <polygon points="40,140 10,260 110,260 80,140" fill="#FEF08A" opacity="0.12" />}
              {/* Cozy Bed */}
              <rect x="200" y="170" width="170" height="60" rx="10" fill={isSleeping ? "#475569" : "#FCA5A5"} />
              <rect x="200" y="170" width="40" height="35" rx="5" fill="#FFFFFF" />
            </svg>
          )}

          {/* D. BATHROOM */}
          {activeRoom === "bathroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#ECFEFF" />
              {/* Bathroom Tiles */}
              <rect y="220" width="400" height="80" fill="#CFFAFE" />
              <line x1="0" y1="220" x2="400" y2="220" stroke="#0891B2" strokeWidth="4" />
              {/* Bathtub */}
              <rect x="110" y="170" width="180" height="65" rx="20" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="3" />
              <rect x="95" y="165" width="210" height="10" rx="5" fill="#E2E8F0" />
              <circle cx="130" cy="245" r="5" fill="#94A3B8" />
              <circle cx="270" cy="245" r="5" fill="#94A3B8" />
              {/* Foam / Soap bubbles */}
              <circle cx="140" cy="170" r="14" fill="#ECFEFF" opacity="0.8" />
              <circle cx="160" cy="165" r="16" fill="#ECFEFF" opacity="0.8" />
              <circle cx="200" cy="160" r="20" fill="#ECFEFF" opacity="0.8" />
              <circle cx="240" cy="165" r="16" fill="#ECFEFF" opacity="0.8" />
              <circle cx="260" cy="170" r="14" fill="#ECFEFF" opacity="0.8" />
            </svg>
          )}

          {/* E. BACKYARD */}
          {activeRoom === "backyard" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#F0F9FF" />
              {/* Sun */}
              <circle cx="330" cy="60" r="25" fill="#FDE047" />
              {/* Clouds */}
              <path d="M 60 70 Q 75 55 90 70 Q 105 55 120 70 L 60 70 Z" fill="#FFFFFF" opacity="0.9" />
              {/* Hills */}
              <path d="M -20 230 Q 150 170 300 240 Q 360 210 430 250 L 430 300 L -20 300 Z" fill="#34D399" />
              <path d="M -20 250 Q 80 200 240 260 Q 340 220 430 265 L 430 300 L -20 300 Z" fill="#10B981" />
            </svg>
          )}
        </div>

        {/* ─── VIEWPORT OVERLAYS & HUD ──────────────────────────── */}
        {/* TOP PANEL: MAP, SHOP, TASKS */}
        <div className="w-full flex items-center justify-between z-10 relative">
          
          {/* Back button */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/90 bg-[#4B3A3A]/40 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              🪙 {coins}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tasks / Challenges button */}
            <button
              onClick={() => setIsChallengesOpen(true)}
              className="relative p-2 rounded-full bg-white/90 border border-stone-200/50 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {hasUnclaimedChallenges && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping border border-white" />
              )}
            </button>

            {/* Shop Button */}
            <button
              onClick={() => setIsShopOpen(true)}
              className="p-2 rounded-full bg-white/90 border border-stone-200/50 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>

            {/* Map Button */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-3 py-1 rounded-full bg-[#D4A5A5] hover:bg-[#c49292] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-90 transition-all cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* SPEECH DIALOGUE BUBBLE */}
        <div className="w-full flex justify-center z-10 relative">
          <div className={`max-w-[280px] p-2.5 rounded-2xl border text-center text-[10px] leading-relaxed shadow-sm font-medium relative animate-fade-in ${
            isSleeping
              ? "bg-slate-950/80 border-slate-900 text-yellow-100/90"
              : "bg-white/95 border-stone-100 text-warm-cocoa"
          }`}>
            {dialogue}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[8px] border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent ${
              isSleeping ? "border-t-slate-950/80" : "border-t-white/95"
            }`} />
          </div>
        </div>

        {/* INTERACTIVE IN-ROOM KITCHEN BOWL & FRIDGE DOORS */}
        {activeRoom === "kitchen" && (
          <div className="absolute right-8 top-1/4 z-10 flex flex-col items-end">
            <button
              onClick={() => setIsFridgeOpen((prev) => !prev)}
              className={`p-2 py-3 rounded-2xl border-2 font-bold text-[9px] uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                isFridgeOpen
                  ? "bg-stone-50 border-rose-300 text-rose-500"
                  : "bg-[#4B3A3A] border-stone-800 text-white"
              }`}
            >
              <span>🚪</span>
              {isFridgeOpen ? "Close Fridge" : "Open Fridge"}
            </button>

            {/* Open Fridge Overlay Shelf */}
            <AnimatePresence>
              {isFridgeOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="mt-2 bg-white/95 backdrop-blur-sm border border-stone-200 p-3 rounded-3xl shadow-xl flex flex-col gap-2 w-48 text-left z-20"
                >
                  <span className="text-[8.5px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Fridge Shelves</span>
                  
                  {/* Clover */}
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-[10px] font-bold">🍀 Clover</span>
                    <button
                      onClick={() => handleFeed("clover")}
                      className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      Feed (∞)
                    </button>
                  </div>

                  {/* Apples */}
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-[10px] font-bold">🍎 Apples ({applesStock})</span>
                    <button
                      onClick={() => handleFeed("apple")}
                      disabled={applesStock <= 0}
                      className="px-2 py-1 rounded-lg bg-red-50 text-red-800 text-[9px] font-bold disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                    >
                      Feed
                    </button>
                  </div>

                  {/* Cookies */}
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-[10px] font-bold">🍪 Cookies ({cookieStock})</span>
                    <button
                      onClick={() => handleFeed("cookie")}
                      disabled={cookieStock <= 0}
                      className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-[9px] font-bold disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                    >
                      Feed
                    </button>
                  </div>

                  {/* Manna */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold">🍞 Manna ({mannaStock})</span>
                    <button
                      onClick={() => handleFeed("manna")}
                      disabled={mannaStock <= 0}
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-[9px] font-bold disabled:opacity-40 active:scale-95 transition-all cursor-pointer"
                    >
                      Feed
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TOY BALL FOR BACKYARD FETCH */}
        {activeRoom === "backyard" && (
          <div className="absolute left-10 bottom-16 z-10 flex flex-col items-center">
            <motion.div
              animate={isChasingBall ? { x: [0, 180, 0], y: [0, -60, 0], rotate: [0, 360, 0] } : {}}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              onClick={handlePlayBall}
              className="w-9 h-9 rounded-full bg-red-400 border border-red-500 flex items-center justify-center text-lg shadow-md cursor-pointer active:scale-90 select-none"
            >
              ⚽
            </motion.div>
            <span className="text-[8px] uppercase tracking-wider font-bold text-stone-700/60 mt-1 select-none pointer-events-none">
              Play Fetch
            </span>
          </div>
        )}

        {/* VIRTUAL LAMB CANVAS DOCK */}
        <div className="w-full flex justify-center items-center h-48 z-10 relative">
          
          {/* Particles */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: 10, scale: 0.8 }}
                animate={{ opacity: 0, y: -90, scale: 1.5, rotate: p.x }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute text-lg pointer-events-none"
                style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
              >
                {p.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Sleeping Zzz bubbles */}
          {isSleeping && activeRoom === "bedroom" && (
            <div className="absolute top-2 right-12 text-sm font-bold text-yellow-100/80 pointer-events-none flex flex-col gap-1 select-none">
              <span className="animate-bounce" style={{ animationDelay: "0s", animationDuration: "3.5s" }}>z</span>
              <span className="animate-bounce ml-2 text-base" style={{ animationDelay: "1.2s", animationDuration: "3.5s" }}>Z</span>
              <span className="animate-bounce ml-4 text-xs" style={{ animationDelay: "2.4s", animationDuration: "3.5s" }}>z</span>
            </div>
          )}

          {/* Lamb Drawing */}
          <div
            className={`w-36 h-36 relative transition-all duration-300 ${
              lastAction === "petting" ? "scale-105" : ""
            } ${lastAction === "feeding" ? "origin-bottom animate-bounce" : ""} ${
              isSleeping && activeRoom === "bedroom" ? "translate-x-12 translate-y-6 rotate-[75deg] scale-95 opacity-80" : ""
            } ${activeRoom === "bathroom" ? "translate-y-4" : ""}`}
            style={{ animationDuration: "0.6s" }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              {/* legs */}
              <rect x="78" y="162" width="10" height="16" rx="4" fill="#FFE2E2" stroke="#E6D3D3" strokeWidth={1.5} />
              <rect x="112" y="162" width="10" height="16" rx="4" fill="#FFE2E2" stroke="#E6D3D3" strokeWidth={1.5} />

              {/* body wool */}
              <circle cx="82" cy="144" r="15" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="100" cy="148" r="17" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="118" cy="144" r="15" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="90" cy="136" r="14" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="110" cy="136" r="14" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="100" cy="142" r="18" fill="#FFFFFF" />
              <circle cx="90" cy="144" r="12" fill="#FFFFFF" />
              <circle cx="110" cy="144" r="12" fill="#FFFFFF" />

              {/* ears */}
              <g>
                <path d="M 66 105 Q 40 102 46 118 Q 58 120 66 112 Z" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={1.5} />
                <path d="M 62 107 Q 44 106 48 115 Q 56 116 62 111 Z" fill="#FFB7B7" opacity="0.5" />
              </g>
              <g>
                <path d="M 134 105 Q 160 102 154 118 Q 142 120 134 112 Z" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={1.5} />
                <path d="M 138 107 Q 156 106 152 115 Q 144 116 138 111 Z" fill="#FFB7B7" opacity="0.5" />
              </g>

              {/* face */}
              <ellipse cx="100" cy="115" rx="36" ry="30" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={2} />
              <circle cx="76" cy="122" r="7" fill="#FFB7B7" opacity="0.6" />
              <circle cx="124" cy="122" r="7" fill="#FFB7B7" opacity="0.6" />

              {/* eyes */}
              {isSleeping || (activeRoom === "bedroom" && isSleeping) ? (
                <>
                  <path d="M 76 114 Q 82 108 88 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                  <path d="M 112 114 Q 118 108 124 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                </>
              ) : isBlinking ? (
                <>
                  <path d="M 76 112 Q 82 116 88 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                  <path d="M 112 112 Q 118 116 124 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="82" cy="112" r="6" fill="#4B3A3A" />
                  <circle cx="80" cy="110" r="2.2" fill="white" />
                  <circle cx="83.5" cy="114" r="0.8" fill="white" />
                  <circle cx="118" cy="112" r="6" fill="#4B3A3A" />
                  <circle cx="116" cy="110" r="2.2" fill="white" />
                  <circle cx="119.5" cy="114" r="0.8" fill="white" />
                </>
              )}

              {/* mouth */}
              {isTalking && !isSleeping ? (
                <ellipse cx="100" cy="124" rx="3.5" ry="4.5" fill="#C06C84" />
              ) : (
                <path d="M 96 122 Q 100 125 104 122" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
              )}

              {/* head wool */}
              <circle cx="86" cy="94" r="10" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="100" cy="88" r="12" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="114" cy="94" r="10" fill="#FFFFFF" stroke="#E6D3D3" strokeWidth={1.5} />
              <circle cx="94" cy="94" r="10" fill="#FFFFFF" />
              <circle cx="106" cy="94" r="10" fill="#FFFFFF" />
              <circle cx="100" cy="96" r="11" fill="#FFFFFF" />

              {/* MUD SPLATTERS (Visually maps to cleanliness) */}
              {mudFactor >= 1 && (
                <ellipse cx="88" cy="144" rx="5.5" ry="3.5" fill="#783F04" opacity="0.85" />
              )}
              {mudFactor >= 2 && (
                <ellipse cx="114" cy="138" rx="6" ry="4" fill="#783F04" opacity="0.85" transform="rotate(20 114 138)" />
              )}
              {mudFactor >= 3 && (
                <circle cx="100" cy="154" r="4.5" fill="#783F04" opacity="0.85" />
              )}
              {mudFactor >= 4 && (
                <ellipse cx="88" cy="116" rx="4" ry="2.5" fill="#783F04" opacity="0.8" transform="rotate(-15 88 116)" />
              )}

              {/* ACCESSORIES */}
              {accessory === "crown" && (
                <g>
                  <circle cx="86" cy="84" r="4.5" fill="#F472B6" />
                  <circle cx="91" cy="88.5" r="4.5" fill="#F472B6" />
                  <circle cx="81.5" cy="88.5" r="4.5" fill="#F472B6" />
                  <circle cx="86" cy="87.5" r="2" fill="#FCD34D" />
                  <circle cx="100" cy="81" r="5" fill="#60A5FA" />
                  <circle cx="105" cy="85.5" r="5" fill="#60A5FA" />
                  <circle cx="95" cy="85.5" r="5" fill="#60A5FA" />
                  <circle cx="100" cy="85" r="2.2" fill="#FCD34D" />
                  <circle cx="114" cy="84" r="4.5" fill="#F472B6" />
                  <circle cx="118.5" cy="88.5" r="4.5" fill="#F472B6" />
                  <circle cx="109.5" cy="88.5" r="4.5" fill="#F472B6" />
                  <circle cx="114" cy="87.5" r="2" fill="#FCD34D" />
                </g>
              )}

              {accessory === "bow" && (
                <g transform="translate(68, 96)">
                  <path d="M -6 -6 C -12 -12, -12 0, 0 0 C -12 0, -12 12, -6 6" fill="#EC4899" stroke="#BE185D" strokeWidth={1} />
                  <path d="M 6 -6 C 12 -12, 12 0, 0 0 C 12 0, 12 12, 6 6" fill="#EC4899" stroke="#BE185D" strokeWidth={1} />
                  <circle cx="0" cy="0" r="3.5" fill="#FCD34D" />
                </g>
              )}

              {accessory === "bell" && (
                <g>
                  <path d="M 80 131 Q 100 136 120 131 L 118 135 Q 100 140 82 135 Z" fill="#EF4444" />
                  <circle cx="100" cy="139" r="6.5" fill="#FBBF24" stroke="#D97706" strokeWidth={1.2} />
                  <circle cx="100" cy="142.5" r="1.8" fill="#D97706" />
                </g>
              )}

              {accessory === "scarf" && (
                <g>
                  <path d="M 76 132 Q 100 140 124 132 Q 120 148 76 142 Z" fill="#F43F5E" stroke="#E11D48" strokeWidth={1} />
                  <path d="M 112 136 Q 118 158 126 166 Q 112 168 102 142 Z" fill="#E11D48" stroke="#BE123C" strokeWidth={1} />
                </g>
              )}

              {accessory === "royal" && (
                <g transform="translate(100, 78)">
                  <path d="M -15 0 L -18 -12 L -9 -6 L 0 -16 L 9 -6 L 18 -12 L 15 0 Z" fill="#FBBF24" stroke="#D97706" strokeWidth={1} />
                  <circle cx="-18" cy="-12" r="1.5" fill="#EF4444" />
                  <circle cx="0" cy="-16" r="2.2" fill="#3B82F6" />
                  <circle cx="18" cy="-12" r="1.5" fill="#EF4444" />
                  <circle cx="0" cy="-6" r="1.5" fill="#EC4899" />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* BOTTOM HUD PANEL: ACTIONS & DRAWER TRIGGERS */}
        <div className="w-full flex items-center justify-between z-10 relative">
          {/* Bottom Left: Activities Wheel Drawer trigger */}
          <button
            onClick={() => {
              setIsActivitiesOpen((prev) => !prev);
              setIsStatusOpen(false);
            }}
            className={`px-4 py-2 rounded-full border-2 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
              isActivitiesOpen
                ? "bg-stone-50 border-rose-300 text-rose-500"
                : "bg-white/95 border-stone-200 text-warm-cocoa"
            }`}
          >
            🚪 Rooms Menu
          </button>

          {/* Bottom Right: Pet Status & Wardrobe Drawer trigger */}
          <button
            onClick={() => {
              setIsStatusOpen((prev) => !prev);
              setIsActivitiesOpen(false);
            }}
            className={`px-4 py-2 rounded-full border-2 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
              isStatusOpen
                ? "bg-stone-50 border-rose-300 text-rose-500"
                : "bg-white/95 border-stone-200 text-warm-cocoa"
            }`}
          >
            📋 Stats & Dress
          </button>
        </div>

        {/* ─── BOTTOM-LEFT ACTIVITIES/ROOM NAVIGATION DRAWER ─── */}
        <AnimatePresence>
          {isActivitiesOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute left-5 bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-4 rounded-[28px] shadow-2xl z-20 flex flex-col gap-2 w-52"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Select Activity Room</span>
                <button onClick={() => setIsActivitiesOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Living Room */}
              <button
                onClick={() => {
                  travelToRoom("living");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                  activeRoom === "living" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <span>🏠</span> Living Room
              </button>

              {/* Kitchen */}
              <button
                onClick={() => {
                  travelToRoom("kitchen");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                  activeRoom === "kitchen" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <span>🍳</span> Kitchen (Feed)
              </button>

              {/* Bedroom */}
              <button
                onClick={() => {
                  travelToRoom("bedroom");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                  activeRoom === "bedroom" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🛌</span> Bedroom (Sleep)
                </div>
                {activeRoom === "bedroom" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSleep();
                    }}
                    className="p-1 rounded bg-[#4B3A3A] text-white text-[8px] font-bold"
                  >
                    {isSleeping ? "Wake" : "Sleep"}
                  </button>
                )}
              </button>

              {/* Bathroom (Wash) */}
              <div className="flex items-center gap-1">
                <button
                  disabled={!unlockedRooms.includes("bathroom")}
                  onClick={() => {
                    travelToRoom("bathroom");
                    setIsActivitiesOpen(false);
                  }}
                  className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center justify-between disabled:opacity-50 cursor-pointer ${
                    activeRoom === "bathroom" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>🛁</span> Bathroom (Wash)
                  </div>
                  {!unlockedRooms.includes("bathroom") && <Lock className="w-3 h-3 text-stone-400" />}
                </button>
                {activeRoom === "bathroom" && (
                  <button
                    onClick={handleWash}
                    className="p-1.5 rounded-lg bg-cyan-100 border border-cyan-300 text-cyan-800 text-[8px] font-bold cursor-pointer active:scale-95"
                  >
                    Wash
                  </button>
                )}
              </div>

              {/* Backyard (Play) */}
              <button
                disabled={!unlockedRooms.includes("backyard")}
                onClick={() => {
                  travelToRoom("backyard");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center justify-between disabled:opacity-50 cursor-pointer ${
                  activeRoom === "backyard" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>⚽</span> Backyard (Play)
                </div>
                {!unlockedRooms.includes("backyard") && <Lock className="w-3 h-3 text-stone-400" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── BOTTOM-RIGHT STATS & WARDROBE DRAWER ─── */}
        <AnimatePresence>
          {isStatusOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute right-5 bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-4 rounded-[28px] shadow-2xl z-25 flex flex-col gap-3.5 w-60"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Selah Details</span>
                </div>
                <button onClick={() => setIsStatusOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* STATS PROGRESS BARS */}
              <div className="flex flex-col gap-2">
                {/* Hunger */}
                <div className="space-y-0.5 text-left">
                  <div className="flex justify-between text-[8.5px] font-bold uppercase tracking-wider">
                    <span>🍀 Hunger</span>
                    <span>{Math.round(hunger)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full ${getBarColor(hunger)}`} style={{ width: `${hunger}%` }} />
                  </div>
                </div>
                {/* Happiness */}
                <div className="space-y-0.5 text-left">
                  <div className="flex justify-between text-[8.5px] font-bold uppercase tracking-wider">
                    <span>❤️ Happiness</span>
                    <span>{Math.round(happiness)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full ${getBarColor(happiness)}`} style={{ width: `${happiness}%` }} />
                  </div>
                </div>
                {/* Cleanliness */}
                <div className="space-y-0.5 text-left">
                  <div className="flex justify-between text-[8.5px] font-bold uppercase tracking-wider">
                    <span>🧼 Cleanliness</span>
                    <span>{Math.round(cleanliness)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full ${getBarColor(cleanliness)}`} style={{ width: `${cleanliness}%` }} />
                  </div>
                </div>
                {/* Energy */}
                <div className="space-y-0.5 text-left">
                  <div className="flex justify-between text-[8.5px] font-bold uppercase tracking-wider">
                    <span>⚡ Energy</span>
                    <span>{Math.round(energy)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div className={`h-full ${getBarColor(energy)}`} style={{ width: `${energy}%` }} />
                  </div>
                </div>
              </div>

              {/* WARDROBE (ACCESSORY TOGGLES) */}
              <div className="border-t pt-2 text-left">
                <span className="text-[8.5px] uppercase font-bold text-warm-cocoa/40 tracking-wider mb-2.5 block">Accessory Wardrobe</span>
                <div className="grid grid-cols-3 gap-1">
                  {(["none", "bow", "bell", "crown", "scarf", "royal"] as const).map((acc) => {
                    const isOwned = purchasedAccessories.includes(acc);
                    return (
                      <button
                        key={acc}
                        disabled={!isOwned}
                        onClick={() => {
                          if (isSleeping) {
                            speak("Baa... let me change when I wake up... Zzz...");
                            return;
                          }
                          setAccessory(acc);
                          spawnParticles("✨", 2);
                          speak(acc === "none" ? "Baa! Clean and natural!" : `Baa! Look at my ${acc}! 🥰`);
                        }}
                        className={`py-1.5 text-[8.5px] font-bold border rounded-lg capitalize disabled:opacity-40 transition-all cursor-pointer ${
                          accessory === acc
                            ? "bg-[#D4A5A5] border-[#D4A5A5] text-white"
                            : "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700"
                        }`}
                      >
                        {acc === "none" ? "None" : acc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ─── CHAT DIALOG INPUT PANEL (Bottom footer) ───────────── */}
      <div className="bg-white/60 border border-stone-100 p-4 rounded-3xl shadow-sm flex flex-col gap-2.5 backdrop-blur-sm">
        <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-sky-400" /> Converse with Selah the Lamb
        </span>
        <form onSubmit={handleChat} className="flex items-center gap-2 w-full">
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

      {/* ─── A. TRAVEL MAP NAVIGATION MODAL ────────────────────── */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-stone-150 p-6 rounded-[32px] shadow-2xl text-center max-w-sm w-full relative"
            >
              <button
                onClick={() => setIsMapOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-base font-bold text-warm-cocoa mb-1 flex items-center justify-center gap-1.5">
                🗺️ Cozy House Map
              </h3>
              <p className="text-[10px] text-warm-grey/50 italic mb-5">
                Quick-travel to rooms, or unlock new wings of the house.
              </p>

              <div className="flex flex-col gap-2.5 text-left">
                {/* Rooms Mapping */}
                {([
                  { id: "living", name: "🏠 Living Room (Main)", cost: 0 },
                  { id: "kitchen", name: "🍳 Kitchen (Food & Fridge)", cost: 0 },
                  { id: "bedroom", name: "🛌 Bedroom (Rest & Bed)", cost: 0 },
                  { id: "bathroom", name: "🛁 Bathroom (Bubble Tub)", cost: 60 },
                  { id: "backyard", name: "⚽ Backyard (Fetch Play)", cost: 100 }
                ] as const).map((r) => {
                  const isUnlocked = unlockedRooms.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-2xl border border-stone-200/50 bg-stone-50/50 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-warm-cocoa">{r.name}</span>

                      {isUnlocked ? (
                        <button
                          onClick={() => travelToRoom(r.id)}
                          className={`px-3 py-1 rounded-xl text-[9px] font-bold tracking-wide uppercase transition-all active:scale-95 cursor-pointer ${
                            activeRoom === r.id
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-[#4B3A3A] text-white hover:bg-stone-850"
                          }`}
                        >
                          {activeRoom === r.id ? "Here" : "Travel"}
                        </button>
                      ) : (
                        <button
                          onClick={() => unlockRoom(r.id, r.cost)}
                          className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                        >
                          <Lock className="w-2.5 h-2.5" /> Unlock 🪙 {r.cost}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── B. SHOP MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {isShopOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-stone-150 p-6 rounded-[32px] shadow-2xl text-center max-w-sm w-full relative"
            >
              <button
                onClick={() => setIsShopOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-base font-bold text-warm-cocoa mb-1 flex items-center justify-center gap-1">
                🛍️ Pasture Shop
              </h3>
              <p className="text-[10px] text-warm-grey/50 italic mb-4">
                Spend your hard-earned coins on accessories and treats.
              </p>

              {/* Coins indicator */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200/50 p-2 text-center text-xs font-bold text-amber-900 mb-4">
                Your Coins: 🪙 {coins}
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <button
                  onClick={() => setActiveShopTab("food")}
                  className={`py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider cursor-pointer active:scale-95 transition-all ${
                    activeShopTab === "food"
                      ? "bg-[#D4A5A5] text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-700"
                  }`}
                >
                  🍎 Ingredients
                </button>
                <button
                  onClick={() => setActiveShopTab("wardrobe")}
                  className={`py-1.5 rounded-xl text-[10px] uppercase font-bold tracking-wider cursor-pointer active:scale-95 transition-all ${
                    activeShopTab === "wardrobe"
                      ? "bg-[#D4A5A5] text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-700"
                  }`}
                >
                  👑 Wardrobe
                </button>
              </div>

              {/* Food Stock Shop */}
              {activeShopTab === "food" && (
                <div className="flex flex-col gap-2.5 text-left max-h-[220px] overflow-y-auto pr-1">
                  {/* Clover */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍀 Clover Salad</span>
                      <span className="text-[9px] text-stone-400">Sweet garden clover</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Free</span>
                  </div>

                  {/* Apples */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍎 Red Apple (Stock: {applesStock})</span>
                      <span className="text-[9px] text-stone-400">Crispy honeycrisp apple</span>
                    </div>
                    <button
                      onClick={() => buyFood("apple", 10)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 cursor-pointer"
                    >
                      🪙 10
                    </button>
                  </div>

                  {/* Cookies */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍪 Sweet Cookie (Stock: {cookieStock})</span>
                      <span className="text-[9px] text-stone-400">Choc chip treat</span>
                    </div>
                    <button
                      onClick={() => buyFood("cookie", 15)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 cursor-pointer"
                    >
                      🪙 15
                    </button>
                  </div>

                  {/* Manna */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍞 Manna Bread (Stock: {mannaStock})</span>
                      <span className="text-[9px] text-stone-400">Fresh scripture manna</span>
                    </div>
                    <button
                      onClick={() => buyFood("manna", 20)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 cursor-pointer"
                    >
                      🪙 20
                    </button>
                  </div>
                </div>
              )}

              {/* Wardrobe Accessory Shop */}
              {activeShopTab === "wardrobe" && (
                <div className="flex flex-col gap-2.5 text-left max-h-[220px] overflow-y-auto pr-1">
                  {([
                    { id: "bow", name: "🎀 Pink Bow", cost: 0, desc: "A lovely pink ribbon bow" },
                    { id: "bell", name: "🔔 Golden Bell", cost: 25, desc: "Golden bell collar necklace" },
                    { id: "scarf", name: "🧣 Cozy Scarf", cost: 50, desc: "A warm knit pastel scarf" },
                    { id: "crown", name: "🌸 Flower Crown", cost: 75, desc: "Woven pink/yellow flowers" },
                    { id: "royal", name: "👑 Royal Crown", cost: 120, desc: "Golden princess tiara" }
                  ] as const).map((acc) => {
                    const isOwned = purchasedAccessories.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">{acc.name}</span>
                          <span className="text-[9px] text-stone-400">{acc.desc}</span>
                        </div>

                        {isOwned ? (
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded">Owned</span>
                        ) : (
                          <button
                            onClick={() => buyAccessory(acc.id, acc.cost)}
                            className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 cursor-pointer"
                          >
                            🪙 {acc.cost}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── C. CHALLENGES / TASKS MODAL ───────────────────────── */}
      <AnimatePresence>
        {isChallengesOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-stone-150 p-6 rounded-[32px] shadow-2xl text-center max-w-sm w-full relative"
            >
              <button
                onClick={() => setIsChallengesOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-base font-bold text-warm-cocoa mb-1 flex items-center justify-center gap-1.5">
                📋 Shepherd Challenges
              </h3>
              <p className="text-[10px] text-warm-grey/50 italic mb-5">
                Complete cozy chores around the house to earn coins.
              </p>

              <div className="flex flex-col gap-3 text-left">
                {challenges.map((c) => {
                  const isDone = c.current >= c.target;
                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-2xl border flex flex-col gap-2 transition-all ${
                        c.claimed
                          ? "bg-stone-50 border-stone-100 opacity-60"
                          : isDone
                          ? "bg-emerald-50/50 border-emerald-200"
                          : "bg-stone-50/40 border-stone-150"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-warm-cocoa">{c.text}</span>
                        <span className="text-[10px] font-bold text-[#D4A5A5]">🪙 {c.reward}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isDone ? "bg-emerald-400" : "bg-sky-400"
                            }`}
                            style={{ width: `${(c.current / c.target) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-stone-500">
                          {c.current}/{c.target}
                        </span>
                      </div>

                      {/* Claim Button */}
                      {isDone && !c.claimed && (
                        <button
                          onClick={() => claimChallenge(c.id, c.reward)}
                          className="w-full mt-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9.5px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
                        >
                          Claim Reward! 🎉
                        </button>
                      )}

                      {c.claimed && (
                        <span className="text-[9px] font-bold text-stone-400 italic text-center py-0.5 block">
                          Claimed! Regenerating soon... ✨
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
