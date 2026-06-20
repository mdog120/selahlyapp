"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Sparkles, Moon, Sun, Utensils, MessageCircle, Send, ShieldAlert, Award, Map, ShoppingBag, CheckSquare, X, Lock, BookOpen } from "lucide-react";
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
type RecipeType = "clover" | "apple_mash" | "manna_cookie" | "berry_pancake" | "honey_glaze";

export function MyTalkingLamb() {
  // ─── Currency & Unlocking States ────────────────────────────
  const [coins, setCoins] = useState(50);
  const [unlockedRooms, setUnlockedRooms] = useState<RoomType[]>(["living", "kitchen", "bedroom"]);
  const [purchasedAccessories, setPurchasedAccessories] = useState<string[]>(["none", "bow"]);

  // ─── Room Navigation & Modals ──────────────────────────────
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
  const [berryStock, setBerryStock] = useState(2);
  const [honeyStock, setHoneyStock] = useState(1);
  const [milkStock, setMilkStock] = useState(1);
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);

  // ─── Mud & Ball Interactions ────────────────────────────────
  const [mudFactor, setMudFactor] = useState(0); // 0 (clean) to 4 (very dirty)
  const [isChasingBall, setIsChasingBall] = useState(false);

  // ─── Cooking Table States ───────────────────────────────────
  const [isCooking, setIsCooking] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<RecipeType | null>(null);
  const [cookingStep, setCookingStep] = useState<"choose" | "chop" | "stove" | "stir" | "garnish" | "done">("choose");
  const [chopCount, setChopCount] = useState(0);
  const [stoveCount, setStoveCount] = useState(0);
  const [stirCount, setStirCount] = useState(0);
  const [garnishCount, setGarnishCount] = useState(0);

  // ─── Bedtime Story States ───────────────────────────────────
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [storyPage, setStoryPage] = useState(0);

  // ─── Chat & Dialogue States ─────────────────────────────────
  const [dialogue, setDialogue] = useState("Baa! Welcome to my cozy home, sister! 🐑");
  const [chatInput, setChatInput] = useState("");
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // ─── Challenges pool and list ────────────────────────────────
  const CHALLENGE_POOL = [
    { id: "feed", text: "Feed the lamb 3 times", target: 3, reward: 20 },
    { id: "play", text: "Play fetch in backyard 2 times", target: 2, reward: 15 },
    { id: "wash", text: "Give a warm bubble bath", target: 1, reward: 15 },
    { id: "pet", text: "Pet Selah 5 times", target: 5, reward: 10 },
    { id: "story", text: "Read a bedtime story", target: 1, reward: 15 },
    { id: "buy_food", text: "Buy food from the shop", target: 1, reward: 10 },
    { id: "buy_accessory", text: "Buy a new accessory", target: 1, reward: 25 },
    { id: "cook_clover", text: "Make Clover Salad", target: 1, reward: 15 },
    { id: "cook_apple", text: "Make Apple Clover Mash", target: 1, reward: 20 },
    { id: "cook_manna", text: "Make Manna Cookie Treat", target: 1, reward: 25 },
    { id: "cook_berry", text: "Make Sweet Berry Pancake", target: 1, reward: 30 },
    { id: "cook_honey", text: "Make Honey Glazed Oats", target: 1, reward: 30 }
  ];

  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: "feed", text: "Feed the lamb 3 times", target: 3, current: 0, reward: 20, claimed: false },
    { id: "play", text: "Play fetch in backyard 2 times", target: 2, current: 0, reward: 15, claimed: false },
    { id: "wash", text: "Give a warm bubble bath", target: 1, current: 0, reward: 15, claimed: false }
  ]);

  // ─── Particles ──────────────────────────────────────────────
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sleepyMusicRef = useRef<HTMLAudioElement | null>(null);
  const snoreIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Local Storage persistence ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selahly_talking_lamb_house_v2");
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
        setBerryStock(p.berryStock ?? 2);
        setHoneyStock(p.honeyStock ?? 1);
        setMilkStock(p.milkStock ?? 1);
        setMudFactor(p.mudFactor ?? 0);
        setActiveRoom(p.activeRoom ?? "living");
        if (p.challenges) setChallenges(p.challenges);
      } catch (e) {
        console.error("Failed to load lamb house stats", e);
      }
    }
  }, []);

  useEffect(() => {
    // Clear initial dialogue after 6 seconds
    const t = setTimeout(() => {
      setDialogue("");
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  // Save Stats on Change
  useEffect(() => {
    localStorage.setItem(
      "selahly_talking_lamb_house_v2",
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
        berryStock,
        honeyStock,
        milkStock,
        mudFactor,
        activeRoom,
        challenges
      })
    );
  }, [coins, unlockedRooms, purchasedAccessories, hunger, happiness, cleanliness, energy, accessory, isSleeping, applesStock, mannaStock, cookieStock, berryStock, honeyStock, milkStock, mudFactor, activeRoom, challenges]);

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
    }, 4500 + Math.random() * 2505);

    return () => clearInterval(blinkInterval);
  }, [isSleeping]);

  // Sleep sound effects & quiet lullaby music box player
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    
    const playSnoreNode = () => {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return;
        if (!audioCtx) {
          audioCtx = new AudioCtxClass();
        }
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
        
        const now = audioCtx.currentTime;
        
        // Inhale (low pitched growl/snore vibration)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(65, now);
        
        const rattle = audioCtx.createOscillator();
        const rattleGain = audioCtx.createGain();
        rattle.frequency.value = 16;
        rattleGain.gain.value = 6;
        rattle.connect(rattleGain);
        rattleGain.connect(osc1.frequency);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.12, now + 1.2);
        gain1.gain.linearRampToValueAtTime(0, now + 2.0);
        
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        
        rattle.start(now);
        osc1.start(now);
        rattle.stop(now + 2.0);
        osc1.stop(now + 2.0);
        
        // Exhale (soft puff/sigh)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(55, now + 2.2);
        
        gain2.gain.setValueAtTime(0, now + 2.2);
        gain2.gain.linearRampToValueAtTime(0.06, now + 3.0);
        gain2.gain.linearRampToValueAtTime(0, now + 4.0);
        
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc2.start(now + 2.2);
        osc2.stop(now + 4.0);
      } catch (e) {
        console.warn("Snoring synthesis failed", e);
      }
    };

    if (isSleeping) {
      // 1. Play sleepy musicbox lullaby
      if (!sleepyMusicRef.current) {
        const audio = new Audio("/audio/musicbox.mp3");
        audio.loop = true;
        audio.volume = 0.45;
        sleepyMusicRef.current = audio;
      }
      
      sleepyMusicRef.current.play().catch((err) => {
        console.warn("Autoplay sleepy music blocked", err);
      });
      
      // 2. Snore periodically
      playSnoreNode();
      snoreIntervalRef.current = setInterval(() => {
        playSnoreNode();
      }, 6000);
    } else {
      // Waking up
      if (sleepyMusicRef.current) {
        sleepyMusicRef.current.pause();
        sleepyMusicRef.current.currentTime = 0;
      }
      if (snoreIntervalRef.current) {
        clearInterval(snoreIntervalRef.current);
        snoreIntervalRef.current = null;
      }
    }

    return () => {
      if (snoreIntervalRef.current) {
        clearInterval(snoreIntervalRef.current);
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [isSleeping]);

  // ─── Talk & Particle Helpers ─────────────────────────────────
  const speak = (text: string) => {
    if (text) {
      playBaaSound();
    }
    setDialogue(text);
    setIsTalking(true);

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    // Auto-clear speech bubble after 6 seconds
    speechTimeoutRef.current = setTimeout(() => {
      setDialogue("");
    }, 6000);

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

  // ─── Web Audio API Sound Synthesizers ─────────────────────────
  const playBaaSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      // Main oscillators for rich harmonics
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();
      
      // Detuned sawtooth and triangle oscillators give a throaty sound
      osc1.type = "sawtooth";
      osc2.type = "triangle";
      
      const now = ctx.currentTime;
      
      // Pitch envelope: slightly sliding down from 320Hz to 240Hz
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(240, now + 0.65);
      
      osc2.frequency.setValueAtTime(322, now);
      osc2.frequency.exponentialRampToValueAtTime(242, now + 0.65);
      
      // Vibrato (pitch flutter) to sound like a shaky animal bleat
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 11; // 11 Hz flutter
      vibratoGain.gain.value = 16;  // pitch change range
      
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibratoGain.connect(osc2.frequency);
      
      // Formant filter (bandpass filter around 1000Hz creates a nasal "baa" voice quality)
      filterNode.type = "bandpass";
      filterNode.frequency.setValueAtTime(1050, now);
      filterNode.frequency.linearRampToValueAtTime(900, now + 0.65); // vocal cavity shifts as mouth closes
      filterNode.Q.value = 2.2;
      
      // Gain envelope with tremolo flutter
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05); // quick attack
      
      // Shaky tremolo ramps to simulate lamb throat vibration
      gainNode.gain.linearRampToValueAtTime(0.10, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.16, now + 0.28);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.42);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.55);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.65); // fade out
      
      // Connections
      osc1.connect(filterNode);
      osc2.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Start/Stop
      osc1.start(now);
      osc2.start(now);
      vibrato.start(now);
      
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
      vibrato.stop(now + 0.65);
    } catch (e) {
      console.warn("Baa sound synth failed", e);
    }
  };

  const playEatingSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      const playCrunch = (delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(550, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + delay + 0.08);
        
        gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.08);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.09);
      };
      
      playCrunch(0.0);
      playCrunch(0.22);
      playCrunch(0.44);
      playCrunch(0.66);
    } catch (e) {
      console.warn("Eating sound synth failed", e);
    }
  };

  const playShowerSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      
      const bufferSize = ctx.sampleRate * 2.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      filter.Q.value = 1.0;
      
      filter.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.5);
      filter.frequency.linearRampToValueAtTime(950, ctx.currentTime + 1.2);
      filter.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 2.0);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.6);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
    } catch (e) {
      console.warn("Shower sound synth failed", e);
    }
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
          return { ...c, claimed: true };
        }
        return c;
      })
    );
    speak(`Baa! Challenge completed! You earned 🪙 ${reward} coins! 🎉`);
    
    // Rotate to a new challenge after 4 seconds
    setTimeout(() => {
      setChallenges((prev) => {
        const activeIds = prev.filter((c) => c.id !== id).map((c) => c.id);
        const availableTemplates = CHALLENGE_POOL.filter((t) => !activeIds.includes(t.id));
        const template = availableTemplates.length > 0
          ? availableTemplates[Math.floor(Math.random() * availableTemplates.length)]
          : CHALLENGE_POOL[Math.floor(Math.random() * CHALLENGE_POOL.length)];
        
        return prev.map((c) => {
          if (c.id === id) {
            return {
              id: template.id,
              text: template.text,
              target: template.target,
              current: 0,
              reward: template.reward,
              claimed: false
            };
          }
          return c;
        });
      });
    }, 4000);
  };

  // ─── Actions & Room Interactions ────────────────────────────
  const handlePet = () => {
    if (isSleeping) {
      speak("Shhh... Selah is sweeping right now, baa... Zzz... 💤");
      return;
    }
    setLastAction("petting");
    setHappiness((prev) => Math.min(prev + 12, 100));
    spawnParticles("❤️", 6);
    speak("Baa! *giggles* That tickles! You are the bestest shepherd! 🥰");
    progressChallenge("pet", 1);
    setTimeout(() => setLastAction("none"), 1000);
  };

  const handleWash = () => {
    if (activeRoom !== "bathroom") {
      speak("Baa! Put me in the bubbly Bathtub first! 🛁");
      return;
    }
    if (isSleeping) {
      speak("Baa... too sleepy for a bath... let's snuggle... 💤");
      return;
    }
    setLastAction("bathing");
    setCleanliness((prev) => Math.min(prev + 25, 100));
    setHappiness((prev) => Math.min(prev + 5, 100));
    if (mudFactor > 0) {
      setMudFactor((prev) => prev - 1);
    }
    spawnParticles("🫧", 8);
    playShowerSound();
    speak("Splish splash! Bubbles everywhere! Selah is squeaky clean! 🧼🫧");
    progressChallenge("wash", 1);
    setTimeout(() => setLastAction("none"), 1500);
  };

  const handlePlayBall = () => {
    if (activeRoom !== "backyard") {
      speak("Baa! Let's go outside to play fetch! ⚽");
      return;
    }
    if (isSleeping) {
      speak("Baa... too sweepy to play... Zzz... 💤");
      return;
    }
    
    setIsChasingBall(true);
    setLastAction("playing");
    speak("Baa! Throw the ball! I'm ready to chase it! ⚽");
    
    setTimeout(() => {
      setIsChasingBall(false);
      setLastAction("none");
      setHappiness((prev) => Math.min(prev + 20, 100));
      setCleanliness((prev) => Math.max(prev - 20, 0));
      setEnergy((prev) => Math.max(prev - 15, 0));
      setMudFactor((prev) => Math.min(prev + 1, 4));
      spawnParticles("⚽", 5);
      speak("Got it! Baa! Did you see my super jumps? Oh no, my wool got dirty... 🐾");
      progressChallenge("play", 1);
    }, 2000);
  };

  const handleWakeUp = () => {
    setIsSleeping(false);
    setLastAction("none");
    speak("Morning, baa! *stretches* I slept like a little fluffy cloud! ☀️");
  };

  // ─── Shop Actions ───────────────────────────────────────────
  const buyFood = (type: "apple" | "manna" | "cookie" | "berry" | "honey" | "milk", cost: number) => {
    if (coins < cost) {
      speak("Baa! We need more coins! Let's do some chores! 🪙");
      return;
    }
    setCoins((c) => c - cost);
    if (type === "apple") setApplesStock((s) => s + 1);
    else if (type === "manna") setMannaStock((s) => s + 1);
    else if (type === "cookie") setCookieStock((s) => s + 1);
    else if (type === "berry") setBerryStock((s) => s + 1);
    else if (type === "honey") setHoneyStock((s) => s + 1);
    else if (type === "milk") setMilkStock((s) => s + 1);
    spawnParticles("🪙", 3);
    speak(`Yummy! Purchased a premium ${type}! Added to fridge! 🍎`);
    progressChallenge("buy_food", 1);
  };

  const buyAccessory = (acc: string, cost: number) => {
    if (coins < cost) {
      speak("Baa! Not enough coins, shepherd! 🪙");
      return;
    }
    setCoins((c) => c - cost);
    setPurchasedAccessories((prev) => [...prev, acc]);
    spawnParticles("🪙", 4);
    speak(`Ooh! You bought the premium ${acc}! Let's try it on, baa! 🎀`);
    progressChallenge("buy_accessory", 1);
  };

  // ─── Map Room Navigation & Unlocks ──────────────────────────
  const travelToRoom = (room: RoomType) => {
    if (unlockedRooms.includes(room)) {
      setActiveRoom(room);
      setIsMapOpen(false);
      if (room === "bedroom" && isSleeping) {
        speak("Zzz... (Selah is resting comfortably) 🛌🌙");
      } else {
        speak(`Baa! Welcome to the ${room}! ${room === "backyard" ? "Let's run around! ⚽" : "So cozy!"}`);
      }
    }
  };

  const unlockRoom = (room: RoomType, cost: number) => {
    if (coins < cost) {
      speak(`Baa! We need 🪙 ${cost} coins to unlock the ${room}! 🔒`);
      return;
    }
    setCoins((c) => c - cost);
    setUnlockedRooms((prev) => [...prev, room]);
    spawnParticles("✨", 8);
    speak(`Yay! The ${room} is now UNLOCKED! Let's explore, baa! 🎉`);
  };

  // ─── Chat Dialogue match ────────────────────────────────────
  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const input = chatInput.trim();
    setChatInput("");

    if (isSleeping) {
      speak("Zzz... (Selah is fast asleep) 🌙");
      return;
    }

    setHappiness((prev) => Math.min(prev + 4, 100));
    spawnParticles("✨", 2);

    const text = input.toLowerCase();
    let reply = "";

    if (text.includes("sad") || text.includes("cry") || text.includes("lonely") || text.includes("hurt")) {
      reply = "Baa... don't be sad, sweet sister! The Good Shepherd is holding you super close today! 🌸";
    } else if (text.includes("scared") || text.includes("afraid") || text.includes("fear") || text.includes("anxious") || text.includes("worry")) {
      reply = "Baa! 'Do not fear, for I am with you.' (Isaiah 41:10) You are completely safe with me! 🌿";
    } else if (text.includes("love")) {
      reply = "Baa! I love you so, so much! And remember, Jesus loves you infinitely more! ❤️";
    } else if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("greet")) {
      reply = "Baa! Hello, sweet sister! I'm so, so happy you came to visit me! 🐑";
    } else if (text.includes("tired") || text.includes("sleepy") || text.includes("exhausted") || text.includes("weary")) {
      reply = "Baa! *takes deep breath* 'He makes me lie down in green pastures...' (Psalm 23:2) Sleepy time... 🌿";
    } else if (text.includes("bible") || text.includes("scripture") || text.includes("god") || text.includes("jesus") || text.includes("faith")) {
      reply = "Baa! 'The Lord is my shepherd, I shall not want.' (Psalm 23:1) He guides our little paths! 📖";
    } else {
      const randomReplies = [
        "Baa! You are so, so precious in His sight! ✨",
        "Baa! Have you taken a little moment to rest and pray today? 🌸",
        "Baa! A cheerful heart is good medicine! (Proverbs 17:22) *giggles* 💖",
        "Baa! Your heart is a beautiful garden. Let's grow in grace! 🌿",
        "Baa! I'm listening, sweet sister! Tell me all about it! 🥰",
        "Baa! Remember, you are never, ever alone. The Shepherd is always super near! 🐑"
      ];
      reply = randomReplies[Math.floor(Math.random() * randomReplies.length)];
    }

    speak(reply);
  };

  // ─── Recipe Cooking Board Actions ────────────────────────────
  const startCooking = (recipe: RecipeType) => {
    // Check ingredient stock
    if (recipe === "apple_mash" && applesStock <= 0) {
      speak("Baa! We need 1 Apple. Let's get one from the shop! 🍎");
      return;
    }
    if (recipe === "manna_cookie" && (mannaStock <= 0 || cookieStock <= 0)) {
      speak("Baa! We need 1 Manna Bread & 1 Cookie. Let's shop! 🍪");
      return;
    }
    if (recipe === "berry_pancake" && (berryStock <= 0 || milkStock <= 0)) {
      speak("Baa! We need 1 Sweet Berry & 1 Fresh Milk. Let's shop! 🍓");
      return;
    }
    if (recipe === "honey_glaze" && (honeyStock <= 0 || milkStock <= 0)) {
      speak("Baa! We need 1 Golden Honey & 1 Fresh Milk. Let's shop! 🍯");
      return;
    }

    // Deduct stock
    if (recipe === "apple_mash") setApplesStock((s) => s - 1);
    else if (recipe === "manna_cookie") {
      setMannaStock((s) => s - 1);
      setCookieStock((s) => s - 1);
    } else if (recipe === "berry_pancake") {
      setBerryStock((s) => s - 1);
      setMilkStock((s) => s - 1);
    } else if (recipe === "honey_glaze") {
      setHoneyStock((s) => s - 1);
      setMilkStock((s) => s - 1);
    }

    setCookingRecipe(recipe);
    setCookingStep("chop");
    setChopCount(0);
    setStoveCount(0);
    setStirCount(0);
    setGarnishCount(0);
    speak("Recipe selected! First, chop the ingredients on the board! 🔪");
  };

  const handleChopClick = () => {
    if (chopCount < 3) {
      const next = chopCount + 1;
      setChopCount(next);
      spawnParticles("🔪", 2);
      if (next === 3) {
        setCookingStep("stove");
        speak("All chopped! Let's put them on the stove to boil! 🫕🔥");
      }
    }
  };

  const handleStoveClick = () => {
    if (stoveCount < 3) {
      const next = stoveCount + 1;
      setStoveCount(next);
      spawnParticles("🔥", 2);
      if (next === 3) {
        setCookingStep("stir");
        speak("Hot and boiling! Now grab the spoon and stir mix it! 🥣🥄");
      }
    }
  };

  const handleStirClick = () => {
    if (stirCount < 3) {
      const next = stirCount + 1;
      setStirCount(next);
      spawnParticles("🌀", 2);
      if (next === 3) {
        setCookingStep("garnish");
        speak("Perfect consistency! Let's add some pretty toppings to garnish! 🌸✨");
      }
    }
  };

  const handleGarnishClick = () => {
    if (garnishCount < 2) {
      const next = garnishCount + 1;
      setGarnishCount(next);
      spawnParticles("✨", 3);
      if (next === 2) {
        setCookingStep("done");
        speak("So beautiful! Selah's meal is ready to be served! 🍽️✨");
      }
    }
  };

  const serveCookedRecipe = () => {
    if (!cookingRecipe) return;

    setLastAction("feeding");
    let fill = 25;
    let happy = 10;
    let ene = 0;
    let dishName = "Clover Salad";

    if (cookingRecipe === "apple_mash") {
      fill = 45;
      happy = 25;
      dishName = "Apple Clover Mash";
    } else if (cookingRecipe === "manna_cookie") {
      fill = 65;
      happy = 40;
      ene = 20;
      dishName = "Manna Cookie Treat";
    } else if (cookingRecipe === "berry_pancake") {
      fill = 75;
      happy = 50;
      ene = 15;
      dishName = "Sweet Berry Pancake";
    } else if (cookingRecipe === "honey_glaze") {
      fill = 80;
      happy = 45;
      ene = 25;
      dishName = "Honey Glazed Oats";
    }

    setHunger((prev) => Math.min(prev + fill, 100));
    setHappiness((prev) => Math.min(prev + happy, 100));
    setEnergy((prev) => Math.min(prev + ene, 100));
    setCoins((c) => c + 10); // Reward for cooking

    spawnParticles("😋", 6);
    playEatingSound();
    speak(`Baa! That was so delicious! Fluffy tummy is full! (+🪙 10 reward) 🍽️✨`);
    
    // Progress challenges
    progressChallenge("feed", 1);
    if (cookingRecipe === "clover") progressChallenge("cook_clover", 1);
    else if (cookingRecipe === "apple_mash") progressChallenge("cook_apple", 1);
    else if (cookingRecipe === "manna_cookie") progressChallenge("cook_manna", 1);
    else if (cookingRecipe === "berry_pancake") progressChallenge("cook_berry", 1);
    else if (cookingRecipe === "honey_glaze") progressChallenge("cook_honey", 1);

    // Reset cooking
    setIsCooking(false);
    setCookingRecipe(null);
    setCookingStep("choose");
    setTimeout(() => setLastAction("none"), 1200);
  };

  // ─── Bedtime Story Actions ──────────────────────────────────
  const startStoryBook = () => {
    setIsReadingStory(true);
    setStoryPage(0);
    speak("Baa... please read me a cozy bedtime story, shepherd... 📖");
  };

  const handleStoryNext = () => {
    if (storyPage < 3) {
      setStoryPage((p) => p + 1);
    } else {
      // Final page completed: Put to sleep!
      setIsReadingStory(false);
      setIsSleeping(true);
      setLastAction("sleeping");
      speak("Goodnight, sweet shepherd... Zzz... I love you... 🛌🌙");
      progressChallenge("story", 1);
    }
  };

  // ─── HUD Checks ─────────────────────────────────────────────
  const hasUnclaimedChallenges = challenges.some(c => c.current >= c.target && !c.claimed);

  const getBarColor = (val: number) => {
    if (val < 25) return "bg-red-400";
    if (val < 50) return "bg-amber-400";
    return "bg-emerald-400";
  };

  // Expressions check
  const getExpressionProps = () => {
    if (isSleeping) {
      return { type: "sleep", label: "Sleeping" };
    }
    if (energy < 30) {
      return { type: "sleepy", label: "Sleepy" };
    }
    if (hunger < 30 || happiness < 30) {
      return { type: "sad", label: "Frowning" };
    }
    return { type: "happy", label: "Happy" };
  };

  const expression = getExpressionProps();

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full select-none pb-8 animate-fade-in text-warm-cocoa font-sans relative">
      
      {/* ─── SCREEN CANVAS VIEWPORT ────────────────────────────── */}
      <div className="relative w-full h-[400px] rounded-[36px] overflow-hidden border border-stone-200 shadow-lg flex flex-col justify-between p-5 bg-stone-100">
        
        {/* ROOM BACKGROUND SVGS (IMPROVED GRAPHICS) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          
          {/* A. LIVING ROOM */}
          {activeRoom === "living" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <pattern id="stripes" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect width="10" height="20" fill="#FFFBF7" />
                  <rect x="10" width="10" height="20" fill="#FFF5EB" />
                </pattern>
              </defs>
              <rect width="400" height="300" fill="url(#stripes)" />
              {/* Floor Wood/Baseboard */}
              <line x1="0" y1="210" x2="400" y2="210" stroke="#C2A58F" strokeWidth="6" />
              <rect y="210" width="400" height="90" fill="#D4B299" />
              {/* Wooden Plank Lines */}
              <line x1="0" y1="240" x2="400" y2="240" stroke="#B0927C" strokeWidth="1" />
              <line x1="0" y1="270" x2="400" y2="270" stroke="#B0927C" strokeWidth="1" />
              
              {/* Window & Curtains */}
              <rect x="140" y="20" width="120" height="100" rx="8" fill="#BAE6FD" stroke="#94A3B8" strokeWidth="4" />
              <line x1="200" y1="20" x2="200" y2="120" stroke="#94A3B8" strokeWidth="2" />
              <line x1="140" y1="70" x2="260" y2="70" stroke="#94A3B8" strokeWidth="2" />
              {/* Curtains */}
              <path d="M 140 20 Q 155 70 140 120 L 125 120 L 125 20 Z" fill="#FDE2E4" />
              <path d="M 260 20 Q 245 70 260 120 L 275 120 L 275 20 Z" fill="#FDE2E4" />
              
              {/* Detailed Fireplace */}
              <rect x="40" y="125" width="80" height="90" rx="6" fill="#A83F17" stroke="#782E10" strokeWidth="2" />
              <rect x="52" y="155" width="56" height="60" rx="4" fill="#1E1B18" />
              {/* Fire coals */}
              <rect x="62" y="195" width="36" height="20" rx="2" fill="#450A0A" />
              <circle cx="74" cy="192" r="8" fill="#EA580C" className="animate-pulse" />
              <circle cx="86" cy="194" r="7" fill="#F97316" className="animate-pulse" style={{ animationDelay: "0.4s" }} />
              <polygon points="70,195 80,175 90,195" fill="#FACC15" className="animate-pulse" />
              
              {/* Shelf & Plants */}
              <rect x="290" y="90" width="80" height="6" fill="#8C6239" />
              <path d="M 310 90 L 315 75 L 345 75 L 350 90 Z" fill="#D97706" />
              <path d="M 315 75 Q 330 60 330 75 Q 340 60 345 75 Z" fill="#10B981" />

              {/* Cozy Rug */}
              <ellipse cx="200" cy="245" rx="90" ry="32" fill="#FFF" stroke="#E5E7EB" strokeWidth="2" opacity="0.9" />
              <ellipse cx="200" cy="245" rx="80" ry="26" fill="#FEE2E2" opacity="0.4" />
            </svg>
          )}

          {/* B. KITCHEN */}
          {activeRoom === "kitchen" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#E8F5E9" />
              {/* Tile Grid Flooring */}
              <rect y="200" width="400" height="100" fill="#E2E8F0" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#CBD5E1" strokeWidth="4" />
              {/* Diagonal tiles lines */}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={i} x1={i * 50 - 50} y1="200" x2={i * 50} y2="300" stroke="#94A3B8" strokeWidth="1" opacity="0.4" />
              ))}
              
              {/* Kitchen Counter & Shelves */}
              <rect x="20" y="140" width="180" height="65" fill="#94A3B8" stroke="#64748B" strokeWidth="2" />
              <rect x="20" y="130" width="185" height="10" rx="3" fill="#334155" />
              {/* Drawers */}
              <line x1="110" y1="140" x2="110" y2="205" stroke="#64748B" strokeWidth="2" />
              <rect x="40" y="155" width="45" height="8" rx="2" fill="#475569" />
              <rect x="135" y="155" width="45" height="8" rx="2" fill="#475569" />
              
              {/* Bowl */}
              <path d="M 90 130 Q 110 152 130 130 Z" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2.5" />
            </svg>
          )}

          {/* C. BEDROOM */}
          {activeRoom === "bedroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill={isSleeping ? "#0F172A" : "#F5F3F0"} />
              <rect y="210" width="400" height="90" fill={isSleeping ? "#1E293B" : "#E3DEC6"} />
              {/* Floorboard planks */}
              <line x1="0" y1="240" x2="400" y2="240" stroke={isSleeping ? "#0f172a" : "#C5BEA5"} strokeWidth="1" />
              <line x1="0" y1="270" x2="400" y2="270" stroke={isSleeping ? "#0f172a" : "#C5BEA5"} strokeWidth="1" />
              
              {/* Bedside table & Lamp */}
              <rect x="40" y="150" width="55" height="60" rx="4" fill={isSleeping ? "#334155" : "#A29988"} />
              <rect x="52" y="180" width="31" height="8" rx="2" fill={isSleeping ? "#1E293B" : "#5C5446"} />
              <line x1="68" y1="150" x2="68" y2="135" stroke={isSleeping ? "#475569" : "#D97706"} strokeWidth="3" />
              <path d="M 54 135 L 82 135 L 76 118 L 60 118 Z" fill={isSleeping ? "#FEF08A" : "#F87171"} opacity={isSleeping ? 0.95 : 1} />
              
              {/* Cozy Bed frame */}
              <rect x="200" y="160" width="180" height="70" rx="12" fill={isSleeping ? "#334155" : "#F472B6"} stroke={isSleeping ? "#1E293B" : "#DB2777"} strokeWidth="2" />
              <rect x="200" y="160" width="45" height="40" rx="6" fill="#FFFFFF" />
            </svg>
          )}

          {/* D. BATHROOM */}
          {activeRoom === "bathroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#E0F7FA" />
              {/* Wall tile lines */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="210" stroke="#B2EBF2" strokeWidth="1" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} y1={i * 45} x1="0" y2={i * 45} x2="400" stroke="#B2EBF2" strokeWidth="1" />
              ))}
              
              {/* Floor */}
              <rect y="210" width="400" height="90" fill="#B2EBF2" />
              <line x1="0" y1="210" x2="400" y2="210" stroke="#00ACC1" strokeWidth="4" />
              
              {/* Bathtub */}
              <rect x="110" y="165" width="180" height="70" rx="22" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="3" />
              <rect x="95" y="160" width="210" height="10" rx="5" fill="#CFD8DC" />
              {/* Tap */}
              <path d="M 125 160 L 125 145 Q 125 140 130 140 L 135 140" fill="none" stroke="#90A4AE" strokeWidth="3" />
            </svg>
          )}

          {/* E. BACKYARD */}
          {activeRoom === "backyard" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <rect width="400" height="300" fill="#E0F2FE" />
              <circle cx="340" cy="50" r="22" fill="#FCD34D" />
              {/* Hills */}
              <path d="M -30 220 Q 120 150 280 230 Q 350 190 440 240 L 440 300 L -30 300 Z" fill="#6EE7B7" />
              <path d="M -30 240 Q 80 180 220 250 Q 320 200 440 255 L 440 300 L -30 300 Z" fill="#34D399" />
              
              {/* Fence posts */}
              {Array.from({ length: 6 }).map((_, i) => (
                <g key={i} transform={`translate(${i * 80}, 190)`}>
                  <rect x="0" y="0" width="10" height="40" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
                  <polygon points="0,0 5,-8 10,0" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
                </g>
              ))}
              <rect x="0" y="205" width="400" height="6" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
            </svg>
          )}
        </div>

        {/* TOP PANEL HUD OVERLAYS */}
        <div className="w-full flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/95 bg-[#4B3A3A]/45 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm select-none">
              🪙 {coins}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Expression Indicator */}
            <span className="text-[8.5px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/80 border border-stone-200/50 shadow-xs select-none">
              Selah: {expression.label}
            </span>

            {/* Challenges board */}
            <button
              onClick={() => setIsChallengesOpen(true)}
              className="relative p-2 rounded-full bg-white/90 border border-stone-200/50 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {hasUnclaimedChallenges && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping border border-white" />
              )}
            </button>

            {/* Shop */}
            <button
              onClick={() => setIsShopOpen(true)}
              className="p-2 rounded-full bg-white/90 border border-stone-200/50 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>

            {/* Map */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-3 py-1 rounded-full bg-[#D4A5A5] hover:bg-[#c49292] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-90 transition-all cursor-pointer"
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* INTERACTIVE KITCHEN RECIPE BOOK & COOKING TRIGGERS */}
        {activeRoom === "kitchen" && !isCooking && (
          <div className="absolute right-5 top-1/4 z-30 flex flex-col gap-2">
            <button
              onClick={() => {
                setIsCooking(true);
                setCookingStep("choose");
              }}
              className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Recipe Book
            </button>

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
                  className="bg-white/95 backdrop-blur-sm border border-stone-200 p-3 rounded-3xl shadow-xl flex flex-col gap-2 w-48 text-left z-20"
                >
                  <span className="text-[8.5px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Fridge Shelf Stock</span>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍀 Clover Salad</span>
                    <span className="text-emerald-600 font-bold">Infinite</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍎 Apples</span>
                    <span className="font-bold">{applesStock} left</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍪 Cookies</span>
                    <span className="font-bold">{cookieStock} left</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍞 Manna Bread</span>
                    <span className="font-bold">{mannaStock} left</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍓 Berries</span>
                    <span className="font-bold">{berryStock} left</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-1.5 text-[9.5px]">
                    <span>🍯 Honey Jar</span>
                    <span className="font-bold">{honeyStock} left</span>
                  </div>
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span>🥛 Milk Bottle</span>
                    <span className="font-bold">{milkStock} left</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TOY BALL FOR BACKYARD FETCH */}
        {activeRoom === "backyard" && (
          <div className="absolute left-10 bottom-16 z-30 flex flex-col items-center">
            <motion.button
              type="button"
              animate={isChasingBall ? { x: [0, 180, 0], y: [0, -60, 0], rotate: [0, 360, 0] } : {}}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              onClick={handlePlayBall}
              className="w-9 h-9 rounded-full bg-red-400 border border-red-500 flex items-center justify-center text-lg shadow-md cursor-pointer active:scale-90 select-none focus:outline-none"
            >
              ⚽
            </motion.button>
            <span className="text-[8px] uppercase tracking-wider font-bold text-stone-700/60 mt-1 select-none pointer-events-none">
              Play Fetch
            </span>
          </div>
        )}

        {/* BEDROOM STORYBOOK TRIGGER & WAKE SWITCH */}
        {activeRoom === "bedroom" && (
          <div className="absolute left-6 top-1/4 z-30 flex flex-col gap-2">
            {!isSleeping ? (
              <button
                onClick={startStoryBook}
                className="p-2.5 rounded-2xl bg-rose-400 hover:bg-rose-500 text-white font-bold text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                📖 Bedtime Story
              </button>
            ) : (
              <button
                onClick={handleWakeUp}
                className="p-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1"
              >
                💡 Turn Light On
              </button>
            )}
          </div>
        )}

        {/* BATHROOM WASH CONTROLS */}
        {activeRoom === "bathroom" && (
          <div className="absolute left-6 top-1/4 z-30 flex flex-col gap-2">
            <button
              onClick={handleWash}
              className="p-2.5 rounded-2xl bg-cyan-400 hover:bg-cyan-500 text-white font-bold text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex flex-col items-center gap-1"
            >
              🛁 Give Bubble Bath
            </button>
          </div>
        )}

        {/* VIRTUAL LAMB CANVAS DOCK */}
        <div className="absolute inset-x-0 bottom-20 flex justify-center items-center h-36 z-10 pointer-events-none">
          
          {/* Dialogue speech bubble */}
          <AnimatePresence>
            {dialogue && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                className="absolute -top-16 bg-white/95 border-2 border-[#D4A5A5] text-[#4B3A3A] px-4 py-2 rounded-2xl shadow-md text-center max-w-[200px] text-[10px] font-bold z-48 pointer-events-auto"
              >
                <div className="relative text-center">
                  {dialogue}
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-[#D4A5A5] rotate-45" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Lamb Drawing with Dynamic Expressions & Stink Lines */}
          <button
            type="button"
            onClick={handlePet}
            className={`w-36 h-36 relative transition-all duration-300 focus:outline-none pointer-events-auto ${
              lastAction === "petting" ? "scale-105" : ""
            } ${lastAction === "feeding" ? "origin-bottom animate-bounce" : ""} ${
              isSleeping && activeRoom === "bedroom" ? "translate-x-24 -translate-y-6 rotate-[75deg] scale-85 opacity-95" : ""
            } ${activeRoom === "bathroom" ? "translate-y-4" : ""}`}
            style={{ animationDuration: "0.6s" }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%">
              {/* STINK LINES (cleanliness < 30) */}
              {cleanliness < 30 && (
                <g className="animate-pulse">
                  <path d="M 75 60 Q 70 50 75 40 Q 80 30 75 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 100 55 Q 95 45 100 35 Q 105 25 100 15" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 125 60 Q 120 50 125 40 Q 130 30 125 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </g>
              )}

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

              {/* Blanket overlay (only when sleeping in bedroom) */}
              {isSleeping && activeRoom === "bedroom" && (
                <g>
                  {/* Blanket body covering legs & lower body */}
                  <rect x="44" y="132" width="112" height="48" rx="8" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                  {/* Folded sheet top */}
                  <rect x="44" y="128" width="112" height="10" rx="3" fill="#FFFFFF" stroke="#DB2777" strokeWidth="1.5" />
                  {/* Cute blanket pattern (white stars/dots) */}
                  <circle cx="65" cy="145" r="2" fill="#FFFFFF" />
                  <circle cx="100" cy="145" r="2" fill="#FFFFFF" />
                  <circle cx="135" cy="145" r="2" fill="#FFFFFF" />
                  <circle cx="82" cy="160" r="2" fill="#FFFFFF" />
                  <circle cx="118" cy="160" r="2" fill="#FFFFFF" />
                </g>
              )}

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

              {/* WORRIED EYEBROWS (sad expression) */}
              {expression.type === "sad" && (
                <g>
                  <path d="M 76 104 Q 82 101 88 106" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
                  <path d="M 112 106 Q 118 101 124 104" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
                </g>
              )}

              {/* EYES (DYNAMIC) */}
              {expression.type === "sleep" ? (
                // Happy curved closed eyes
                <>
                  <path d="M 76 114 Q 82 108 88 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                  <path d="M 112 114 Q 118 108 124 114" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
                </>
              ) : expression.type === "sleepy" ? (
                // Sleepy half closed eyes
                <>
                  <ellipse cx="82" cy="113" rx="6" ry="2.2" fill="#4B3A3A" />
                  <ellipse cx="118" cy="113" rx="6" ry="2.2" fill="#4B3A3A" />
                  <line x1="75" y1="110" x2="89" y2="110" stroke="#4B3A3A" strokeWidth={1} />
                  <line x1="111" y1="110" x2="125" y2="110" stroke="#4B3A3A" strokeWidth={1} />
                </>
              ) : isBlinking ? (
                <>
                  <path d="M 76 112 Q 82 116 88 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                  <path d="M 112 112 Q 118 116 124 112" fill="none" stroke="#4B3A3A" strokeWidth={3} strokeLinecap="round" />
                </>
              ) : (
                // Normal shiny cartoon eyes
                <>
                  <circle cx="82" cy="112" r="6" fill="#4B3A3A" />
                  <circle cx="80" cy="110" r="2.2" fill="white" />
                  <circle cx="83.5" cy="114" r="0.8" fill="white" />
                  <circle cx="118" cy="112" r="6" fill="#4B3A3A" />
                  <circle cx="116" cy="110" r="2.2" fill="white" />
                  <circle cx="119.5" cy="114" r="0.8" fill="white" />
                </>
              )}

              {/* MOUTH (DYNAMIC) */}
              {expression.type === "sleep" ? (
                // Sweet smile
                <path d="M 96 123 Q 100 126 104 123" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
              ) : expression.type === "sleepy" ? (
                // Yawing mouth
                <ellipse cx="100" cy="125" rx="3.5" ry="4.5" fill="#C06C84" />
              ) : expression.type === "sad" ? (
                // Downturned frown
                <path d="M 96 125 Q 100 121 104 125" fill="none" stroke="#4B3A3A" strokeWidth={2.5} strokeLinecap="round" />
              ) : isTalking ? (
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

              {/* MUD SPLATTERS */}
              {mudFactor >= 1 && <ellipse cx="88" cy="144" rx="5.5" ry="3.5" fill="#783F04" opacity="0.85" />}
              {mudFactor >= 2 && <ellipse cx="114" cy="138" rx="6" ry="4" fill="#783F04" opacity="0.85" transform="rotate(20 114 138)" />}
              {mudFactor >= 3 && <circle cx="100" cy="154" r="4.5" fill="#783F04" opacity="0.85" />}
              {mudFactor >= 4 && <ellipse cx="88" cy="116" rx="4" ry="2.5" fill="#783F04" opacity="0.8" transform="rotate(-15 88 116)" />}

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
          </button>
        </div>

        {/* BOTTOM HUD PANEL */}
        <div className="w-full flex items-center justify-between z-10 relative">
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

        {/* BOTTOM-LEFT ACTIVITIES DRAWER */}
        <AnimatePresence>
          {isActivitiesOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute left-5 bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-4 rounded-[28px] shadow-2xl z-40 flex flex-col gap-2 w-52"
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
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                  activeRoom === "bedroom" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <span>🛌</span> Bedroom (Sleep)
              </button>

              {/* Bathroom */}
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
                  {!unlockedRooms.includes("bathroom") && <Lock className="w-3.5 h-3.5 text-stone-400" />}
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

              {/* Backyard */}
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
                {!unlockedRooms.includes("backyard") && <Lock className="w-3.5 h-3.5 text-stone-400" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM-RIGHT STATS & WARDROBE DRAWER */}
        <AnimatePresence>
          {isStatusOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute right-5 bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-4 rounded-[28px] shadow-2xl z-45 flex flex-col gap-3.5 w-60"
            >
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Selah Details</span>
                <button onClick={() => setIsStatusOpen(false)} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* STATS */}
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

              {/* WARDROBE */}
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
                            speak("Baa... let me change my outfit when I wake up... Zzz...");
                            return;
                          }
                          setAccessory(acc);
                          spawnParticles("✨", 2);
                          speak(acc === "none" ? "Baa! Fluffy, clean, and natural!" : `Baa! Look at my pretty ${acc}! 🥰`);
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

      {/* ─── CHAT INPUT DIALOG FOOTER */}
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

      {/* ─── A. TRAVEL MAP BLUEPRINT MODAL (BIRD'S-EYE VIEW) ─────── */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-stone-150 p-6 rounded-[32px] shadow-2xl text-center max-w-md w-full relative"
            >
              <button
                onClick={() => setIsMapOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-serif text-base font-bold text-warm-cocoa mb-1 flex items-center justify-center gap-1.5">
                🗺️ Cozy House Blueprint Map
              </h3>
              <p className="text-[10px] text-warm-grey/50 italic mb-5">
                Quick-travel to rooms or spend coins to expand your sanctuary.
              </p>

              {/* Bird's eye house blueprint model layout grid */}
              <div className="grid grid-cols-2 gap-4 border border-dashed border-stone-300 p-4 rounded-3xl bg-stone-50/50 relative">
                
                {/* 1. Bedroom (Top-Left) */}
                <button
                  type="button"
                  onClick={() => travelToRoom("bedroom")}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    activeRoom === "bedroom"
                      ? "bg-rose-50 border-rose-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Bedroom</span>
                    <span className="text-sm">🛌</span>
                  </span>
                  <span className="text-[9px] text-stone-400 italic">
                    {activeRoom === "bedroom" ? "Selah is here" : "Click to go"}
                  </span>
                </button>

                {/* 2. Bathroom (Top-Right - Unlockable) */}
                <button
                  type="button"
                  onClick={() => {
                    if (unlockedRooms.includes("bathroom")) travelToRoom("bathroom");
                    else unlockRoom("bathroom", 60);
                  }}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    !unlockedRooms.includes("bathroom")
                      ? "bg-stone-100 border-stone-200 opacity-80"
                      : activeRoom === "bathroom"
                      ? "bg-cyan-50 border-cyan-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Bathroom</span>
                    <span className="text-sm">🛁</span>
                  </span>
                  {unlockedRooms.includes("bathroom") ? (
                    <span className="text-[9px] text-stone-400 italic">
                      {activeRoom === "bathroom" ? "Selah is here" : "Click to go"}
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 flex items-center justify-center gap-1 self-start">
                      <Lock className="w-2.5 h-2.5" /> 🪙 60
                    </span>
                  )}
                </button>

                {/* 3. Living Room (Bottom-Left) */}
                <button
                  type="button"
                  onClick={() => travelToRoom("living")}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    activeRoom === "living"
                      ? "bg-rose-50 border-rose-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Living Room</span>
                    <span className="text-sm">🏠</span>
                  </span>
                  <span className="text-[9px] text-stone-400 italic">
                    {activeRoom === "living" ? "Selah is here" : "Click to go"}
                  </span>
                </button>

                {/* 4. Kitchen (Bottom-Right) */}
                <button
                  type="button"
                  onClick={() => travelToRoom("kitchen")}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    activeRoom === "kitchen"
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Kitchen</span>
                    <span className="text-sm">🍳</span>
                  </span>
                  <span className="text-[9px] text-stone-400 italic">
                    {activeRoom === "kitchen" ? "Selah is here" : "Click to go"}
                  </span>
                </button>

                {/* 5. Backyard (Bottom span - Unlockable) */}
                <button
                  type="button"
                  onClick={() => {
                    if (unlockedRooms.includes("backyard")) travelToRoom("backyard");
                    else unlockRoom("backyard", 100);
                  }}
                  className={`col-span-2 p-4 h-20 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    !unlockedRooms.includes("backyard")
                      ? "bg-stone-100 border-stone-200 opacity-80"
                      : activeRoom === "backyard"
                      ? "bg-teal-50 border-teal-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-center w-full">
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold text-warm-cocoa">Backyard Field</span>
                      <span className="text-sm">⚽</span>
                    </span>
                    {unlockedRooms.includes("backyard") ? (
                      <span className="text-[9px] text-stone-400 italic">
                        {activeRoom === "backyard" ? "Selah is here" : "Click to go"}
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Unlock Backyard (🪙 100)
                      </span>
                    )}
                  </span>
                </button>

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
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded animate-pulse">Free</span>
                  </div>

                  {/* Apples */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍎 Red Apple (Stock: {applesStock})</span>
                      <span className="text-[9px] text-stone-400">Crispy honeycrisp apple</span>
                    </div>
                    <button
                      onClick={() => buyFood("apple", 10)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
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
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
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
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      🪙 20
                    </button>
                  </div>

                  {/* Berries */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍓 Sweet Berries (Stock: {berryStock})</span>
                      <span className="text-[9px] text-stone-400">Sweet wild forest berries</span>
                    </div>
                    <button
                      onClick={() => buyFood("berry", 15)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      🪙 15
                    </button>
                  </div>

                  {/* Honey */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🍯 Golden Honey (Stock: {honeyStock})</span>
                      <span className="text-[9px] text-stone-400">Pure organic clover honey</span>
                    </div>
                    <button
                      onClick={() => buyFood("honey", 20)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      🪙 20
                    </button>
                  </div>

                  {/* Milk */}
                  <div className="p-2.5 rounded-xl border border-stone-150 flex items-center justify-between bg-stone-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">🥛 Fresh Milk (Stock: {milkStock})</span>
                      <span className="text-[9px] text-stone-400">Organic creamy pasture milk</span>
                    </div>
                    <button
                      onClick={() => buyFood("milk", 12)}
                      className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
                    >
                      🪙 12
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
                            className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[9px] font-bold active:scale-95 transition-all cursor-pointer"
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

      {/* ─── D. KITCHEN COOKING TABLE SCREEN OVERLAY (BIRD'S-EYE) ─ */}
      <AnimatePresence>
        {isCooking && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF8F2] border-4 border-[#C2A58F] p-5 rounded-[40px] shadow-2xl text-center max-w-md w-full relative min-h-[380px] flex flex-col justify-between"
            >
              <button
                onClick={() => {
                  setIsCooking(false);
                  setCookingRecipe(null);
                  setCookingStep("choose");
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full">
                <h3 className="font-serif text-base font-bold text-warm-cocoa mb-0.5 flex items-center justify-center gap-1">
                  🍳 Selah's Cooking Table
                </h3>
                <p className="text-[9px] text-warm-grey/50 italic mb-4">
                  Bird's-eye view cutting board & mixing bowl
                </p>
              </div>

              {/* STEP 1: CHOOSE A RECIPE */}
              {cookingStep === "choose" && (
                <div className="flex-1 flex flex-col justify-center gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Select a Recipe</span>
                  
                  {/* Recipe 1: Clover Salad */}
                  <button
                    type="button"
                    onClick={() => startCooking("clover")}
                    className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 transition-all cursor-pointer flex justify-between items-center text-left w-full focus:outline-none"
                  >
                    <span className="flex flex-col text-left">
                      <span className="text-xs font-bold block text-emerald-800">🍀 Sweet Clover Salad</span>
                      <span className="text-[8.5px] text-stone-400">Needs: Clover (∞)</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-emerald-600">Feeds +20%</span>
                  </button>

                  {/* Recipe 2: Apple Clover Mash */}
                  <button
                    type="button"
                    onClick={() => startCooking("apple_mash")}
                    className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-amber-50/20 hover:border-amber-300 transition-all cursor-pointer flex justify-between items-center text-left w-full focus:outline-none"
                  >
                    <span className="flex flex-col text-left">
                      <span className="text-xs font-bold block text-amber-800">🍎 Apple Clover Mash</span>
                      <span className="text-[8.5px] text-stone-400">Needs: 1 Apple ({applesStock} stock) + Clover</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-600">Feeds +45%</span>
                  </button>

                  {/* Recipe 3: Manna Cookie Treat */}
                  <button
                    type="button"
                    onClick={() => startCooking("manna_cookie")}
                    className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-rose-50/20 hover:border-rose-300 transition-all cursor-pointer flex justify-between items-center text-left w-full focus:outline-none"
                  >
                    <span className="flex flex-col text-left">
                      <span className="text-xs font-bold block text-rose-800">🍞 Manna Cookie Treat</span>
                      <span className="text-[8.5px] text-stone-400">Needs: 1 Manna ({mannaStock} stock) + 1 Cookie ({cookieStock} stock)</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-rose-600">Feeds +65%</span>
                  </button>

                  {/* Recipe 4: Sweet Berry Pancake */}
                  <button
                    type="button"
                    onClick={() => startCooking("berry_pancake")}
                    className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-rose-50/20 hover:border-rose-300 transition-all cursor-pointer flex justify-between items-center text-left w-full focus:outline-none"
                  >
                    <span className="flex flex-col text-left">
                      <span className="text-xs font-bold block text-rose-800">🍓 Sweet Berry Pancake</span>
                      <span className="text-[8.5px] text-stone-400">Needs: 1 Berry ({berryStock} stock) + 1 Milk ({milkStock} stock)</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-rose-600">Feeds +75%</span>
                  </button>

                  {/* Recipe 5: Honey Glazed Oats */}
                  <button
                    type="button"
                    onClick={() => startCooking("honey_glaze")}
                    className="p-3 rounded-2xl border border-stone-200 bg-white hover:bg-amber-50/20 hover:border-amber-300 transition-all cursor-pointer flex justify-between items-center text-left w-full focus:outline-none"
                  >
                    <span className="flex flex-col text-left">
                      <span className="text-xs font-bold block text-amber-800">🍯 Honey Glazed Oats</span>
                      <span className="text-[8.5px] text-stone-400">Needs: 1 Honey ({honeyStock} stock) + 1 Milk ({milkStock} stock)</span>
                    </span>
                    <span className="text-[10.5px] font-bold text-amber-600">Feeds +80%</span>
                  </button>
                </div>
              )}

              {/* STEP 2: CHOP THE INGREDIENTS */}
              {cookingStep === "chop" && cookingRecipe && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 animate-pulse">
                    Tap the board to chop the ingredients! ({chopCount}/3)
                  </span>

                  {/* Cutting Board Table */}
                  <button
                    type="button"
                    onClick={handleChopClick}
                    className="w-56 h-36 rounded-2xl bg-[#E6D5C3] border-4 border-[#B0927C] shadow-inner relative flex items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-repeat opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M0 5h10M5 0v10' stroke='%23000' stroke-width='0.5'/%3E%3C/svg%3E")` }} />

                    {/* Animated Knife */}
                    <motion.div
                      animate={chopCount > 0 ? {
                        rotate: [0, -35, 0],
                        y: [0, -20, 0],
                        x: [0, -5, 0]
                      } : {}}
                      key={chopCount}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute right-6 top-6 text-3xl select-none z-20"
                    >
                      🔪
                    </motion.div>
                    
                    {/* Ingredients Graphic representation */}
                    <span className="relative z-10 flex gap-2 items-center">
                      {cookingRecipe === "clover" && (
                        <span className="text-3xl select-none block">🍀</span>
                      )}
                      {cookingRecipe === "apple_mash" && (
                        <span className="text-3xl select-none block">🍎</span>
                      )}
                      {cookingRecipe === "manna_cookie" && (
                        <span className="flex gap-2 text-2xl select-none">
                          <span>🍞</span>
                          <span>🍪</span>
                        </span>
                      )}
                      {cookingRecipe === "berry_pancake" && (
                        <span className="flex gap-2 text-2xl select-none">
                          <span>🍓</span>
                          <span>🥛</span>
                        </span>
                      )}
                      {cookingRecipe === "honey_glaze" && (
                        <span className="flex gap-2 text-2xl select-none">
                          <span>🍯</span>
                          <span>🥛</span>
                        </span>
                      )}

                      {/* Cut lines overlay */}
                      {chopCount >= 1 && (
                        <span className="absolute top-0 left-0 w-full h-full border-l-2 border-red-500/80 translate-x-[10px] transform rotate-12 block" />
                      )}
                      {chopCount >= 2 && (
                        <span className="absolute top-0 left-0 w-full h-full border-r-2 border-red-500/80 -translate-x-[10px] transform -rotate-12 block" />
                      )}
                      {chopCount >= 3 && (
                        <span className="absolute top-1/2 left-0 w-full border-t-2 border-red-500/80 -translate-y-1/2 block" />
                      )}
                    </span>
                  </button>
                </div>
              )}

              {/* STEP 3: STOVE BOIL/COOK */}
              {cookingStep === "stove" && cookingRecipe && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 animate-pulse">
                    Tap the stove to boil and cook! ({stoveCount}/3)
                  </span>

                  <button
                    type="button"
                    onClick={handleStoveClick}
                    className="w-52 h-44 rounded-3xl bg-stone-800 border-4 border-stone-700 shadow-xl relative flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none p-4"
                  >
                    {/* Glowing stove burner */}
                    <div className="absolute w-32 h-32 rounded-full border-4 border-dashed border-red-600/30 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-radial from-red-500/30 to-transparent animate-pulse" />
                    </div>
                    {/* Hot glowing rings */}
                    <div className={`absolute w-28 h-28 rounded-full border-2 border-red-500 transition-all duration-500 ${
                      stoveCount === 1 ? "opacity-40 animate-pulse" :
                      stoveCount === 2 ? "opacity-70 scale-105 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                      stoveCount === 3 ? "opacity-100 scale-110 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse" :
                      "opacity-20"
                    }`} />

                    {/* Boiling Pot */}
                    <div className="relative z-10 flex flex-col items-center">
                      {/* Floating Steam Particles */}
                      <div className="absolute -top-12 flex gap-1 justify-center w-full">
                        <motion.span
                          animate={{ y: [-10, -40], x: [0, -5, 5, 0], opacity: [0, 0.8, 0], scale: [0.6, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }}
                          className="text-lg select-none filter blur-[0.5px]"
                        >
                          💨
                        </motion.span>
                        <motion.span
                          animate={{ y: [-10, -35], x: [0, 5, -5, 0], opacity: [0, 0.8, 0], scale: [0.8, 1.1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                          className="text-base select-none filter blur-[0.5px]"
                        >
                          💨
                        </motion.span>
                        <motion.span
                          animate={{ y: [-10, -45], x: [0, -3, 3, 0], opacity: [0, 0.9, 0], scale: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2, delay: 0.9 }}
                          className="text-xs select-none filter blur-[0.5px]"
                        >
                          💨
                        </motion.span>
                      </div>

                      {/* Pot representation */}
                      <div className="text-5xl select-none animate-bounce" style={{ animationDuration: "1s" }}>
                        🍲
                      </div>
                      
                      <span className="text-[8px] uppercase tracking-wider font-bold text-white/50 mt-1.5">
                        {stoveCount === 3 ? "Fully Heated!" : "Boiling..."}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 4: STIR MIX */}
              {cookingStep === "stir" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 animate-pulse">
                    Tap the mixing bowl to stir! ({stirCount}/3)
                  </span>

                  {/* Mixing Bowl Table */}
                  <button
                    type="button"
                    onClick={handleStirClick}
                    className="w-44 h-44 rounded-full bg-white border-4 border-rose-300 shadow-md relative flex items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none overflow-hidden"
                  >
                    {/* Swirly mix lines inside */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none z-0">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#FDA4AF" strokeWidth="2" strokeDasharray="10 5" className={stirCount > 0 ? "animate-spin" : ""} style={{ transformOrigin: "50% 50%", animationDuration: "3s" }} />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeDasharray="8 4" className={stirCount > 0 ? "animate-spin" : ""} style={{ transformOrigin: "50% 50%", animationDuration: "2s", animationDirection: "reverse" }} />
                    </svg>

                    {/* Spoon animation overlay */}
                    <motion.div
                      animate={stirCount > 0 ? {
                        rotate: [0, 360],
                        x: [0, 10, 0, -10, 0],
                        y: [0, -10, 0, 10, 0]
                      } : {}}
                      key={stirCount}
                      transition={{ duration: 0.4, ease: "linear" }}
                      className="absolute text-4xl select-none z-20 pointer-events-none"
                    >
                      🥄
                    </motion.div>

                    {/* Sliced food elements inside */}
                    <span className="flex gap-1.5 items-center z-10 text-xs font-bold bg-white/40 p-1.5 rounded-full backdrop-blur-xs select-none">
                      {cookingRecipe === "clover" && <span>🍀🍀🍀</span>}
                      {cookingRecipe === "apple_mash" && <span>🍎🍀🍎</span>}
                      {cookingRecipe === "manna_cookie" && <span>🍞🍪🍞</span>}
                      {cookingRecipe === "berry_pancake" && <span>🍓🥞🍓</span>}
                      {cookingRecipe === "honey_glaze" && <span>🍯🥣🥛</span>}
                    </span>
                  </button>
                </div>
              )}

              {/* STEP 5: GARNISH */}
              {cookingStep === "garnish" && cookingRecipe && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A5A5] animate-pulse">
                    Tap to sprinkle pretty garnish toppings! ({garnishCount}/2)
                  </span>

                  <button
                    type="button"
                    onClick={handleGarnishClick}
                    className="w-48 h-48 rounded-full bg-[#FCF8F2] border-4 border-dashed border-[#D4A5A5]/80 shadow-md relative flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none"
                  >
                    {/* Plate */}
                    <div className="w-36 h-36 rounded-full bg-white border-2 border-stone-200 flex flex-col items-center justify-center shadow-md relative p-2">
                      <span className="text-4xl animate-pulse">🍲</span>
                      <span className="text-[8.5px] font-bold text-stone-500 uppercase tracking-wider mt-1 text-center">
                        {cookingRecipe === "clover" ? "Clover Salad" :
                         cookingRecipe === "apple_mash" ? "Apple Clover Mash" :
                         cookingRecipe === "manna_cookie" ? "Manna Cookie Treat" :
                         cookingRecipe === "berry_pancake" ? "Sweet Berry Pancake" :
                         "Honey Glazed Oats"}
                      </span>

                      {/* Garnish elements overlay */}
                      {garnishCount >= 1 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <motion.span initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute text-sm top-8 left-10">🌸</motion.span>
                          <motion.span initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute text-sm top-6 right-10">✨</motion.span>
                        </div>
                      )}
                      {garnishCount >= 2 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <motion.span initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute text-xs bottom-8 left-12">🌿</motion.span>
                          <motion.span initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute text-xs bottom-10 right-12">🍓</motion.span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 6: COOKED DONE SERVE */}
              {cookingStep === "done" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 animate-bounce">
                    Sanctuary meal ready! 🍽️✨
                  </span>

                  {/* Served food plate */}
                  <div className="w-36 h-36 rounded-full bg-white border-2 border-stone-200 flex flex-col items-center justify-center shadow-lg relative p-2">
                    <span className="text-3xl">🍲</span>
                    <span className="text-[10.5px] font-bold text-warm-cocoa uppercase tracking-wider mt-1.5 text-center leading-tight">
                      {cookingRecipe === "clover" ? "Clover Salad" : 
                       cookingRecipe === "apple_mash" ? "Apple Clover Mash" : 
                       cookingRecipe === "manna_cookie" ? "Manna Cookie Treat" :
                       cookingRecipe === "berry_pancake" ? "Sweet Berry Pancake" :
                       "Honey Glazed Oats"}
                    </span>
                  </div>

                  <button
                    onClick={serveCookedRecipe}
                    className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    Feed bowl to Selah! 🐑🍽️
                  </button>
                </div>
              )}

              {/* Footer step indicators */}
              {cookingStep !== "choose" && (
                <div className="w-full flex justify-center gap-1.5 text-[9px] font-bold text-stone-400 mt-2">
                  <span className={cookingStep === "chop" ? "text-amber-700 font-extrabold" : ""}>1. Chop</span> • 
                  <span className={cookingStep === "stove" ? "text-red-600 font-extrabold" : ""}>2. Stove</span> • 
                  <span className={cookingStep === "stir" ? "text-rose-600 font-extrabold" : ""}>3. Stir Mix</span> • 
                  <span className={cookingStep === "garnish" ? "text-[#D4A5A5] font-extrabold" : ""}>4. Garnish</span> • 
                  <span className={cookingStep === "done" ? "text-emerald-700 font-extrabold" : ""}>5. Serve</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── E. BEDTIME STORYBOOK READING OVERLAY ────────────────── */}
      <AnimatePresence>
        {isReadingStory && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FCF6E8] border-4 border-[#C2A58F] p-6 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[320px] flex flex-col justify-between"
            >
              <button
                onClick={() => setIsReadingStory(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full">
                <span className="text-[8.5px] uppercase font-bold text-stone-400 tracking-wider">Bedtime Story Reading</span>
                <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-4">
                  Selah the Little Lamb's Peaceful Night 🌙
                </h3>
              </div>

              {/* STORYBOOK PAGE CONTENT */}
              <div className="flex-1 flex items-center justify-center p-4 bg-white/70 rounded-2xl border border-stone-200/50 mb-5 leading-relaxed text-xs text-warm-cocoa font-medium font-serif italic text-left">
                {storyPage === 0 && (
                  <span>"Once upon a time in a beautiful green valley, there was a tiny lamb named Selah. Selah loved to run and jump all day under the warm sun, chasing butterflies."</span>
                )}
                {storyPage === 1 && (
                  <span>"But as the night fell, the stars began to twinkle in the sky like tiny candles. The Good Shepherd called: 'Come back to the fold, little Selah.'"</span>
                )}
                {storyPage === 2 && (
                  <span>"Selah walked slowly to the cozy bedroom, snuggling into the soft hay. The Shepherd covered Selah with a warm blanket, whispering: 'Do not fear, you are safe.'"</span>
                )}
                {storyPage === 3 && (
                  <span>"Selah listened to the gentle night wind outside, closed her eyes, and smiled. 'He watches over His sheep.' Goodnight, sweet Selah. Zzz..."</span>
                )}
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-between w-full">
                <button
                  disabled={storyPage === 0}
                  onClick={() => setStoryPage((p) => p - 1)}
                  className="px-4 py-1.5 rounded-xl border border-stone-250 text-stone-600 font-bold text-[9px] uppercase tracking-wider disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                >
                  ← Back
                </button>
                <span className="text-[9px] font-bold text-stone-450">Page {storyPage + 1} of 4</span>
                <button
                  onClick={handleStoryNext}
                  className="px-4 py-1.5 rounded-xl bg-[#4B3A3A] text-white font-bold text-[9px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  {storyPage === 3 ? "Sleep 🛌💤" : "Next Page →"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
