"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Map, ShoppingBag, CheckSquare, X, Lock, BookOpen } from "lucide-react";
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

type RoomType = "living" | "kitchen" | "bedroom" | "bathroom" | "backyard" | "vet" | "meadow";
type RecipeType = "clover" | "apple_mash" | "manna_cookie" | "berry_pancake" | "honey_glaze";
type StoryMode = "living" | "bedtime";
type StoryBookId = "psalm23" | "lostSheep" | "peacefulNight";

type BrowserWindowWithAudio = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const clampStat = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const getAudioContextClass = () => {
  if (typeof window === "undefined") return null;
  const audioWindow = window as BrowserWindowWithAudio;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext ?? null;
};

const STORY_BOOKS: Record<StoryBookId, { title: string; emoji: string; modeLabel: string; pages: string[] }> = {
  psalm23: {
    title: "The Shepherd’s Green Meadow",
    emoji: "🌿",
    modeLabel: "Living Room Read-Aloud",
    pages: [
      "Selah opened a tiny green book and saw a meadow shining in the morning light. The Shepherd smiled and said, ‘I know every path that leads to peace.’",
      "Beside still water, Selah learned to breathe slowly. The breeze sounded like a whisper: ‘You are cared for. You do not walk alone.’",
      "When shadows stretched across the hills, Selah stayed close to the Shepherd’s voice. Her little hooves grew brave again.",
      "At the end of the path, a table waited with bread, honey, and joy. Selah closed the book and whispered, ‘The Lord is my shepherd.’",
    ],
  },
  lostSheep: {
    title: "The Little Lamb Who Was Found",
    emoji: "🐑",
    modeLabel: "Living Room Read-Aloud",
    pages: [
      "A small lamb wandered past the daisies, chasing a gold butterfly farther and farther from home.",
      "When the sky turned lavender, the lamb felt afraid. But the Good Shepherd had already begun searching with a lantern of love.",
      "He found the lamb near a quiet stone, lifted it gently, and carried it close to His heart.",
      "Back home, everyone rejoiced. Selah clapped her hooves and said, ‘No lamb is ever too lost to be loved.’",
    ],
  },
  peacefulNight: {
    title: "Selah the Little Lamb’s Peaceful Night",
    emoji: "🌙",
    modeLabel: "Bedtime Story Reading",
    pages: [
      "Once upon a time in a beautiful green valley, there was a tiny lamb named Selah. Selah loved to run and jump all day under the warm sun, chasing butterflies.",
      "But as the night fell, the stars began to twinkle in the sky like tiny candles. The Good Shepherd called: ‘Come back to the fold, little Selah.’",
      "Selah walked slowly to the cozy bedroom, snuggling into the soft hay. The Shepherd covered Selah with a warm blanket, whispering: ‘Do not fear, you are safe.’",
      "Selah listened to the gentle night wind outside, closed her eyes, and smiled. ‘He watches over His sheep.’ Goodnight, sweet Selah. Zzz...",
    ],
  },
};

export function MyTalkingLamb() {
  // ─── Currency & Unlocking States ────────────────────────────
  const [coins, setCoins] = useState(50);
  const [unlockedRooms, setUnlockedRooms] = useState<RoomType[]>(["living", "kitchen", "bedroom", "vet"]);
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
  const [accessory, setAccessory] = useState<"none" | "bow" | "bell" | "crown" | "scarf" | "royal" | "glasses" | "sunhat" | "halo">("none");
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

  // ─── Sickness & Clinic States ──────────────────────────────
  const [isSick, setIsSick] = useState(false);
  const [isClinicActive, setIsClinicActive] = useState(false);
  const [clinicStep, setClinicStep] = useState<"temp" | "bandaid" | "syrup" | "done">("temp");
  const [vetTemp, setVetTemp] = useState(37);
  const [sores, setSores] = useState<{ id: number; x: number; y: number; treated: boolean }[]>([]);
  const [syrupCount, setSyrupCount] = useState(0);

  // ─── Meadow Walk States ────────────────────────────────────
  const [isWalkingActive, setIsWalkingActive] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0);
  const [lastFoot, setLastFoot] = useState<"left" | "right" | "none">("none");

  // ─── Cooking Table States ───────────────────────────────────
  const [isCooking, setIsCooking] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<RecipeType | null>(null);
  const [cookingStep, setCookingStep] = useState<"choose" | "chop" | "stove" | "stir" | "garnish" | "done">("choose");
  const [chopCount, setChopCount] = useState(0);
  const [sliderPos, setSliderPos] = useState(0);
  const [temp, setTemp] = useState(30);
  const [boilProgress, setBoilProgress] = useState(0);
  const [stirIndex, setStirIndex] = useState(0);
  const [garnishItems, setGarnishItems] = useState<{ id: number; emoji: string; x: number; y: number; placed: boolean }[]>([]);

  // ─── Bedtime Story States ───────────────────────────────────
  const [isReadingStory, setIsReadingStory] = useState(false);
  const [storyPage, setStoryPage] = useState(0);
  const [storyMode, setStoryMode] = useState<StoryMode>("bedtime");
  const [selectedStoryBook, setSelectedStoryBook] = useState<StoryBookId>("peacefulNight");

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
  const actionLockRef = useRef(false);
  const sickCooldownRef = useRef(0);
  const challengeRotationRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Local Storage persistence ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selahly_talking_lamb_house_v2");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setCoins(Math.max(0, p.coins ?? 50));
        const loadedRooms = Array.from(new Set([...(p.unlockedRooms ?? ["living", "kitchen", "bedroom"]), "vet"])) as RoomType[];
        if (!loadedRooms.includes("vet")) {
          loadedRooms.push("vet");
        }
        setUnlockedRooms(loadedRooms);
        setPurchasedAccessories(Array.from(new Set(p.purchasedAccessories ?? ["none", "bow"])));
        setHunger(clampStat(p.hunger ?? 70));
        setHappiness(clampStat(p.happiness ?? 60));
        setCleanliness(clampStat(p.cleanliness ?? 80));
        setEnergy(clampStat(p.energy ?? 50));
        setAccessory(p.accessory ?? "none");
        setIsSleeping(p.isSleeping ?? false);
        setApplesStock(p.applesStock ?? 2);
        setMannaStock(p.mannaStock ?? 1);
        setCookieStock(p.cookieStock ?? 3);
        setBerryStock(p.berryStock ?? 2);
        setHoneyStock(p.honeyStock ?? 1);
        setMilkStock(p.milkStock ?? 1);
        setMudFactor(p.mudFactor ?? 0);
        setActiveRoom(loadedRooms.includes(p.activeRoom) ? p.activeRoom : "living");
        setIsSick(p.isSick ?? false);
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
    return () => {
      clearTimeout(t);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (challengeRotationRef.current) {
        clearTimeout(challengeRotationRef.current);
      }
    };
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
        isSick,
        challenges
      })
    );
  }, [coins, unlockedRooms, purchasedAccessories, hunger, happiness, cleanliness, energy, accessory, isSleeping, applesStock, mannaStock, cookieStock, berryStock, honeyStock, milkStock, mudFactor, activeRoom, isSick, challenges]);

  // ─── Dynamic Draining / Sleep refilling ──────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSleeping) {
        sickCooldownRef.current = Math.max(0, sickCooldownRef.current - 1);
        setEnergy((prev) => clampStat(prev + 5));
        setHunger((prev) => clampStat(prev - 0.4));
        setHappiness((prev) => clampStat(prev - 0.1));
      } else {
        sickCooldownRef.current = Math.max(0, sickCooldownRef.current - 1);
        setHunger((prev) => clampStat(prev - 0.7));
        setHappiness((prev) => clampStat(prev - 0.45));
        setCleanliness((prev) => clampStat(prev - 0.35));
        setEnergy((prev) => clampStat(prev - 0.55));

        // Sickness should feel like a care consequence, not random punishment.
        if (!isSick && sickCooldownRef.current === 0) {
          const lowStats = cleanliness < 25 || hunger < 25;
          const probability = lowStats ? 0.12 : 0.005;
          if (Math.random() < probability) {
            setIsSick(true);
            sickCooldownRef.current = 20;
            speak("Achoo! Baa... I don't feel very well, shepherd... Can we visit the Vet Clinic? 🤒");
          }
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isSleeping, isSick, cleanliness, hunger]);

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

  // ─── Vet clinic thermometer slider loop ───
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClinicActive && clinicStep === "temp") {
      let dir = 1;
      interval = setInterval(() => {
        setVetTemp((prev) => {
          let next = prev + dir * 0.2;
          if (next >= 41.5) {
            next = 41.5;
            dir = -1;
          } else if (next <= 35.5) {
            next = 35.5;
            dir = 1;
          }
          return parseFloat(next.toFixed(1));
        });
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isClinicActive, clinicStep]);

  // ─── Chop timing slider loop ───
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCooking && cookingStep === "chop") {
      let currentPos = 0;
      let dir = 1;
      interval = setInterval(() => {
        currentPos += dir * 8;
        if (currentPos >= 100) {
          currentPos = 100;
          dir = -1;
        } else if (currentPos <= 0) {
          currentPos = 0;
          dir = 1;
        }
        setSliderPos(currentPos);
      }, 35);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCooking, cookingStep]);

  // ─── Stove temperature hold progress loop ───
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCooking && cookingStep === "stove") {
      interval = setInterval(() => {
        setTemp((t) => Math.max(30, t - 2));
        setTemp((t) => {
          if (t >= 80 && t <= 100) {
            setBoilProgress((p) => {
              const next = Math.min(100, p + 5);
              return next;
            });
          }
          return t;
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCooking, cookingStep]);

  // Advance from stove step once boiling is complete
  useEffect(() => {
    if (boilProgress >= 100 && cookingStep === "stove") {
      setCookingStep("stir");
      setStirIndex(0);
      speak("Hot and boiling! Now grab the spoon and stir mix it clockwise! 🥣🥄");
    }
  }, [boilProgress, cookingStep]);

  // Advance from stir step once circular stirring is complete
  useEffect(() => {
    if (stirIndex >= 8 && cookingStep === "stir") {
      setCookingStep("garnish");
      setGarnishItems([
        { id: 1, emoji: "🌸", x: 45, y: 35, placed: false },
        { id: 2, emoji: "🍓", x: 115, y: 45, placed: false },
        { id: 3, emoji: "🌿", x: 80, y: 95, placed: false }
      ]);
      speak("Perfect consistency! Tap the floating toppings to garnish! 🌸✨");
    }
  }, [stirIndex, cookingStep]);

  // Sleep sound effects & quiet lullaby music box player
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    
    const playSnoreNode = () => {
      try {
        const AudioCtxClass = getAudioContextClass();
        if (!AudioCtxClass) return;
        if (!audioCtx) {
          audioCtx = new AudioCtxClass();
        }
        const ctx = audioCtx;
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        
        const now = ctx.currentTime;
        
        // Inhale (low pitched growl/snore vibration)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(65, now);
        
        const rattle = ctx.createOscillator();
        const rattleGain = ctx.createGain();
        rattle.frequency.value = 16;
        rattleGain.gain.value = 6;
        rattle.connect(rattleGain);
        rattleGain.connect(osc1.frequency);
        
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.12, now + 1.2);
        gain1.gain.linearRampToValueAtTime(0, now + 2.0);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        rattle.start(now);
        osc1.start(now);
        rattle.stop(now + 2.0);
        osc1.stop(now + 2.0);
        
        // Exhale (soft puff/sigh)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(55, now + 2.2);
        
        gain2.gain.setValueAtTime(0, now + 2.2);
        gain2.gain.linearRampToValueAtTime(0.06, now + 3.0);
        gain2.gain.linearRampToValueAtTime(0, now + 4.0);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
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

  const reserveAction = (message = "One thing at a time, sweet shepherd! 🐑") => {
    if (actionLockRef.current) {
      speak(message);
      return false;
    }
    actionLockRef.current = true;
    window.setTimeout(() => {
      actionLockRef.current = false;
    }, 900);
    return true;
  };

  // ─── Web Audio API Sound Synthesizers ─────────────────────────
  const playBaaSound = () => {
    try {
      const AudioCtxClass = getAudioContextClass();
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
      const AudioCtxClass = getAudioContextClass();
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
      const AudioCtxClass = getAudioContextClass();
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
    if (challengeRotationRef.current) {
      clearTimeout(challengeRotationRef.current);
      challengeRotationRef.current = null;
    }
    setCoins((prev) => prev + reward);
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, claimed: true };
        }
        return c;
      })
    );
    speak(`Baa! Challenge completed! You earned 🪙 ${reward} Gold Coins! 🎉`);
    
    // Rotate to a new challenge after 4 seconds
    challengeRotationRef.current = setTimeout(() => {
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
      challengeRotationRef.current = null;
    }, 4000);
  };

  // ─── Actions & Room Interactions ────────────────────────────
  const handlePet = () => {
    if (isSleeping) {
      speak("Shhh... Selah is sweeping right now, baa... Zzz... 💤");
      return;
    }
    if (!reserveAction("Baa! Gentle pets, one at a time. 🐑")) return;
    setLastAction("petting");
    setHappiness((prev) => clampStat(prev + 12));
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
    if (!reserveAction("The bubbles are still settling! 🫧")) return;
    setLastAction("bathing");
    setCleanliness((prev) => clampStat(prev + 30));
    setHappiness((prev) => clampStat(prev + 6));
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
    if (isChasingBall || !reserveAction("Baa! The ball is already flying! ⚽")) return;
    
    setIsChasingBall(true);
    setLastAction("playing");
    speak("Baa! Throw the ball! I'm ready to chase it! ⚽");
    
    setTimeout(() => {
      setIsChasingBall(false);
      setLastAction("none");
      setHappiness((prev) => clampStat(prev + 20));
      setCleanliness((prev) => clampStat(prev - 18));
      setEnergy((prev) => clampStat(prev - 14));
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
      speak("Baa! We need more Gold Coins! Let's do some chores! 🪙");
      return;
    }
    if (!reserveAction("The shopkeeper is packing the last treat! 🛍️")) return;
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
    if (purchasedAccessories.includes(acc)) {
      speak("Baa! That pretty accessory is already in our wardrobe! 🎀");
      return;
    }
    if (coins < cost) {
      speak("Baa! Not enough Gold Coins, shepherd! 🪙");
      return;
    }
    if (!reserveAction("One shiny purchase at a time! 🛍️")) return;
    setCoins((c) => c - cost);
    setPurchasedAccessories((prev) => Array.from(new Set([...prev, acc])));
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
      speak(`Baa! We need 🪙 ${cost} Gold Coins to unlock the ${room}! 🔒`);
      return;
    }
    if (unlockedRooms.includes(room)) {
      travelToRoom(room);
      return;
    }
    setCoins((c) => c - cost);
    setUnlockedRooms((prev) => Array.from(new Set([...prev, room])));
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

    setHappiness((prev) => clampStat(prev + 4));
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
    setSliderPos(0);
    setTemp(30);
    setBoilProgress(0);
    setStirIndex(0);
    setGarnishItems([]);
    speak("Recipe selected! Tap 'CHOP' when the slider is in the green zone! 🔪");
  };

  const handleChopClick = () => {
    // Sweet spot is between 40 and 60
    const inSweetSpot = sliderPos >= 40 && sliderPos <= 60;
    if (inSweetSpot) {
      const next = chopCount + 1;
      setChopCount(next);
      spawnParticles("🔪", 3);
      speak("Perfect chop! 🌟");
      if (next === 3) {
        setCookingStep("stove");
        setTemp(30);
        setBoilProgress(0);
        speak("All chopped! Let's put them on the stove to boil! 🫕🔥");
      }
    } else {
      spawnParticles("❌", 1);
      speak("Missed! Tap when the cursor is in the pink zone! 🎯");
    }
  };

  const handleStoveHeatClick = () => {
    setTemp((t) => Math.min(110, t + 12));
    spawnParticles("🔥", 2);
  };

  const handleStirDirectionClick = (dirIndex: number) => {
    const targetIndex = stirIndex % 4;
    if (dirIndex === targetIndex) {
      const next = stirIndex + 1;
      setStirIndex(next);
      spawnParticles("🌀", 2);
    } else {
      speak("Stir clockwise! Tap the active glowing arrow! 🔄");
    }
  };

  const handleGarnishItemClick = (itemId: number) => {
    setGarnishItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, placed: true } : item));
      const allPlaced = next.every((item) => item.placed);
      if (allPlaced) {
        setCookingStep("done");
        speak("Garnish complete! Selah's meal is ready to be served! 🍽️✨");
      }
      return next;
    });
    spawnParticles("✨", 2);
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

    setHunger((prev) => clampStat(prev + fill));
    setHappiness((prev) => clampStat(prev + happy));
    setEnergy((prev) => clampStat(prev + ene));
    setCoins((c) => c + 10); // Reward for cooking

    spawnParticles("😋", 6);
    playEatingSound();
    speak(`Baa! The ${dishName} was so delicious! Fluffy tummy is full! (+🪙 10 Gold Coins reward) 🍽️✨`);
    
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

  // ─── Vet Clinic Checkup Actions ──────────────────────────────
  const startVetCheckup = () => {
    setIsClinicActive(true);
    setClinicStep("temp");
    setVetTemp(37);
    setSyrupCount(0);
    setSores([
      { id: 1, x: 50, y: 80, treated: false },
      { id: 2, x: 95, y: 130, treated: false },
      { id: 3, x: 135, y: 110, treated: false }
    ]);
    speak("🧑‍⚕️ Vet checkup started! Let's measure Selah's temperature first. 🌡️");
  };

  const handleThermometerStop = () => {
    if (vetTemp >= 37.5 && vetTemp <= 39.5) {
      setClinicStep("bandaid");
      speak("Perfect temperature! Now apply the soothing band-aids to the red sore spots. 🩹");
      spawnParticles("🩹", 3);
    } else {
      speak("Oops, not quite stable! Let's measure again. 🌡️");
    }
  };

  const handleSoreClick = (soreId: number) => {
    setSores((prev) => {
      const next = prev.map((s) => (s.id === soreId ? { ...s, treated: true } : s));
      const allTreated = next.every((s) => s.treated);
      if (allTreated) {
        setClinicStep("syrup");
        speak("All band-aids applied! Now feed Selah 3 spoonfuls of sweet berry cough syrup. 🥣🥄");
      }
      return next;
    });
    spawnParticles("🩹", 2);
  };

  const handleSyrupFeed = () => {
    const nextCount = syrupCount + 1;
    setSyrupCount(nextCount);
    spawnParticles("😋", 2);
    if (nextCount >= 3) {
      setClinicStep("done");
      speak("Mmm, yummy medicine! Selah feels so much better now! 🌟🩺");
    } else {
      speak(`Yummy medicine! (${nextCount}/3 spoonfuls fed) 🥄`);
    }
  };

  const finishClinicCheckup = () => {
    setIsSick(false);
    setIsClinicActive(false);
    setCleanliness(100);
    sickCooldownRef.current = 30;
    setHappiness((h) => clampStat(h + 50));
    setCoins((c) => c + 15);
    speak("Vet clinic treatment complete! Fluffy sheep is cured and happy! (+🪙 15 Gold Coins reward) 🎉🐑🩺");
    spawnParticles("✨", 8);
    progressChallenge("wash", 1);
  };

  // ─── Meadow Walk Actions ─────────────────────────────────────
  const startMeadowWalk = () => {
    if (isSick) {
      speak("Baa... I'm too sick to go for a walk... let's visit the Vet Clinic first! 🤒");
      return;
    }
    if (energy < 25) {
      speak("Baa... I'm too tired to walk... let me sleep first! 🛌💤");
      return;
    }
    setIsWalkingActive(true);
    setWalkProgress(0);
    setLastFoot("none");
    speak("🚶 Meadow Walk started! Alternately tap LEFT and RIGHT foot buttons to walk! 🌳");
  };

  const handleMeadowWalkStep = (foot: "left" | "right") => {
    if (lastFoot === "none" || lastFoot !== foot) {
      setLastFoot(foot);
      setWalkProgress((prev) => {
        const nextProgress = Math.min(prev + 1, 30);
        spawnParticles("🐾", 1);

        if (nextProgress === 10) {
          setCoins((c) => c + 5);
          speak("Look, shepherd! I found 5 Gold Coins hidden in the grass! 🪙✨");
          spawnParticles("🪙", 3);
        } else if (nextProgress === 20) {
          setCoins((c) => c + 5);
          speak("Ooh! Another shiny coin on the path! (+🪙 5 Gold Coins) 🪙✨");
          spawnParticles("🪙", 3);
        } else if (nextProgress === 30) {
          setIsWalkingActive(false);
          setHappiness((h) => clampStat(h + 30));
          setEnergy((e) => clampStat(e - 20));
          setCoins((c) => c + 10);
          speak("Walk finished! That was so refreshing! (+🪙 10 Gold Coins reward) 🚶🌳✨");
          spawnParticles("🎉", 5);
          progressChallenge("play", 1);
        }

        return nextProgress;
      });
    } else {
      speak("Alternate your steps! Tap the other foot! 🚶");
    }
  };

  // ─── Story & Living Room Care Actions ───────────────────────
  const startStoryBook = (mode: StoryMode = "bedtime", bookId: StoryBookId = "peacefulNight") => {
    if (isSleeping && mode === "living") {
      speak("Baa... I can read with you after my nap... Zzz... 📚");
      return;
    }
    setIsReadingStory(true);
    setStoryPage(0);
    setStoryMode(mode);
    setSelectedStoryBook(bookId);
    speak(mode === "bedtime" ? "Baa... please read me a cozy bedtime story, shepherd... 📖" : `Baa! Let's read ${STORY_BOOKS[bookId].title} together! 📚`);
  };

  const handleStoryNext = () => {
    const book = STORY_BOOKS[selectedStoryBook];
    if (storyPage < book.pages.length - 1) {
      setStoryPage((p) => p + 1);
    } else if (storyMode === "bedtime") {
      setIsReadingStory(false);
      setIsSleeping(true);
      setLastAction("sleeping");
      speak("Goodnight, sweet shepherd... Zzz... I love you... 🛌🌙");
      progressChallenge("story", 1);
    } else {
      setIsReadingStory(false);
      setHappiness((value) => clampStat(value + 18));
      setEnergy((value) => clampStat(value + 5));
      setCoins((value) => value + 5);
      spawnParticles("📚", 4);
      speak("Baa! I loved that story. My heart feels cozy and brave! (+🪙 5) 📚✨");
      progressChallenge("story", 1);
    }
  };

  const handleBrushWool = () => {
    if (isSleeping) {
      speak("Baa... brush me when I wake up, please... 💤");
      return;
    }
    if (!reserveAction("Baa! Slow gentle brushing, please. 🪮")) return;
    setCleanliness((value) => clampStat(value + 12));
    setHappiness((value) => clampStat(value + 10));
    setMudFactor((value) => Math.max(0, value - 1));
    spawnParticles("✨", 5);
    speak("Baa! My wool is fluffy and shiny now! 🪮✨");
    progressChallenge("pet", 1);
  };

  const handleSingTogether = () => {
    if (isSleeping) {
      speak("Zzz... sing me a lullaby later... 🎵");
      return;
    }
    if (!reserveAction("Baa! Let me catch the melody first. 🎶")) return;
    setHappiness((value) => clampStat(value + 14));
    setEnergy((value) => clampStat(value - 4));
    spawnParticles("🎵", 6);
    speak("Baa baa baa! Joyful songs make the cottage feel warm! 🎶💖");
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
    if (isSick) {
      return { type: "sad", label: "Sick 🤒" };
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
  const currentStoryBook = STORY_BOOKS[selectedStoryBook];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-2xl mx-auto w-full min-w-0 overflow-x-hidden select-none pb-8 animate-fade-in text-warm-cocoa font-sans relative">
      <div className="absolute inset-x-0 -top-8 h-44 rounded-full bg-gradient-to-r from-rose-200/35 via-amber-100/45 to-sky-200/35 blur-3xl pointer-events-none" />
      
      {/* ─── SCREEN CANVAS VIEWPORT ────────────────────────────── */}
      <div className="relative w-full min-w-0 h-[390px] sm:h-[420px] rounded-[30px] sm:rounded-[42px] overflow-hidden border-[4px] sm:border-[6px] border-white/80 shadow-[0_20px_60px_rgba(120,86,62,0.2)] sm:shadow-[0_24px_80px_rgba(120,86,62,0.22)] flex flex-col justify-between p-3 sm:p-5 bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 ring-1 ring-rose-100/80">
        <div className="absolute inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.58),transparent_24%),radial-gradient(circle_at_82%_8%,rgba(253,186,116,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_42%)]" />
        <div className="absolute left-1/2 top-2 sm:top-3 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/70 bg-white/80 px-3 sm:px-4 py-1 text-[8px] sm:text-[9px] font-serif font-black tracking-[0.16em] sm:tracking-[0.22em] text-[#7b5a4a] shadow-sm backdrop-blur-md pointer-events-none">
          SELAH&apos;S COTTAGE
        </div>
        
        {/* ROOM BACKGROUND SVGS (IMPROVED GRAPHICS) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          
          {/* A. LIVING ROOM */}
          {activeRoom === "living" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="livingWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF9F2" />
                  <stop offset="100%" stopColor="#F5E6D3" />
                </linearGradient>
                <linearGradient id="woodFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C29D84" />
                  <stop offset="100%" stopColor="#8C6246" />
                </linearGradient>
                <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(249,115,22,0.4)" />
                  <stop offset="100%" stopColor="rgba(249,115,22,0)" />
                </radialGradient>
              </defs>
              {/* Stripes Wall */}
              <rect width="400" height="300" fill="url(#livingWall)" />
              
              {/* Window & Curtains */}
              <rect x="140" y="20" width="120" height="90" rx="10" fill="#E0F2FE" stroke="#B0BEC5" strokeWidth="3" />
              {/* Sunset inside window */}
              <path d="M 141 85 Q 200 60 259 85 L 259 109 L 141 109 Z" fill="#FFA726" opacity="0.6" />
              <circle cx="200" cy="70" r="16" fill="#FEE2E2" opacity="0.8" />
              <line x1="200" y1="20" x2="200" y2="110" stroke="#B0BEC5" strokeWidth="1.5" />
              <line x1="140" y1="65" x2="260" y2="65" stroke="#B0BEC5" strokeWidth="1.5" />
              
              {/* Curtains with tie backs */}
              <path d="M 140 20 Q 165 65 140 110 L 125 110 L 125 20 Z" fill="#FFCDD2" />
              <path d="M 260 20 Q 235 65 260 110 L 275 110 L 275 20 Z" fill="#FFCDD2" />
              
              {/* Brick Fireplace */}
              <rect x="35" y="115" width="90" height="95" rx="8" fill="#B71C1C" stroke="#7F0000" strokeWidth="3" />
              {/* Arch Opening */}
              <path d="M 45 210 L 45 150 Q 80 135 115 150 L 115 210 Z" fill="#1A0A0A" />
              {/* Fireglow backdrop */}
              <circle cx="80" cy="185" r="30" fill="url(#fireGlow)" className="animate-pulse" />
              {/* Fire coals & logs */}
              <rect x="58" y="195" width="44" height="15" rx="3" fill="#3E2723" />
              <circle cx="72" cy="190" r="10" fill="#FF3D00" className="animate-pulse" />
              <circle cx="88" cy="192" r="8" fill="#FF9100" className="animate-pulse" style={{ animationDelay: "0.3s" }} />
              <polygon points="68,195 80,165 92,195" fill="#FFEA00" className="animate-pulse" style={{ animationDelay: "0.15s" }} />

              {/* Bookshelf on Right */}
              <rect x="295" y="80" width="85" height="130" rx="4" fill="#5D4037" stroke="#3E2723" strokeWidth="2.5" />
              <line x1="295" y1="125" x2="380" y2="125" stroke="#3E2723" strokeWidth="3" />
              <line x1="295" y1="168" x2="380" y2="168" stroke="#3E2723" strokeWidth="3" />
              {/* Books */}
              <rect x="305" y="95" width="10" height="30" fill="#E53935" />
              <rect x="317" y="100" width="12" height="25" fill="#3949AB" />
              <rect x="331" y="92" width="10" height="33" fill="#43A047" />
              <rect x="310" y="138" width="15" height="30" fill="#FFB300" transform="rotate(10 310 138)" />
              <rect x="335" y="138" width="12" height="30" fill="#00ACC1" />
              <rect x="350" y="143" width="10" height="25" fill="#D81B60" />

              {/* Floor Wood/Baseboard */}
              <line x1="0" y1="210" x2="400" y2="210" stroke="#8D6E63" strokeWidth="6" />
              <rect y="210" width="400" height="90" fill="url(#woodFloor)" />
              {/* Floor Wood Lines */}
              <line x1="0" y1="240" x2="400" y2="240" stroke="#5D4037" strokeWidth="1" opacity="0.25" />
              <line x1="0" y1="270" x2="400" y2="270" stroke="#5D4037" strokeWidth="1" opacity="0.25" />
              
              {/* Cozy Rug */}
              <ellipse cx="200" cy="250" rx="90" ry="32" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="2" opacity="0.95" />
              <ellipse cx="200" cy="250" rx="80" ry="26" fill="#FFEBEE" opacity="0.6" />
              <ellipse cx="200" cy="250" rx="60" ry="18" fill="#FFCDD2" opacity="0.3" />
            </svg>
          )}

          {/* B. KITCHEN */}
          {activeRoom === "kitchen" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="kitchenWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F9F6F0" />
                  <stop offset="100%" stopColor="#EDE8F5" />
                </linearGradient>
                <linearGradient id="kitchenFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DFD8C9" />
                  <stop offset="100%" stopColor="#CDAF95" />
                </linearGradient>
                <linearGradient id="counterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ECEFF1" />
                  <stop offset="100%" stopColor="#B0BEC5" />
                </linearGradient>
              </defs>
              {/* Wall */}
              <rect width="400" height="300" fill="url(#kitchenWall)" />
              
              {/* Kitchen Window */}
              <rect x="140" y="25" width="120" height="80" rx="10" fill="#E0F7FA" stroke="#B0BEC5" strokeWidth="4" />
              {/* Window Landscape */}
              <path d="M 142 90 Q 200 65 258 90" fill="#81C784" opacity="0.7" />
              <circle cx="210" cy="50" r="10" fill="#FFF" opacity="0.5" />
              <line x1="200" y1="25" x2="200" y2="105" stroke="#B0BEC5" strokeWidth="2" />
              <line x1="140" y1="65" x2="260" y2="65" stroke="#B0BEC5" strokeWidth="2" />

              {/* Wooden shelves on the right wall */}
              <rect x="290" y="45" width="90" height="6" rx="2" fill="#8D6E63" />
              {/* Plant on shelf */}
              <path d="M 315 45 L 320 32 L 340 32 L 345 45 Z" fill="#A1887F" />
              <path d="M 318 32 Q 330 15 330 32 Q 342 15 336 32 Z" fill="#81C784" />
              {/* Cups on shelf */}
              <rect x="352" y="33" width="12" height="12" rx="2" fill="#FF8A80" />
              <rect x="368" y="33" width="12" height="12" rx="2" fill="#FFD54F" />

              {/* Floor */}
              <line x1="0" y1="200" x2="400" y2="200" stroke="#8D6E63" strokeWidth="6" />
              <rect y="200" width="400" height="100" fill="url(#kitchenFloor)" />
              {/* Wood Plank Lines */}
              <line x1="0" y1="230" x2="400" y2="230" stroke="#795548" strokeWidth="1" opacity="0.3" />
              <line x1="0" y1="260" x2="400" y2="260" stroke="#795548" strokeWidth="1" opacity="0.3" />
              <line x1="0" y1="290" x2="400" y2="290" stroke="#795548" strokeWidth="1" opacity="0.3" />

              {/* Kitchen Counter Cabinet */}
              <rect x="20" y="130" width="105" height="70" rx="3" fill="url(#counterGrad)" stroke="#78909C" strokeWidth="2.5" />
              {/* Stove base */}
              <rect x="135" y="132" width="110" height="68" rx="3" fill="#37474F" stroke="#263238" strokeWidth="2.5" />
              {/* Burners */}
              <ellipse cx="165" cy="132" rx="16" ry="3" fill="#212121" />
              <ellipse cx="215" cy="132" rx="16" ry="3" fill="#212121" />
              <ellipse cx="165" cy="132" rx="12" ry="2" fill="#E65100" opacity="0.6" className="animate-pulse" />
              
              {/* Sink basin on cabinet */}
              <rect x="40" y="125" width="60" height="6" rx="2" fill="#78909C" />
              <path d="M 65 125 L 65 110 Q 65 105 70 105 L 75 105" fill="none" stroke="#B0BEC5" strokeWidth="2.5" />

              {/* Decorative Rug */}
              <ellipse cx="200" cy="245" rx="75" ry="22" fill="#E8F5E9" stroke="#C8E6C9" strokeWidth="2" opacity="0.9" />
              <ellipse cx="200" cy="245" rx="65" ry="16" fill="#A5D6A7" opacity="0.4" />
            </svg>
          )}

          {/* C. BEDROOM */}
          {activeRoom === "bedroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="dayBedWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF8F5" />
                  <stop offset="100%" stopColor="#EADEC9" />
                </linearGradient>
                <linearGradient id="nightBedWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B132B" />
                  <stop offset="100%" stopColor="#1C2541" />
                </linearGradient>
                <linearGradient id="dayBedFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E2D4C1" />
                  <stop offset="100%" stopColor="#C4B49F" />
                </linearGradient>
                <linearGradient id="nightBedFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(254,240,138,0.55)" />
                  <stop offset="100%" stopColor="rgba(254,240,138,0)" />
                </radialGradient>
              </defs>
              {/* Wall */}
              <rect width="400" height="300" fill={isSleeping ? "url(#nightBedWall)" : "url(#dayBedWall)"} />

              {/* Night Sky / Day Sky Window */}
              <rect x="140" y="25" width="120" height="80" rx="10" fill={isSleeping ? "#020617" : "#BAE6FD"} stroke={isSleeping ? "#334155" : "#94A3B8"} strokeWidth="3" />
              {isSleeping ? (
                // Stars & Moon
                <>
                  <circle cx="210" cy="50" r="10" fill="#FEF08A" />
                  <circle cx="206" cy="48" r="9" fill="#020617" />
                  <circle cx="160" cy="45" r="1" fill="#FFF" opacity="0.8" className="animate-pulse" />
                  <circle cx="175" cy="70" r="1.5" fill="#FFF" opacity="0.6" className="animate-pulse" style={{ animationDelay: "1s" }} />
                  <circle cx="230" cy="65" r="1" fill="#FFF" opacity="0.9" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
                </>
              ) : (
                // Sun & Clouds
                <>
                  <circle cx="165" cy="48" r="12" fill="#F59E0B" />
                  <path d="M 210 65 Q 220 55 230 65 Q 240 65 245 70 Q 230 80 210 70 Z" fill="#FFF" opacity="0.8" />
                </>
              )}
              <line x1="200" y1="25" x2="200" y2="105" stroke={isSleeping ? "#1e293b" : "#94A3B8"} strokeWidth="1.5" />
              <line x1="140" y1="65" x2="260" y2="65" stroke={isSleeping ? "#1e293b" : "#94A3B8"} strokeWidth="1.5" />

              {/* Bedside table & Lamp */}
              <rect x="40" y="145" width="55" height="65" rx="6" fill={isSleeping ? "#1E293B" : "#B0A898"} stroke={isSleeping ? "#0F172A" : "#8C8270"} strokeWidth="1.5" />
              <rect x="52" y="175" width="31" height="8" rx="2" fill={isSleeping ? "#0F172A" : "#5C5446"} />
              
              {/* Lamp */}
              <line x1="68" y1="145" x2="68" y2="130" stroke={isSleeping ? "#334155" : "#D97706"} strokeWidth="3" />
              <path d="M 52 130 L 84 130 L 76 112 L 60 112 Z" fill={isSleeping ? "#FEF08A" : "#EF4444"} stroke={isSleeping ? "#FCD34D" : "#B91C1C"} strokeWidth="1" />
              {/* Lamp Glow effect */}
              {isSleeping && (
                <circle cx="68" cy="115" r="45" fill="url(#lampGlow)" className="animate-pulse" />
              )}

              {/* Floor */}
              <line x1="0" y1="210" x2="400" y2="210" stroke={isSleeping ? "#0F172A" : "#8C7B65"} strokeWidth="6" />
              <rect y="210" width="400" height="90" fill={isSleeping ? "url(#nightBedFloor)" : "url(#dayBedFloor)"} />
              {/* Floor wood lines */}
              <line x1="0" y1="240" x2="400" y2="240" stroke={isSleeping ? "#020617" : "#9F8E7C"} strokeWidth="1" opacity="0.3" />
              <line x1="0" y1="270" x2="400" y2="270" stroke={isSleeping ? "#020617" : "#9F8E7C"} strokeWidth="1" opacity="0.3" />

              {/* Premium Bed frame */}
              {/* Wooden headboard */}
              <rect x="330" y="130" width="12" height="80" rx="3" fill={isSleeping ? "#3E2723" : "#8D6E63"} />
              {/* Wooden base */}
              <rect x="200" y="165" width="140" height="45" rx="8" fill={isSleeping ? "#334155" : "#F472B6"} stroke={isSleeping ? "#1E293B" : "#DB2777"} strokeWidth="2.5" />
              {/* Pillow */}
              <rect x="290" y="152" width="38" height="22" rx="6" fill="#FFFFFF" stroke={isSleeping ? "#475569" : "#E2E8F0"} strokeWidth="1.5" />
            </svg>
          )}

          {/* D. BATHROOM */}
          {activeRoom === "bathroom" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="bathWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0F7FA" />
                  <stop offset="100%" stopColor="#B2EBF2" />
                </linearGradient>
                <linearGradient id="bathFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#80DEEA" />
                  <stop offset="100%" stopColor="#00ACC1" />
                </linearGradient>
                <linearGradient id="tubGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#ECEFF1" />
                </linearGradient>
              </defs>
              {/* Wall */}
              <rect width="400" height="300" fill="url(#bathWall)" />
              {/* Tiled grid overlay on wall */}
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={i * 50} y1="0" x2={i * 50} y2="200" stroke="#80DEEA" strokeWidth="1" opacity="0.4" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} y1={i * 40} x1="0" y2={i * 40} x2="400" stroke="#80DEEA" strokeWidth="1" opacity="0.4" />
              ))}
              
              {/* Round Mirror */}
              <circle cx="200" cy="70" r="35" fill="#E0F7FA" stroke="#CFD8DC" strokeWidth="4" />
              <path d="M 170 85 C 190 90 220 80 230 60" fill="none" stroke="#FFF" strokeWidth="2.5" opacity="0.8" />

              {/* Shelf with bath gels */}
              <rect x="40" y="70" width="60" height="5" rx="1.5" fill="#B0BEC5" />
              <rect x="50" y="52" width="12" height="18" rx="2" fill="#FF8A80" />
              <rect x="68" y="48" width="10" height="22" rx="2" fill="#80D8FF" />
              <rect x="82" y="55" width="10" height="15" rx="2" fill="#B9F6CA" />

              {/* Floor */}
              <line x1="0" y1="200" x2="400" y2="200" stroke="#00838F" strokeWidth="6" />
              <rect y="200" width="400" height="100" fill="url(#bathFloor)" />
              {/* Floor tile grid */}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={i} x1={i * 50 - 50} y1="200" x2={i * 50} y2="300" stroke="#00838F" strokeWidth="1" opacity="0.3" />
              ))}

              {/* Bathtub shadow */}
              <ellipse cx="200" cy="235" rx="100" ry="18" fill="#006064" opacity="0.25" />

              {/* Detailed Bathtub */}
              <path d="M 90 170 C 90 230 310 230 310 170 Z" fill="url(#tubGrad)" stroke="#B0BEC5" strokeWidth="2" />
              <rect x="80" y="160" width="240" height="12" rx="6" fill="#FFFFFF" stroke="#B0BEC5" strokeWidth="1.5" />
              
              {/* Tap & Shower head */}
              <path d="M 115 160 L 115 130 Q 115 125 122 125 L 128 125" fill="none" stroke="#CFD8DC" strokeWidth="4.5" strokeLinecap="round" />
              <polygon points="126,120 134,125 126,130" fill="#90A4AE" />

              {/* Bubbles rising */}
              <circle cx="160" cy="140" r="5" fill="#FFF" opacity="0.6" stroke="#80D8FF" strokeWidth="0.5" className="animate-bounce" />
              <circle cx="260" cy="130" r="7" fill="#FFF" opacity="0.5" stroke="#80D8FF" strokeWidth="0.5" className="animate-bounce" style={{ animationDelay: "0.5s", animationDuration: "3s" }} />
              <circle cx="210" cy="148" r="4" fill="#FFF" opacity="0.7" stroke="#80D8FF" strokeWidth="0.5" className="animate-bounce" style={{ animationDelay: "1s", animationDuration: "2.5s" }} />
            </svg>
          )}

          {/* E. BACKYARD */}
          {activeRoom === "backyard" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BAE6FD" />
                  <stop offset="100%" stopColor="#E0F2FE" />
                </linearGradient>
                <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A7F3D0" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6EE7B7" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              {/* Sky */}
              <rect width="400" height="300" fill="url(#skyGrad)" />
              
              {/* Sun with Rays */}
              <circle cx="340" cy="50" r="24" fill="#FCD34D" opacity="0.9" />
              <circle cx="340" cy="50" r="30" fill="#FDE047" opacity="0.3" className="animate-pulse" />

              {/* Clouds */}
              <g opacity="0.85">
                <path d="M 50 60 Q 60 50 75 55 Q 85 45 95 55 Q 105 55 110 65 L 45 65 Z" fill="#FFFFFF" />
                <path d="M 230 45 Q 240 35 255 40 Q 265 30 275 40 Q 285 40 290 50 L 225 50 Z" fill="#FFFFFF" opacity="0.7" />
              </g>

              {/* Distant Hills */}
              <path d="M -30 210 Q 110 130 260 210 Q 340 170 440 220 L 440 300 L -30 300 Z" fill="url(#hill1)" />
              
              {/* Wooden Fence */}
              {Array.from({ length: 7 }).map((_, i) => (
                <g key={i} transform={`translate(${i * 65 - 10}, 175)`}>
                  <rect x="0" y="0" width="12" height="45" rx="1" fill="#D7CCC8" stroke="#A1887F" strokeWidth="1" />
                  <polygon points="0,0 6,-8 12,0" fill="#D7CCC8" stroke="#A1887F" strokeWidth="1" />
                </g>
              ))}
              <rect x="0" y="190" width="400" height="6" fill="#D7CCC8" stroke="#A1887F" strokeWidth="1" />
              <rect x="0" y="205" width="400" height="6" fill="#D7CCC8" stroke="#A1887F" strokeWidth="1" />

              {/* Foreground Hills */}
              <path d="M -30 230 Q 90 170 230 240 Q 320 190 440 245 L 440 300 L -30 300 Z" fill="url(#hill2)" opacity="0.95" />
              
              {/* Little flowers in the field */}
              <circle cx="60" cy="255" r="2.5" fill="#FFF" />
              <circle cx="58" cy="253" r="1.5" fill="#FCD34D" />
              <circle cx="62" cy="257" r="1.5" fill="#FCD34D" />
              
              <circle cx="220" cy="265" r="3" fill="#F472B6" />
              <circle cx="218" cy="263" r="1.5" fill="#FDE047" />

              <circle cx="150" cy="245" r="2" fill="#FDE047" />
              <circle cx="280" cy="270" r="2.5" fill="#FFF" />
            </svg>
          )}

          {/* F. VET CLINIC */}
          {activeRoom === "vet" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="clinicWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E0F2F1" />
                  <stop offset="100%" stopColor="#B2DFDB" />
                </linearGradient>
                <linearGradient id="clinicFloor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#80CBC4" />
                  <stop offset="100%" stopColor="#00796B" />
                </linearGradient>
                <linearGradient id="tableGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ECEFF1" />
                  <stop offset="100%" stopColor="#CFD8DC" />
                </linearGradient>
              </defs>
              {/* Wall */}
              <rect width="400" height="300" fill="url(#clinicWall)" />
              {/* Grid overlay for medical vibe */}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={i} x1={i * 70} y1="0" x2={i * 70} y2="200" stroke="#80CBC4" strokeWidth="1" opacity="0.35" />
              ))}
              {Array.from({ length: 4 }).map((_, i) => (
                <line key={i} y1={i * 50} x1="0" y2={i * 50} x2="400" stroke="#80CBC4" strokeWidth="1" opacity="0.35" />
              ))}

              {/* Red Cross Medical Sign */}
              <circle cx="200" cy="65" r="28" fill="#FFF" stroke="#E53935" strokeWidth="3" />
              <rect x="194" y="47" width="12" height="36" rx="2" fill="#E53935" />
              <rect x="182" y="59" width="36" height="12" rx="2" fill="#E53935" />

              {/* Vet Medical cabinet with tools */}
              <rect x="30" y="80" width="70" height="120" rx="4" fill="#90A4AE" stroke="#546E7A" strokeWidth="2.5" />
              <line x1="30" y1="120" x2="100" y2="120" stroke="#546E7A" strokeWidth="2" />
              <line x1="30" y1="160" x2="100" y2="160" stroke="#546E7A" strokeWidth="2" />
              {/* Medicine jars inside cabinet glass view */}
              <rect x="40" y="92" width="10" height="18" rx="1.5" fill="#FF8A80" />
              <rect x="55" y="90" width="12" height="20" rx="1.5" fill="#A7FFEB" />
              <rect x="72" y="95" width="10" height="15" rx="1.5" fill="#FFE082" />
              <rect x="45" y="132" width="12" height="18" rx="1.5" fill="#EA80FC" />
              <rect x="65" y="130" width="15" height="22" rx="1.5" fill="#80D8FF" />

              {/* Floor */}
              <line x1="0" y1="200" x2="400" y2="200" stroke="#004D40" strokeWidth="6" />
              <rect y="200" width="400" height="100" fill="url(#clinicFloor)" />

              {/* Exam Table */}
              <rect x="120" y="180" width="160" height="35" rx="6" fill="url(#tableGrad)" stroke="#B0BEC5" strokeWidth="2" />
              <rect x="135" y="215" width="15" height="40" fill="#78909C" />
              <rect x="250" y="215" width="15" height="40" fill="#78909C" />

              {/* Stethoscope hanging */}
              <path d="M 330 60 L 330 90 Q 330 110 345 110 Q 360 110 360 90 L 360 60" fill="none" stroke="#37474F" strokeWidth="3" strokeLinecap="round" />
              <circle cx="345" cy="118" r="8" fill="#CFD8DC" stroke="#37474F" strokeWidth="2" />
            </svg>
          )}

          {/* G. MEADOW TRAIL */}
          {activeRoom === "meadow" && (
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="meadowSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="100%" stopColor="#bae6fd" />
                </linearGradient>
                <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" />
                  <stop offset="100%" stopColor="#15803D" />
                </linearGradient>
                <linearGradient id="trailGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D7CCC8" />
                  <stop offset="100%" stopColor="#B0AF9E" />
                </linearGradient>
              </defs>
              {/* Sky */}
              <rect width="400" height="300" fill="url(#meadowSky)" />
              
              {/* Sunbeam */}
              <polygon points="0,0 120,0 280,300 0,300" fill="#FFF" opacity="0.12" />

              {/* Distant Trees */}
              <g opacity="0.75">
                <circle cx="50" cy="160" r="30" fill="#166534" />
                <circle cx="90" cy="155" r="25" fill="#14532D" />
                <circle cx="330" cy="160" r="35" fill="#166534" />
                <circle cx="370" cy="150" r="30" fill="#14532D" />
              </g>

              {/* Meadow Field Grass */}
              <path d="M -20 180 Q 120 150 220 185 Q 310 160 420 180 L 420 300 L -20 300 Z" fill="url(#grassGrad)" />

              {/* Winding Sandy Walking Trail */}
              <path d="M 80 300 Q 150 240 200 210 T 260 172 L 275 174 Q 220 215 170 248 T 130 300 Z" fill="url(#trailGrad)" />

              {/* Clouds drifting */}
              <path d="M 280 60 Q 295 48 315 52 Q 325 40 338 52 Q 350 52 355 64 L 275 64 Z" fill="#FFFFFF" opacity="0.9" className="animate-pulse" />
              
              {/* Pretty flowers in the meadow */}
              <circle cx="45" cy="225" r="2" fill="#FEE2E2" />
              <circle cx="43" cy="223" r="1" fill="#FEF08A" />
              <circle cx="47" cy="227" r="1" fill="#FEF08A" />

              <circle cx="310" cy="245" r="3" fill="#FDA4AF" />
              <circle cx="308" cy="243" r="1.5" fill="#FFF" />
              <circle cx="312" cy="247" r="1.5" fill="#FFF" />

              <circle cx="210" cy="275" r="2.5" fill="#C084FC" />
              <circle cx="208" cy="273" r="1" fill="#FEF08A" />

              {/* Flying Butterflies */}
              <g className="animate-bounce" style={{ animationDuration: "3s" }}>
                <path d="M 70 90 L 76 86 L 76 94 Z" fill="#F472B6" />
                <path d="M 76 90 L 82 86 L 82 94 Z" fill="#F472B6" />
              </g>
              <g className="animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
                <path d="M 290 100 L 296 96 L 296 104 Z" fill="#60A5FA" />
                <path d="M 296 100 L 302 96 L 302 104 Z" fill="#60A5FA" />
              </g>
            </svg>
          )}
        </div>

        {/* TOP PANEL HUD OVERLAYS */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 z-10 relative pt-7 sm:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-900 bg-white/80 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1 shadow-[0_8px_24px_rgba(120,86,62,0.14)] select-none border border-amber-200/80 ring-2 ring-white/35">
              ✨ 🪙 {coins} Coins
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
            {/* Expression Indicator */}
            <span className="text-[8px] sm:text-[8.5px] uppercase font-bold px-2 sm:px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm select-none text-[#6b4b3a]">
              Selah: {expression.label}
            </span>

            {/* Challenges board */}
            <button
              onClick={() => setIsChallengesOpen(true)}
              className="relative p-2 rounded-full bg-white/85 backdrop-blur-md border border-white/80 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa hover:bg-rose-50"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {hasUnclaimedChallenges && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping border border-white" />
              )}
            </button>

            {/* Shop */}
            <button
              onClick={() => setIsShopOpen(true)}
              className="p-2 rounded-full bg-white/85 backdrop-blur-md border border-white/80 shadow-sm active:scale-90 transition-all cursor-pointer text-warm-cocoa hover:bg-amber-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>

            {/* Map */}
            <button
              onClick={() => setIsMapOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-400 to-amber-300 hover:from-rose-500 hover:to-amber-400 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-[0_8px_20px_rgba(244,114,182,0.28)] active:scale-90 transition-all cursor-pointer border border-white/50"
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* ROOM ACTIONS FLOATING BAR (LAPTPOP & MOBILE-SAFE) */}
        {!isCooking && (
          <div 
            className="absolute left-3 right-3 top-[64px] sm:left-4 sm:right-auto sm:top-16 z-30 flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pointer-events-auto pr-1 py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {activeRoom === "living" && (
              <>
                <button
                  onClick={() => startStoryBook("living", "psalm23")}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  📚 Read Books
                </button>
                <button
                  onClick={handleBrushWool}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  🪮 Brush Wool
                </button>
                <button
                  onClick={handleSingTogether}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-violet-400 hover:bg-violet-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                >
                  🎵 Sing
                </button>
              </>
            )}

            {activeRoom === "kitchen" && (
              <>
                <button
                  onClick={() => {
                    setIsCooking(true);
                    setCookingStep("choose");
                  }}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Recipe Book
                </button>
                <button
                  onClick={() => setIsFridgeOpen((prev) => !prev)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl border-2 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                    isFridgeOpen
                      ? "bg-rose-50 border-rose-300 text-rose-500"
                      : "bg-[#4B3A3A] border-stone-800 text-white"
                  }`}
                >
                  🚪 {isFridgeOpen ? "Close Fridge" : "Open Fridge"}
                </button>
              </>
            )}

            {activeRoom === "bedroom" && (
              <>
                {!isSleeping ? (
                  <button
                    onClick={() => startStoryBook("bedtime", "peacefulNight")}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    📖 Read Story
                  </button>
                ) : (
                  <button
                    onClick={handleWakeUp}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    💡 Wake Up
                  </button>
                )}
              </>
            )}

            {activeRoom === "bathroom" && (
              <button
                onClick={handleWash}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                🛁 Give Bath
              </button>
            )}

            {activeRoom === "backyard" && (
              <button
                onClick={handlePlayBall}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-400 hover:bg-red-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                ⚽ Play Fetch
              </button>
            )}

            {activeRoom === "vet" && (
              <button
                onClick={startVetCheckup}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                🩺 Start Checkup
              </button>
            )}

            {activeRoom === "meadow" && (
              <button
                onClick={startMeadowWalk}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                🚶 Go for Walk
              </button>
            )}
          </div>
        )}

        {/* OPEN FRIDGE OVERLAY SHELF (RIGHT-ALIGNED) */}
        <AnimatePresence>
          {isFridgeOpen && activeRoom === "kitchen" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-4 top-16 bg-white/95 backdrop-blur-sm border border-stone-250 p-3 rounded-3xl shadow-xl flex flex-col gap-2 w-48 text-left z-30 pointer-events-auto"
            >
              <div className="flex justify-between items-center border-b pb-1">
                <span className="text-[8.5px] uppercase font-bold text-warm-cocoa/40 tracking-wider">Fridge Shelf Stock</span>
                <button
                  onClick={() => setIsFridgeOpen(false)}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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

        {/* DECORATIVE TOY BALL FOR FETCH ANIMATION */}
        {activeRoom === "backyard" && (
          <div className="absolute left-10 bottom-16 z-30 pointer-events-none">
            <motion.div
              animate={isChasingBall ? { x: [0, 180, 0], y: [0, -60, 0], rotate: [0, 360, 0], opacity: [0, 1, 1, 0] } : { opacity: 0 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="w-9 h-9 rounded-full bg-red-400 border border-red-500 flex items-center justify-center text-lg shadow-md"
            >
              ⚽
            </motion.div>
          </div>
        )}

        {/* VIRTUAL LAMB CANVAS DOCK */}
        <div className="absolute inset-x-0 bottom-24 sm:bottom-20 flex justify-center items-center h-32 sm:h-36 z-35 pointer-events-none">
          
          {/* Dialogue speech bubble */}
          <AnimatePresence>
            {dialogue && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 10 }}
                className="absolute -top-10 sm:-top-20 bg-white/95 backdrop-blur-md border-2 border-rose-200 text-[#4B3A3A] px-3 sm:px-4 py-2.5 sm:py-3 rounded-[22px] sm:rounded-[24px] shadow-[0_14px_38px_rgba(120,86,62,0.18)] text-center max-w-[210px] sm:max-w-[240px] text-[9.5px] sm:text-[10.5px] font-bold z-48 pointer-events-auto ring-4 ring-white/40"
              >
                <div className="relative text-center">
                  {dialogue}
                  {/* Speech bubble tail */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-rose-200 rotate-45" />
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
            className={`w-32 h-32 sm:w-36 sm:h-36 relative transition-all duration-300 focus:outline-none pointer-events-auto ${
              lastAction === "petting" ? "scale-105" : ""
            } ${lastAction === "feeding" ? "origin-bottom animate-bounce" : ""} ${
              isSleeping && activeRoom === "bedroom" ? "translate-x-24 -translate-y-6 rotate-[75deg] scale-85 opacity-95" : ""
            } ${activeRoom === "bathroom" ? "translate-y-4" : ""}`}
            style={{ animationDuration: "0.6s" }}
          >
            <svg viewBox="0 0 200 200" width="100%" height="100%" className="drop-shadow-[0_18px_18px_rgba(82,52,38,0.18)]">
              <defs>
                <radialGradient id="selahWool" cx="45%" cy="28%" r="78%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="62%" stopColor="#FFF7ED" />
                  <stop offset="100%" stopColor="#F5D9C8" />
                </radialGradient>
                <linearGradient id="selahFace" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isSick ? "#EFFDF3" : "#FFF4EF"} />
                  <stop offset="100%" stopColor={isSick ? "#CDEFD8" : "#FFD9D0"} />
                </linearGradient>
                <linearGradient id="selahPink" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFE4E6" />
                  <stop offset="100%" stopColor="#FDA4AF" />
                </linearGradient>
                <filter id="softWoolShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#9A6B57" floodOpacity="0.18" />
                </filter>
              </defs>
              <ellipse cx="100" cy="178" rx="58" ry="11" fill="#6B4B3A" opacity="0.14" />
              {/* STINK LINES (cleanliness < 30) */}
              {cleanliness < 30 && (
                <g className="animate-pulse">
                  <path d="M 75 60 Q 70 50 75 40 Q 80 30 75 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 100 55 Q 95 45 100 35 Q 105 25 100 15" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M 125 60 Q 120 50 125 40 Q 130 30 125 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </g>
              )}

              {/* legs */}
              <rect x="78" y="162" width="10" height="16" rx="4" fill="url(#selahPink)" stroke="#EBC8BC" strokeWidth={1.5} />
              <rect x="112" y="162" width="10" height="16" rx="4" fill="url(#selahPink)" stroke="#EBC8BC" strokeWidth={1.5} />

              {/* body wool */}
              <g filter="url(#softWoolShadow)">
                <circle cx="82" cy="144" r="15" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="100" cy="148" r="17" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="118" cy="144" r="15" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="90" cy="136" r="14" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="110" cy="136" r="14" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="100" cy="142" r="18" fill="url(#selahWool)" />
                <circle cx="90" cy="144" r="12" fill="url(#selahWool)" />
                <circle cx="110" cy="144" r="12" fill="url(#selahWool)" />
              </g>

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
                <path d="M 62 107 Q 44 106 48 115 Q 56 116 62 111 Z" fill="url(#selahPink)" opacity="0.7" />
              </g>
              <g>
                <path d="M 134 105 Q 160 102 154 118 Q 142 120 134 112 Z" fill="#FFF0F0" stroke="#F0D3D3" strokeWidth={1.5} />
                <path d="M 138 107 Q 156 106 152 115 Q 144 116 138 111 Z" fill="url(#selahPink)" opacity="0.7" />
              </g>

              {/* face */}
              <ellipse cx="100" cy="115" rx="36" ry="30" fill="url(#selahFace)" stroke="#F0D3D3" strokeWidth={2} />
              <circle cx="76" cy="122" r="7" fill={isSick ? "#81C784" : "#FFB7B7"} opacity="0.6" />
              <circle cx="124" cy="122" r="7" fill={isSick ? "#81C784" : "#FFB7B7"} opacity="0.6" />

              {/* Thermometer in mouth if sick */}
              {isSick && (
                <g transform="translate(100, 118) scale(0.65) rotate(-15)">
                  <rect x="-2" y="-12" width="5" height="24" rx="2.5" fill="#ECEFF1" stroke="#37474F" strokeWidth="1" />
                  <rect x="-1" y="2" width="3" height="8" fill="#E53935" />
                  <circle cx="0.5" cy="10" r="3.5" fill="#E53935" stroke="#37474F" strokeWidth="1" />
                </g>
              )}

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
              <g filter="url(#softWoolShadow)">
                <circle cx="86" cy="94" r="10" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="100" cy="88" r="12" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="114" cy="94" r="10" fill="url(#selahWool)" stroke="#E6D3D3" strokeWidth={1.5} />
                <circle cx="94" cy="94" r="10" fill="url(#selahWool)" />
                <circle cx="106" cy="94" r="10" fill="url(#selahWool)" />
                <circle cx="100" cy="96" r="11" fill="url(#selahWool)" />
              </g>

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

              {accessory === "glasses" && (
                <g>
                  {/* Left frame */}
                  <circle cx="82" cy="112" r="11" fill="none" stroke="#8B5A2B" strokeWidth={2} />
                  {/* Left shine */}
                  <path d="M 76 106 Q 84 106 80 114" fill="none" stroke="white" strokeWidth={1} opacity={0.65} />
                  {/* Right frame */}
                  <circle cx="118" cy="112" r="11" fill="none" stroke="#8B5A2B" strokeWidth={2} />
                  {/* Right shine */}
                  <path d="M 112 106 Q 120 106 116 114" fill="none" stroke="white" strokeWidth={1} opacity={0.65} />
                  {/* Bridge */}
                  <path d="M 93 112 Q 100 107 107 112" fill="none" stroke="#8B5A2B" strokeWidth={2} />
                  {/* Left arm */}
                  <path d="M 71 112 Q 62 108 58 110" fill="none" stroke="#8B5A2B" strokeWidth={1.5} />
                  {/* Right arm */}
                  <path d="M 129 112 Q 138 108 142 110" fill="none" stroke="#8B5A2B" strokeWidth={1.5} />
                </g>
              )}

              {accessory === "sunhat" && (
                <g>
                  {/* Dome of hat */}
                  <path d="M 80 82 C 80 54, 120 54, 120 82 Z" fill="#EADCA6" stroke="#C4A484" strokeWidth={1} />
                  {/* Ribbon band */}
                  <path d="M 80 80 Q 100 86 120 80" fill="none" stroke="#EC4899" strokeWidth={3.5} />
                  {/* Brim of hat */}
                  <path d="M 66 84 Q 100 94 134 84 Q 100 86 66 84" fill="#EADCA6" stroke="#C4A484" strokeWidth={1} />
                </g>
              )}

              {accessory === "halo" && (
                <g>
                  {/* Glowing yellow ring floating above head */}
                  <ellipse cx="100" cy="62" rx="18" ry="4" fill="none" stroke="#FBBF24" strokeWidth={2.5} />
                  {/* Halo glow rays overlay */}
                  <ellipse cx="100" cy="62" rx="20" ry="5.2" fill="none" stroke="#FCD34D" strokeWidth={1} opacity={0.4} />
                </g>
              )}
            </svg>
          </button>
        </div>

        {/* BOTTOM HUD PANEL */}
        <div className="w-full flex items-center justify-between gap-2 z-10 relative">
          <button
            onClick={() => {
              setIsActivitiesOpen((prev) => !prev);
              setIsStatusOpen(false);
            }}
            className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-full border-2 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
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
            className={`flex-1 sm:flex-none justify-center px-3 sm:px-4 py-2 rounded-full border-2 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${
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
              className="absolute left-3 right-3 sm:left-5 sm:right-auto bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-3 sm:p-4 rounded-[24px] sm:rounded-[28px] shadow-2xl z-40 flex flex-col gap-2 w-auto sm:w-52 max-h-[270px] overflow-y-auto"
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

              {/* Vet Clinic */}
              <button
                onClick={() => {
                  travelToRoom("vet");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                  activeRoom === "vet" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <span>🩺</span> Vet Clinic (Check)
              </button>

              {/* Meadow Walk */}
              <button
                disabled={!unlockedRooms.includes("meadow")}
                onClick={() => {
                  travelToRoom("meadow");
                  setIsActivitiesOpen(false);
                }}
                className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex items-center justify-between disabled:opacity-50 cursor-pointer ${
                  activeRoom === "meadow" ? "bg-rose-50 border-rose-300 text-rose-600" : "bg-stone-50 hover:bg-stone-100 border-stone-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🚶</span> Meadow Trail (Walk)
                </div>
                {!unlockedRooms.includes("meadow") && <Lock className="w-3.5 h-3.5 text-stone-400" />}
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
              className="absolute left-3 right-3 sm:left-auto sm:right-5 bottom-16 bg-white/95 backdrop-blur-md border border-stone-200 p-3 sm:p-4 rounded-[24px] sm:rounded-[28px] shadow-2xl z-45 flex flex-col gap-3.5 w-auto sm:w-60 max-h-[300px] overflow-y-auto"
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
                  {(["none", "bow", "bell", "glasses", "scarf", "sunhat", "crown", "halo", "royal"] as const).map((acc) => {
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
      <div className="w-full min-w-0 bg-white/60 border border-stone-100 p-3 sm:p-4 rounded-3xl shadow-sm flex flex-col gap-2.5 backdrop-blur-sm overflow-hidden">
        <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-sky-400" /> Converse with Selah the Lamb
        </span>
        <form onSubmit={handleChat} className="flex items-center gap-2 w-full min-w-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isSleeping ? "Shhh, lamb is sleeping..." : "Type 'sad', 'scared', 'hello', or scripture keywords..."}
            disabled={isSleeping}
            className="min-w-0 flex-1 px-3 sm:px-4 py-2.5 rounded-2xl bg-white/70 border border-stone-200 text-xs text-warm-cocoa focus:outline-none focus:ring-2 focus:ring-[#D4A5A5]/40 transition-all font-medium disabled:opacity-50 disabled:bg-stone-50"
            maxLength={80}
          />
          <button
            type="submit"
            disabled={isSleeping || !chatInput.trim()}
            className="shrink-0 px-3 sm:px-4 py-2.5 rounded-2xl bg-warm-cocoa text-white text-xs font-bold flex items-center gap-1 hover:bg-warm-cocoa/90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:scale-100 cursor-pointer"
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
                      <Lock className="w-2.5 h-2.5" /> 60 Gold Coins
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
                        <Lock className="w-2.5 h-2.5" /> Unlock Backyard (100 Gold Coins)
                      </span>
                    )}
                  </span>
                </button>

                {/* 6. Vet Clinic (Bottom-Left) */}
                <button
                  type="button"
                  onClick={() => travelToRoom("vet")}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    activeRoom === "vet"
                      ? "bg-teal-50 border-teal-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Vet Clinic</span>
                    <span className="text-sm">🩺</span>
                  </span>
                  <span className="text-[9px] text-stone-400 italic">
                    {activeRoom === "vet" ? "Selah is here" : "Click to go"}
                  </span>
                </button>

                {/* 7. Meadow Trail (Bottom-Right - Unlockable) */}
                <button
                  type="button"
                  onClick={() => {
                    if (unlockedRooms.includes("meadow")) travelToRoom("meadow");
                    else unlockRoom("meadow", 80);
                  }}
                  className={`p-4 h-24 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all text-left w-full focus:outline-none ${
                    !unlockedRooms.includes("meadow")
                      ? "bg-stone-100 border-stone-200 opacity-80"
                      : activeRoom === "meadow"
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "bg-white hover:bg-stone-50 border-stone-200"
                  }`}
                >
                  <span className="flex justify-between items-start w-full">
                    <span className="text-[11px] font-bold text-warm-cocoa">Meadow Trail</span>
                    <span className="text-sm">🚶</span>
                  </span>
                  {unlockedRooms.includes("meadow") ? (
                    <span className="text-[9px] text-stone-400 italic">
                      {activeRoom === "meadow" ? "Selah is here" : "Click to go"}
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 flex items-center justify-center gap-1 self-start">
                      <Lock className="w-2.5 h-2.5" /> 80 Gold Coins
                    </span>
                  )}
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
              <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-2xl border border-amber-300 p-2 text-center text-xs font-extrabold text-white mb-4 shadow-sm">
                Your Gold Coins: 🪙 {coins} Gold Coins
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
                  {[
                    { id: "bow", name: "🎀 Pink Bow", cost: 0, desc: "A lovely pink ribbon bow" },
                    { id: "bell", name: "🔔 Golden Bell", cost: 25, desc: "Golden bell collar necklace" },
                    { id: "glasses", name: "👓 Cozy Glasses", cost: 40, desc: "Cute round wire reading glasses" },
                    { id: "scarf", name: "🧣 Cozy Scarf", cost: 50, desc: "A warm knit pastel scarf" },
                    { id: "sunhat", name: "👒 Straw Sunhat", cost: 60, desc: "Pastel straw hat with ribbon" },
                    { id: "crown", name: "🌸 Flower Crown", cost: 75, desc: "Woven pink/yellow flowers" },
                    { id: "halo", name: "👼 Heavenly Halo", cost: 90, desc: "Glowing golden floating ring" },
                    { id: "royal", name: "👑 Royal Crown", cost: 120, desc: "Golden princess tiara" }
                  ].map((acc) => {
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
                Complete cozy chores around the house to earn Gold Coins.
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
                        <span className="text-[10px] font-bold text-amber-600">🪙 {c.reward} Gold Coins</span>
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
                  🍳 Selah&apos;s Cooking Table
                </h3>
                <p className="text-[9px] text-warm-grey/50 italic mb-4">
                  Bird&apos;s-eye view cutting board & mixing bowl
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
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 animate-pulse">
                    Tap the board to chop! Target the pink zone ({chopCount}/3)
                  </span>

                  {/* Cutting Board Table */}
                  <button
                    type="button"
                    onClick={handleChopClick}
                    className="w-52 h-28 rounded-2xl bg-[#E6D5C3] border-4 border-[#B0927C] shadow-inner relative flex items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none overflow-hidden active:scale-98"
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

                  {/* Timing Gauge Bar */}
                  <div className="w-52 h-4 bg-stone-200 rounded-full relative overflow-hidden mt-1 border border-stone-350 shadow-inner">
                    {/* Pink Sweet spot (40% to 60%) */}
                    <div className="absolute left-[40%] right-[40%] top-0 bottom-0 bg-rose-300 border-x border-rose-450" />
                    {/* Slider indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-[#4B3A3A] shadow-md transition-all duration-75" 
                      style={{ left: `${sliderPos}%` }} 
                    />
                  </div>
                  <span className="text-[8.5px] text-stone-500 font-bold">
                    Hit board when indicator is in the pink sweet spot!
                  </span>
                </div>
              )}

              {/* STEP 3: STOVE BOIL/COOK */}
              {cookingStep === "stove" && cookingRecipe && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 animate-pulse">
                    Maintain temp in boiling zone (80°C - 100°C)!
                  </span>

                  {/* Thermometer Temperature Bar */}
                  <div className="w-48 flex flex-col gap-1 items-stretch">
                    <div className="flex justify-between text-[8px] font-bold text-stone-500">
                      <span>Room Temp (30°C)</span>
                      <span className="text-red-500 font-extrabold">{temp}°C</span>
                      <span>Boil (110°C)</span>
                    </div>
                    <div className="h-4 bg-stone-200 rounded-full relative overflow-hidden border border-stone-300">
                      {/* Boiling Sweet Spot (80 to 100, out of 30 to 110 range) */}
                      {/* Range size is 80. (80-30)/80 = 62.5% to (100-30)/80 = 87.5% */}
                      <div className="absolute left-[62.5%] w-[25%] top-0 bottom-0 bg-emerald-350 border-x border-emerald-450 opacity-80" />
                      
                      {/* Temperature Fill */}
                      <div 
                        className={`h-full transition-all duration-100 ${temp >= 80 && temp <= 100 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(100, Math.max(0, ((temp - 30) / 80) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  {/* Boil Progress Bar */}
                  <div className="w-48 flex flex-col gap-1 items-stretch">
                    <div className="flex justify-between text-[8.5px] font-bold text-stone-500">
                      <span>Boil Hold Progress</span>
                      <span>{boilProgress}%</span>
                    </div>
                    <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-150" 
                        style={{ width: `${boilProgress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Stove Button */}
                  <button
                    type="button"
                    onClick={handleStoveHeatClick}
                    className="w-44 h-24 rounded-2xl bg-stone-800 border-4 border-stone-700 shadow-xl relative flex flex-col items-center justify-center cursor-pointer hover:brightness-95 transition-all select-none focus:outline-none p-3 mt-1 active:scale-95"
                  >
                    {/* Glowing burner */}
                    <div className="absolute w-20 h-20 rounded-full border border-dashed border-red-650/40 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-radial from-red-500/40 to-transparent animate-pulse" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                      {/* Floating Steam Particles */}
                      <div className="absolute -top-8 flex gap-1 justify-center w-full">
                        <motion.span
                          animate={{ y: [-5, -25], x: [0, -3, 3, 0], opacity: [0, 0.8, 0], scale: [0.6, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 1.8, delay: 0.1 }}
                          className="text-sm select-none filter blur-[0.5px]"
                        >
                          💨
                        </motion.span>
                        <motion.span
                          animate={{ y: [-5, -20], x: [0, 3, -3, 0], opacity: [0, 0.8, 0], scale: [0.8, 1.1, 0.6] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                          className="text-xs select-none filter blur-[0.5px]"
                        >
                          💨
                        </motion.span>
                      </div>

                      <div className="text-3xl select-none animate-bounce" style={{ animationDuration: "1.2s" }}>
                        🍲
                      </div>
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-red-400 mt-1">
                        🔥 Tap to Heat 🔥
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 4: STIR MIX */}
              {cookingStep === "stir" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 animate-pulse">
                    Stir Clockwise! Tap the glowing arrow ({stirIndex}/8)
                  </span>

                  {/* Circular Stir Control Panel */}
                  <div className="w-44 h-44 rounded-full bg-white border-4 border-rose-200 shadow-lg relative flex items-center justify-center p-4">
                    
                    {/* Stir Bowl Visual Background */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none z-0">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#FEE2E2" strokeWidth="2" strokeDasharray="6 4" className="animate-spin" style={{ transformOrigin: "50% 50%", animationDuration: "8s" }} />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="#FEE2E2" strokeWidth="1.5" strokeDasharray="4 4" className="animate-spin" style={{ transformOrigin: "50% 50%", animationDuration: "6s", animationDirection: "reverse" }} />
                    </svg>

                    {/* Sliced food elements inside */}
                    <span className="flex gap-1 items-center z-10 text-[9px] font-bold bg-white/60 px-2 py-1 rounded-full backdrop-blur-xs select-none">
                      {cookingRecipe === "clover" && <span>🍀🍀</span>}
                      {cookingRecipe === "apple_mash" && <span>🍎🍀</span>}
                      {cookingRecipe === "manna_cookie" && <span>🍞🍪</span>}
                      {cookingRecipe === "berry_pancake" && <span>🍓🥞</span>}
                      {cookingRecipe === "honey_glaze" && <span>🍯🥣</span>}
                    </span>

                    {/* Clockwise Arrow Buttons (arranged at top, right, bottom, left) */}
                    {/* Arrow 0: Up */}
                    <button
                      type="button"
                      onClick={() => handleStirDirectionClick(0)}
                      className={`absolute top-2 w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-all active:scale-90 cursor-pointer ${
                        stirIndex % 4 === 0
                          ? "bg-rose-500 text-white animate-pulse border-2 border-rose-450 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                          : "bg-stone-100 text-stone-400 opacity-60 hover:opacity-80"
                      }`}
                    >
                      ⬆️
                    </button>

                    {/* Arrow 1: Right */}
                    <button
                      type="button"
                      onClick={() => handleStirDirectionClick(1)}
                      className={`absolute right-2 w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-all active:scale-90 cursor-pointer ${
                        stirIndex % 4 === 1
                          ? "bg-rose-500 text-white animate-pulse border-2 border-rose-450 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                          : "bg-stone-100 text-stone-400 opacity-60 hover:opacity-80"
                      }`}
                    >
                      ➡️
                    </button>

                    {/* Arrow 2: Bottom */}
                    <button
                      type="button"
                      onClick={() => handleStirDirectionClick(2)}
                      className={`absolute bottom-2 w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-all active:scale-90 cursor-pointer ${
                        stirIndex % 4 === 2
                          ? "bg-rose-500 text-white animate-pulse border-2 border-rose-450 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                          : "bg-stone-100 text-stone-400 opacity-60 hover:opacity-80"
                      }`}
                    >
                      ⬇️
                    </button>

                    {/* Arrow 3: Left */}
                    <button
                      type="button"
                      onClick={() => handleStirDirectionClick(3)}
                      className={`absolute left-2 w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-md transition-all active:scale-90 cursor-pointer ${
                        stirIndex % 4 === 3
                          ? "bg-rose-500 text-white animate-pulse border-2 border-rose-450 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                          : "bg-stone-100 text-stone-400 opacity-60 hover:opacity-80"
                      }`}
                    >
                      ⬅️
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: GARNISH */}
              {cookingStep === "garnish" && cookingRecipe && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4A5A5] animate-pulse">
                    Tap each floating topping to place it!
                  </span>

                  {/* Plate container */}
                  <div className="w-44 h-44 rounded-full bg-[#FCF8F2] border-4 border-dashed border-[#D4A5A5]/85 shadow-lg relative flex items-center justify-center select-none overflow-hidden">
                    
                    {/* Inner Plate Visual */}
                    <div className="w-32 h-32 rounded-full bg-white border border-stone-200/60 flex flex-col items-center justify-center shadow-inner relative p-2 pointer-events-none">
                      <span className="text-3xl">🍲</span>
                      <span className="text-[8px] font-bold text-stone-500 uppercase tracking-wider mt-1 text-center">
                        {cookingRecipe === "clover" ? "Clover Salad" :
                         cookingRecipe === "apple_mash" ? "Apple Clover Mash" :
                         cookingRecipe === "manna_cookie" ? "Manna Cookie Treat" :
                         cookingRecipe === "berry_pancake" ? "Sweet Berry Pancake" :
                         "Honey Glazed Oats"}
                      </span>
                    </div>

                    {/* Clickable Floating Topping Items */}
                    {garnishItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.placed}
                        onClick={() => handleGarnishItemClick(item.id)}
                        style={{ left: `${item.x}px`, top: `${item.y}px` }}
                        className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-base transition-all shadow-sm focus:outline-none ${
                          item.placed
                            ? "opacity-100 scale-90 border-0 pointer-events-none cursor-default"
                            : "bg-white border-2 border-amber-200 cursor-pointer hover:scale-110 active:scale-95 animate-bounce"
                        }`}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
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

                    {/* Display placed toppings on final plate */}
                    {garnishItems.map((item) => item.placed && (
                      <span 
                        key={item.id} 
                        className="absolute text-xs" 
                        style={{ left: `${item.x * 0.75 + 16}px`, top: `${item.y * 0.75 + 16}px` }}
                      >
                        {item.emoji}
                      </span>
                    ))}
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
                  <span className={cookingStep === "stove" ? "text-red-750 font-extrabold" : ""}>2. Stove</span> • 
                  <span className={cookingStep === "stir" ? "text-rose-600 font-extrabold" : ""}>3. Stir Mix</span> • 
                  <span className={cookingStep === "garnish" ? "text-[#D4A5A5] font-extrabold" : ""}>4. Garnish</span> • 
                  <span className={cookingStep === "done" ? "text-emerald-700 font-extrabold" : ""}>5. Serve</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── E. STORYBOOK READING OVERLAY ────────────────── */}
      <AnimatePresence>
        {isReadingStory && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FCF6E8] border-4 border-[#C2A58F] p-6 rounded-[36px] shadow-2xl text-center max-w-md w-full relative min-h-[360px] flex flex-col justify-between"
            >
              <button
                onClick={() => setIsReadingStory(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full">
                <span className="text-[8.5px] uppercase font-bold text-stone-400 tracking-wider">{currentStoryBook.modeLabel}</span>
                <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-4">
                  {currentStoryBook.emoji} {currentStoryBook.title}
                </h3>
              </div>

              {storyMode === "living" && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(["psalm23", "lostSheep"] as StoryBookId[]).map((bookId) => {
                    const book = STORY_BOOKS[bookId];
                    return (
                      <button
                        key={bookId}
                        type="button"
                        onClick={() => {
                          setSelectedStoryBook(bookId);
                          setStoryPage(0);
                          speak(`Baa! ${book.title} is a beautiful choice. 📚`);
                        }}
                        className={`rounded-2xl border p-3 text-left transition-all active:scale-95 ${
                          selectedStoryBook === bookId
                            ? "bg-white border-rose-300 shadow-md"
                            : "bg-white/55 border-stone-200 hover:bg-white/80"
                        }`}
                      >
                        <span className="text-lg">{book.emoji}</span>
                        <span className="block text-[10px] font-black text-warm-cocoa leading-tight">{book.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STORYBOOK PAGE CONTENT */}
              <div className="flex-1 flex items-center justify-center p-5 bg-white/75 rounded-3xl border border-stone-200/50 mb-5 leading-relaxed text-xs text-warm-cocoa font-medium font-serif italic text-left shadow-inner">
                <span>&ldquo;{currentStoryBook.pages[storyPage]}&rdquo;</span>
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
                <span className="text-[9px] font-bold text-stone-450">Page {storyPage + 1} of {currentStoryBook.pages.length}</span>
                <button
                  onClick={handleStoryNext}
                  className="px-4 py-1.5 rounded-xl bg-[#4B3A3A] text-white font-bold text-[9px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  {storyPage === currentStoryBook.pages.length - 1
                    ? storyMode === "bedtime" ? "Sleep 🛌💤" : "Finish +5 🪙"
                    : "Next Page →"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── F. VET CLINIC CHECKUP MODAL OVERLAY ────────────────── */}
      <AnimatePresence>
        {isClinicActive && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F0FDFB] border-4 border-[#80CBC4] p-5 rounded-[40px] shadow-2xl text-center max-w-sm w-full relative min-h-[380px] flex flex-col justify-between"
            >
              <button
                onClick={() => {
                  setIsClinicActive(false);
                  setClinicStep("temp");
                }}
                className="absolute top-4 right-4 text-stone-450 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full">
                <span className="text-[8.5px] uppercase font-bold text-teal-600 tracking-wider">Vet Clinic • Dr Checkup</span>
                <h3 className="font-serif text-sm font-bold text-teal-800 mb-0.5 flex items-center justify-center gap-1.5">
                  🩺 Clinic Examination Room
                </h3>
                <p className="text-[9px] text-teal-700/60 italic mb-4">
                  Cure Selah by completing the clinic checkup steps!
                </p>
              </div>

              {/* STEP 1: TEMPERATURE GAUGE */}
              {clinicStep === "temp" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 animate-pulse">
                    Lock thermometer in stable green range!
                  </span>

                  <div className="text-4xl animate-bounce">🌡️</div>

                  {/* Temp Slider Gauge */}
                  <div className="w-56 h-6 bg-stone-200 rounded-full relative overflow-hidden border border-stone-350 shadow-inner">
                    {/* Safe zone 37.5°C to 39.5°C (33.3% to 66.6%) */}
                    <div className="absolute left-[33.3%] w-[33.3%] top-0 bottom-0 bg-emerald-350 border-x border-emerald-450 opacity-80" />
                    
                    {/* Live thermometer slider pointer */}
                    <div 
                      className="absolute top-0 bottom-0 w-2.5 bg-teal-600 shadow-md transition-all duration-75" 
                      style={{ left: `${((vetTemp - 35.5) / 6) * 100}%` }} 
                    />
                  </div>

                  <div className="flex flex-col items-center">
                    <span className={`text-xl font-extrabold tracking-wide ${vetTemp >= 37.5 && vetTemp <= 39.5 ? "text-emerald-600" : "text-amber-600"}`}>
                      {vetTemp}°C
                    </span>
                    <span className="text-[8.5px] text-stone-500 font-bold mt-0.5">
                      Healthy sheep range: 37.5°C - 39.5°C
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleThermometerStop}
                    className="mt-2 px-6 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Take Temperature 🌡️
                  </button>
                </div>
              )}

              {/* STEP 2: BAND-AIDS */}
              {clinicStep === "bandaid" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-850 animate-pulse">
                    Tap the red sore spots to apply band-aids!
                  </span>

                  {/* Lamb SVG with interactive coordinates */}
                  <div className="w-40 h-40 bg-white/60 border border-teal-100 rounded-3xl p-1 shadow-inner relative flex items-center justify-center">
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
                      <ellipse cx="100" cy="115" rx="36" ry="30" fill="#E8F5E9" stroke="#F0D3D3" strokeWidth={2} />
                      <circle cx="76" cy="122" r="7" fill="#81C784" opacity="0.6" />
                      <circle cx="124" cy="122" r="7" fill="#81C784" opacity="0.6" />

                      {/* sad/worried eyebrows */}
                      <g>
                        <path d="M 76 104 Q 82 101 88 106" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
                        <path d="M 112 106 Q 118 101 124 104" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />
                      </g>
                      {/* worried cartoon eyes */}
                      <circle cx="82" cy="112" r="6" fill="#4B3A3A" />
                      <circle cx="80" cy="110" r="2.2" fill="white" />
                      <circle cx="118" cy="112" r="6" fill="#4B3A3A" />
                      <circle cx="116" cy="110" r="2.2" fill="white" />

                      {/* mouth */}
                      <path d="M 96 123 Q 100 126 104 123" fill="none" stroke="#4B3A3A" strokeWidth={2} strokeLinecap="round" />

                      {/* SICKNESS SORE SPOTS */}
                      {sores.map((s) => (
                        <g 
                          key={s.id} 
                          onClick={() => !s.treated && handleSoreClick(s.id)} 
                          className={s.treated ? "pointer-events-none" : "cursor-pointer"}
                        >
                          {s.treated ? (
                            <text x={s.x} y={s.y} fontSize="20" textAnchor="middle" alignmentBaseline="middle" className="select-none">🩹</text>
                          ) : (
                            <circle 
                              cx={s.x} 
                              cy={s.y} 
                              r="11" 
                              fill="#EF4444" 
                              stroke="#FFFFFF" 
                              strokeWidth="1.8" 
                              className="animate-pulse" 
                              opacity="0.9"
                            />
                          )}
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              )}

              {/* STEP 3: SYRUP FEED */}
              {clinicStep === "syrup" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 animate-pulse">
                    Tap the medicine bottle to feed syrup!
                  </span>

                  <button
                    type="button"
                    onClick={handleSyrupFeed}
                    className="w-24 h-24 rounded-full bg-teal-50 border-4 border-teal-200 hover:border-teal-400 shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-90 select-none animate-bounce"
                  >
                    <span className="text-5xl filter drop-shadow-md">🍼</span>
                  </button>

                  <div className="flex gap-3 mt-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-base shadow-sm transition-all ${
                          syrupCount > i 
                            ? "bg-rose-100 border-rose-400 text-rose-500 scale-110" 
                            : "bg-stone-50 border-stone-200 text-stone-300 opacity-60"
                        }`}
                      >
                        🥄
                      </div>
                    ))}
                  </div>

                  <span className="text-[9.5px] text-stone-500 font-bold">
                    Feed doses: {syrupCount} / 3 spoonfuls
                  </span>
                </div>
              )}

              {/* STEP 4: CURED */}
              {clinicStep === "done" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 animate-bounce">
                    Selah is Cured! 🎉🐑
                  </span>

                  <div className="text-5xl">🩺💖✨</div>

                  <div className="bg-emerald-55 border border-emerald-200 rounded-2xl p-3 max-w-xs text-[10px] text-emerald-800 font-bold leading-relaxed shadow-sm">
                    All symptoms resolved! Temperature normal, sores bandaged, and syrup fed. Ready for release!
                  </div>

                  <button
                    type="button"
                    onClick={finishClinicCheckup}
                    className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-md cursor-pointer mt-2"
                  >
                    Discharge Patient 🐑🩺
                  </button>
                </div>
              )}

              {/* Footer step indicators */}
              <div className="w-full flex justify-center gap-1.5 text-[9px] font-bold text-stone-400 mt-2">
                <span className={clinicStep === "temp" ? "text-teal-700 font-extrabold" : ""}>1. Temp</span> • 
                <span className={clinicStep === "bandaid" ? "text-teal-700 font-extrabold" : ""}>2. Band-Aids</span> • 
                <span className={clinicStep === "syrup" ? "text-teal-700 font-extrabold" : ""}>3. Syrup</span> • 
                <span className={clinicStep === "done" ? "text-emerald-700 font-extrabold" : ""}>4. Release</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── G. MEADOW WALK OVERLAY ─────────────────────────────── */}
      <AnimatePresence>
        {isWalkingActive && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F0FDF4] border-4 border-[#86EFAC] p-6 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[340px] flex flex-col justify-between"
            >
              <button
                onClick={() => setIsWalkingActive(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full">
                <span className="text-[8.5px] uppercase font-bold text-emerald-600 tracking-wider">Activities • Trail Walk</span>
                <h3 className="font-serif text-sm font-bold text-emerald-800 mb-2 flex items-center justify-center gap-1.5">
                  🚶 Scenic Meadow Trail Walk
                </h3>
                <p className="text-[9px] text-stone-500 italic mb-2">
                  Walk 30 meters to complete the scenic trail!
                </p>
              </div>

              {/* Trail progress lane */}
              <div className="relative w-full h-16 bg-[#D7CCC8]/80 border-y-2 border-[#A1887F] rounded-2xl overflow-hidden shadow-inner my-3 flex items-center">
                {/* Path dashes */}
                <div className="absolute inset-0 bg-repeat-x opacity-20 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='2' viewBox='0 0 20 2'%3E%3Cline x1='0' y1='1' x2='12' y2='1' stroke='%234E342E' stroke-width='2'/%3E%3C/svg%3E")`, backgroundPosition: "center" }} />
                
                {/* Gold Coin icons at 10m and 20m, Finish Line at 30m */}
                <div className="absolute left-[33%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                  <span className={`text-sm transition-all duration-300 ${walkProgress >= 10 ? "opacity-30 scale-75" : "animate-bounce"}`}>🪙</span>
                  <span className="text-[7px] font-bold text-stone-500">10m</span>
                </div>
                <div className="absolute left-[66%] top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                  <span className={`text-sm transition-all duration-300 ${walkProgress >= 20 ? "opacity-30 scale-75" : "animate-bounce"}`}>🪙</span>
                  <span className="text-[7px] font-bold text-stone-500">20m</span>
                </div>
                <div className="absolute right-[4%] top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  <span className="text-sm">🏁</span>
                  <span className="text-[7px] font-bold text-stone-500">30m</span>
                </div>

                {/* Animated walking lamb */}
                <motion.div 
                  className="absolute z-20 text-3xl select-none transition-all duration-300 ease-out"
                  style={{ left: `calc(${(walkProgress / 30) * 82}% + 6px)` }}
                  animate={walkProgress > 0 ? {
                    y: [0, -4, 0],
                    rotate: [0, -3, 3, 0]
                  } : {}}
                  key={walkProgress}
                  transition={{ duration: 0.3 }}
                >
                  🐑
                </motion.div>
              </div>

              <div className="text-center font-bold text-stone-700 text-xs my-1">
                Distance: <span className="text-emerald-600 text-sm font-extrabold">{walkProgress}</span> / 30 meters
              </div>

              {/* Step alternating buttons */}
              <div className="flex gap-4 w-full px-2 mt-2">
                {/* Left Foot */}
                <button
                  type="button"
                  onClick={() => handleMeadowWalkStep("left")}
                  className={`flex-1 py-3.5 rounded-2xl font-extrabold text-[10.5px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 flex flex-col items-center gap-0.5 ${
                    lastFoot === "right" || lastFoot === "none"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-450 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
                      : "bg-stone-150 border border-stone-250 text-stone-400 opacity-60"
                  }`}
                >
                  🐾 Left Foot
                  <span className="text-[7.5px] font-bold opacity-85">
                    {lastFoot === "right" || lastFoot === "none" ? "TAP NEXT!" : "WAIT"}
                  </span>
                </button>

                {/* Right Foot */}
                <button
                  type="button"
                  onClick={() => handleMeadowWalkStep("right")}
                  className={`flex-1 py-3.5 rounded-2xl font-extrabold text-[10.5px] uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95 flex flex-col items-center gap-0.5 ${
                    lastFoot === "left"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-450 scale-105 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
                      : "bg-stone-150 border border-stone-250 text-stone-400 opacity-60"
                  }`}
                >
                  🐾 Right Foot
                  <span className="text-[7.5px] font-bold opacity-85">
                    {lastFoot === "left" ? "TAP NEXT!" : "WAIT"}
                  </span>
                </button>
              </div>

              <span className="text-[8px] text-stone-450 font-bold text-center block mt-3">
                Alternating tap order: Left ➔ Right ➔ Left ➔ Right
              </span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
