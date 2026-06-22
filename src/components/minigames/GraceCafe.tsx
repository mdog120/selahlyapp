"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Heart, Lock, Check, Sparkles, RefreshCw } from "lucide-react";

// --- Types & Data ---
type AnimalType = "bunny" | "bear" | "kitty" | "fox" | "lamb";

interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  type: "drink" | "food";
  cost: number;
  price: number;
  prepTime: number; // in seconds
  description: string;
}

const MENU: MenuItem[] = [
  { id: "living_water", name: "Living Water Tea", emoji: "🍵", type: "drink", cost: 0, price: 8, prepTime: 2, description: "Refreshing and always free to brew." },
  { id: "faith_latte", name: "Faith Latte", emoji: "☕", type: "drink", cost: 4, price: 14, prepTime: 4, description: "Warm espresso with steamed milk." },
  { id: "peace_herbal", name: "Peace Herbal Tea", emoji: "🫖", type: "drink", cost: 5, price: 18, prepTime: 5, description: "Calming chamomile lavender brew." },
  { id: "daily_bread", name: "Daily Bread Muffin", emoji: "🧁", type: "food", cost: 3, price: 12, prepTime: 6, description: "Cozy cinnamon honey muffin." },
  { id: "grace_roll", name: "Grace Cinnamon Roll", emoji: "🍥", type: "food", cost: 5, price: 18, prepTime: 8, description: "Frosted warm swirl pastry." },
  { id: "spirit_tart", name: "Fruit of Spirit Tart", emoji: "🥧", type: "food", cost: 7, price: 25, prepTime: 10, description: "Rich fresh double-berry tart." }
];

interface Customer {
  id: string;
  type: AnimalType;
  order: string[]; // item IDs
  patience: number; // 0 to 100
  maxPatience: number;
  joinedTime: number;
}

interface UpgradeItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  type: "appliance" | "decor" | "staff";
  description: string;
  purchased: boolean;
}

interface ScrambleWord {
  word: string;
  scrambled: string;
  clue: string;
}

const SCRAMBLE_WORDS: ScrambleWord[] = [
  { word: "FAITHFUL", scrambled: "IFAHTLFU", clue: "God is ___ and true." },
  { word: "SHEPHERD", scrambled: "PEHDRESH", clue: "The Lord is my ___." },
  { word: "SALVATION", scrambled: "TIANASLOV", clue: "The helmet of ___." },
  { word: "GRACE", scrambled: "REGAC", clue: "Saved by His ___." },
  { word: "BLESSING", scrambled: "LSEBSIGN" , clue: "Count your ___ one by one." },
  { word: "PEACEFUL", scrambled: "EAEFCLUP", clue: "A calm and quiet heart." }
];

// --- Cute Animal SVG Component ---
const CustomerAnimal: React.FC<{ type: AnimalType; patience: number }> = ({ type, patience }) => {
  const isSad = patience < 35;

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 filter drop-shadow-md select-none pointer-events-none">
      {/* 1. Bunny */}
      {type === "bunny" && (
        <g>
          {/* Ears */}
          <ellipse cx="38" cy="22" rx="7" ry="20" fill="#FFF0F5" stroke="#F5D3E3" strokeWidth="1.5" />
          <ellipse cx="38" cy="24" rx="4" ry="14" fill="#FFD2E5" opacity="0.6" />
          
          <ellipse cx="62" cy="22" rx="7" ry="20" fill="#FFF0F5" stroke="#F5D3E3" strokeWidth="1.5" />
          <ellipse cx="62" cy="24" rx="4" ry="14" fill="#FFD2E5" opacity="0.6" />
          
          {/* Head */}
          <circle cx="50" cy="55" r="24" fill="#FFF8FB" stroke="#F5D3E3" strokeWidth="1.5" />
          {/* Eyes */}
          {isSad ? (
            <>
              <path d="M 38 52 Q 43 47 45 53" fill="none" stroke="#4A343F" strokeWidth="2" strokeLinecap="round" />
              <path d="M 55 53 Q 57 47 62 52" fill="none" stroke="#4A343F" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="41" cy="50" r="3.5" fill="#4A343F" />
              <circle cx="39.5" cy="48.5" r="1.2" fill="#FFF" />
              <circle cx="59" cy="50" r="3.5" fill="#4A343F" />
              <circle cx="57.5" cy="48.5" r="1.2" fill="#FFF" />
            </>
          )}
          {/* Blush */}
          <circle cx="34" cy="58" r="3" fill="#FFB7D5" opacity="0.6" />
          <circle cx="66" cy="58" r="3" fill="#FFB7D5" opacity="0.6" />
          {/* Mouth */}
          <path d="M 48 57 Q 50 60 52 57" fill="none" stroke="#4A343F" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* 2. Bear */}
      {type === "bear" && (
        <g>
          {/* Ears */}
          <circle cx="32" cy="36" r="8" fill="#D7CCC8" stroke="#BCAAA4" strokeWidth="1.5" />
          <circle cx="32" cy="36" r="4.5" fill="#FFCDD2" opacity="0.5" />
          <circle cx="68" cy="36" r="8" fill="#D7CCC8" stroke="#BCAAA4" strokeWidth="1.5" />
          <circle cx="68" cy="36" r="4.5" fill="#FFCDD2" opacity="0.5" />
          
          {/* Head */}
          <circle cx="50" cy="58" r="22" fill="#EFEBE9" stroke="#D7CCC8" strokeWidth="1.5" />
          {/* Snout */}
          <ellipse cx="50" cy="64" rx="8" ry="6" fill="#FFF" stroke="#E0D7D7" strokeWidth="1" />
          {/* Eyes */}
          {isSad ? (
            <>
              <path d="M 39 54 L 44 54" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 56 54 L 61 54" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="41" cy="52" r="3" fill="#5D4037" />
              <circle cx="59" cy="52" r="3" fill="#5D4037" />
            </>
          )}
          {/* Nose */}
          <ellipse cx="50" cy="62" rx="2" ry="1.5" fill="#5D4037" />
          {/* Mouth */}
          <path d="M 48 66 Q 50 68 52 66" fill="none" stroke="#5D4037" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* 3. Kitty */}
      {type === "kitty" && (
        <g>
          {/* Ears */}
          <polygon points="26,45 22,25 42,39" fill="#ECEFF1" stroke="#CFD8DC" strokeWidth="1.5" />
          <polygon points="27,41 25,29 38,37" fill="#FFCDD2" opacity="0.5" />
          <polygon points="74,45 78,25 58,39" fill="#ECEFF1" stroke="#CFD8DC" strokeWidth="1.5" />
          <polygon points="73,41 75,29 62,37" fill="#FFCDD2" opacity="0.5" />
          
          {/* Head */}
          <ellipse cx="50" cy="58" rx="23" ry="20" fill="#F5F5F5" stroke="#E0E0E0" strokeWidth="1.5" />
          {/* Eyes */}
          {isSad ? (
            <>
              <path d="M 37 54 C 37 50, 43 50, 43 54" fill="none" stroke="#37474F" strokeWidth="2" strokeLinecap="round" />
              <path d="M 57 54 C 57 50, 63 50, 63 54" fill="none" stroke="#37474F" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="40" cy="52" r="3.5" fill="#37474F" />
              <circle cx="60" cy="52" r="3.5" fill="#37474F" />
            </>
          )}
          {/* Nose */}
          <polygon points="48,58 52,58 50,60" fill="#FF8A80" />
          {/* Whiskers */}
          <line x1="24" y1="58" x2="14" y2="57" stroke="#B0BEC5" strokeWidth="1.5" />
          <line x1="24" y1="62" x2="12" y2="63" stroke="#B0BEC5" strokeWidth="1.5" />
          <line x1="76" y1="58" x2="86" y2="57" stroke="#B0BEC5" strokeWidth="1.5" />
          <line x1="76" y1="62" x2="88" y2="63" stroke="#B0BEC5" strokeWidth="1.5" />
          {/* Mouth */}
          <path d="M 47 62 Q 50 64 53 62" fill="none" stroke="#37474F" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* 4. Fox */}
      {type === "fox" && (
        <g>
          {/* Ears */}
          <polygon points="24,42 16,22 38,36" fill="#FF7043" stroke="#E64A19" strokeWidth="1.5" />
          <polygon points="76,42 84,22 62,36" fill="#FF7043" stroke="#E64A19" strokeWidth="1.5" />
          
          {/* Head */}
          <polygon points="26,50 74,50 50,78" fill="#FF7043" stroke="#E64A19" strokeWidth="1.5" />
          {/* Cheeks */}
          <polygon points="26,50 38,50 28,64" fill="#FFF" />
          <polygon points="74,50 62,50 72,64" fill="#FFF" />
          
          {/* Eyes */}
          {isSad ? (
            <>
              <path d="M 36 48 L 42 50" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 64 48 L 58 50" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="39" cy="47" r="3.2" fill="#3E2723" />
              <circle cx="61" cy="47" r="3.2" fill="#3E2723" />
            </>
          )}
          {/* Nose */}
          <circle cx="50" cy="74" r="2.5" fill="#212121" />
        </g>
      )}

      {/* 5. Lamb */}
      {type === "lamb" && (
        <g>
          {/* Ears */}
          <path d="M 24 45 Q 12 43 14 53 Q 22 55 24 49 Z" fill="#FFF" stroke="#E0D3D3" strokeWidth="1" />
          <path d="M 76 45 Q 88 43 86 53 Q 78 55 76 49 Z" fill="#FFF" stroke="#E0D3D3" strokeWidth="1" />
          
          {/* Fluffy body hair */}
          <circle cx="40" cy="38" r="8" fill="#FFF" stroke="#ECEFF1" strokeWidth="1" />
          <circle cx="50" cy="36" r="9" fill="#FFF" stroke="#ECEFF1" strokeWidth="1" />
          <circle cx="60" cy="38" r="8" fill="#FFF" stroke="#ECEFF1" strokeWidth="1" />
          
          {/* Head */}
          <ellipse cx="50" cy="56" rx="20" ry="17" fill="#FFFAFA" stroke="#E6D3D3" strokeWidth="1.5" />
          {/* Eyes */}
          {isSad ? (
            <>
              <path d="M 40 54 Q 44 50 46 55" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" />
              <path d="M 60 54 Q 56 50 54 55" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="42" cy="51" r="3" fill="#4E342E" />
              <circle cx="58" cy="51" r="3" fill="#4E342E" />
            </>
          )}
          {/* Blush */}
          <circle cx="36" cy="59" r="2" fill="#FFCDD2" opacity="0.6" />
          <circle cx="64" cy="59" r="2" fill="#FFCDD2" opacity="0.6" />
          {/* Mouth */}
          <path d="M 48 59 Q 50 61 52 59" fill="none" stroke="#4E342E" strokeWidth="1" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

export const GraceCafe: React.FC = () => {
  // --- States ---
  const [coins, setCoins] = useState(60);
  const [day, setDay] = useState(1);
  const [dayTime, setDayTime] = useState(60); // 60 seconds day shift
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shopRating, setShopRating] = useState(90); // 0-100%
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Stations
  const [brewQueue, setBrewQueue] = useState<{ id: string; name: string; progress: number; duration: number }[]>([]);
  const [bakeQueue, setBakeQueue] = useState<{ id: string; name: string; progress: number; duration: number }[]>([]);
  const [pickupCounter, setPickupCounter] = useState<{ id: string; name: string; emoji: string }[]>([]);

  // Shop & Upgrades
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "oven_pro", name: "Pro Turbo Oven", emoji: "⚡🍪", cost: 40, type: "appliance", description: "Bakes cookies and tarts 35% faster.", purchased: false },
    { id: "espresso_pro", name: "Premium Espresso Machine", emoji: "⚡☕", cost: 50, type: "appliance", description: "Brews lattes and tea 40% faster.", purchased: false },
    { id: "scripture_frame", name: "Verses Frame", emoji: "🖼️✨", cost: 30, type: "decor", description: "Cozy scripture frame. Boosts customer max patience by +20%.", purchased: false },
    { id: "hanging_plants", name: "Pothos Vines", emoji: "🌿💚", cost: 25, type: "decor", description: "Cozy plants. Customer patience drains 15% slower.", purchased: false },
    { id: "helper_joy", name: "Assistant Joy", emoji: "🐑☕", cost: 80, type: "staff", description: "Brews basic Iced Tea automatically.", purchased: false },
    { id: "helper_grace", name: "Baker Grace", emoji: "🐑🧁", cost: 95, type: "staff", description: "Bakes Muffins automatically.", purchased: false }
  ]);

  // Report states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [coinsEarnedToday, setCoinsEarnedToday] = useState(0);

  // Grace Period Scripture Scramble
  const [isScrambleActive, setIsScrambleActive] = useState(false);
  const [scrambleInfo, setScrambleInfo] = useState<ScrambleWord | null>(null);
  const [scrambleLetters, setScrambleLetters] = useState<{ id: number; char: string; clicked: boolean }[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [scrambleMessage, setScrambleMessage] = useState("");

  const [textLog, setTextLog] = useState("Welcome to Grace Cafe, shepherd! Press Start Day to open.");

  // Timers Refs
  const shiftIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queueIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Local Storage Sync ---
  useEffect(() => {
    const saved = localStorage.getItem("selahly_grace_cafe_v1");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCoins(data.coins ?? 60);
        setDay(data.day ?? 1);
        setShopRating(data.shopRating ?? 90);
        if (data.upgrades) setUpgrades(data.upgrades);
      } catch (e) {
        console.error("Failed to load Grace Cafe save stats", e);
      }
    }
  }, []);

  const saveStats = (updatedCoins: number, updatedDay: number, updatedRating: number, updatedUpgrades: UpgradeItem[]) => {
    localStorage.setItem(
      "selahly_grace_cafe_v1",
      JSON.stringify({
        coins: updatedCoins,
        day: updatedDay,
        shopRating: updatedRating,
        upgrades: updatedUpgrades
      })
    );
  };

  // --- Customer Spawn System ---
  const spawnCustomer = () => {
    setCustomers((prev) => {
      if (prev.length >= 4) return prev;
      
      const animalPool: AnimalType[] = ["bunny", "bear", "kitty", "fox", "lamb"];
      const randAnimal = animalPool[Math.floor(Math.random() * animalPool.length)];
      
      // Determine order: 1 or 2 items
      const orderSize = Math.random() > 0.65 ? 2 : 1;
      const orderItems: string[] = [];
      for (let i = 0; i < orderSize; i++) {
        const item = MENU[Math.floor(Math.random() * MENU.length)];
        orderItems.push(item.id);
      }

      // Check if decor upgrades increase patience limit
      const hasFrame = upgrades.find((u) => u.id === "scripture_frame")?.purchased;
      const baseMax = hasFrame ? 120 : 100;

      const newCust: Customer = {
        id: Math.random().toString(),
        type: randAnimal,
        order: orderItems,
        patience: baseMax,
        maxPatience: baseMax,
        joinedTime: Date.now()
      };

      setTextLog(`A cute ${randAnimal} customer has arrived and ordered: ${orderItems.map(id => MENU.find(m => m.id === id)?.name).join(", ")}!`);
      return [...prev, newCust];
    });
  };

  // --- Automation (Hired Staff) logic ---
  useEffect(() => {
    if (!isShiftActive) return;

    // Helper Joy brews basic living water tea automatically every 5.5s if requested in queue
    const joyHired = upgrades.find(u => u.id === "helper_joy")?.purchased;
    let joyTimer: NodeJS.Timeout;
    if (joyHired) {
      joyTimer = setInterval(() => {
        const needsTea = customers.some(c => c.order.includes("living_water"));
        if (needsTea) {
          startBrew("living_water");
          setTextLog("Assistant Joy brews Living Water Tea for the queue!");
        }
      }, 5500);
    }

    // Helper Grace bakes Muffin automatically every 7.5s
    const graceHired = upgrades.find(u => u.id === "helper_grace")?.purchased;
    let graceTimer: NodeJS.Timeout;
    if (graceHired) {
      graceTimer = setInterval(() => {
        const needsMuffin = customers.some(c => c.order.includes("daily_bread"));
        if (needsMuffin) {
          startBake("daily_bread");
          setTextLog("Baker Grace slides a Daily Bread Muffin into the oven!");
        }
      }, 7500);
    }

    return () => {
      if (joyTimer) clearInterval(joyTimer);
      if (graceTimer) clearInterval(graceTimer);
    };
  }, [isShiftActive, customers, upgrades]);

  // --- Core Game Loops (Time & Patience) ---
  useEffect(() => {
    if (isShiftActive) {
      // 1. Shift Timer (60s countdown)
      shiftIntervalRef.current = setInterval(() => {
        setDayTime((prev) => {
          if (prev <= 1) {
            endDayShift();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Spawn Customers periodically
      queueIntervalRef.current = setInterval(() => {
        spawnCustomer();
      }, 7000 + Math.random() * 4000);
    }

    return () => {
      if (shiftIntervalRef.current) clearInterval(shiftIntervalRef.current);
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    };
  }, [isShiftActive]);

  // 3. Customer patience countdown loop
  useEffect(() => {
    let patienceInterval: NodeJS.Timeout;
    if (isShiftActive) {
      patienceInterval = setInterval(() => {
        const hasVines = upgrades.find(u => u.id === "hanging_plants")?.purchased;
        // Drains 15% slower if they bought Vines
        const drainAmount = hasVines ? 1.7 : 2.0;

        setCustomers((prev) => {
          const updated = prev.map((c) => ({
            ...c,
            patience: Math.max(0, c.patience - drainAmount)
          }));

          // Remove customers who lost all patience
          const angryCustomers = updated.filter((c) => c.patience <= 0);
          if (angryCustomers.length > 0) {
            setShopRating((r) => Math.max(30, r - 5 * angryCustomers.length));
            setTextLog("Oh no! A customer lost patience and left. Ratings decreased.");
          }

          return updated.filter((c) => c.patience > 0);
        });
      }, 1000);
    }

    return () => {
      if (patienceInterval) clearInterval(patienceInterval);
    };
  }, [isShiftActive, upgrades]);

  // Station Brewing/Baking Progress tick loop
  useEffect(() => {
    let stationInterval: NodeJS.Timeout;
    if (isShiftActive) {
      stationInterval = setInterval(() => {
        // Brew Station
        setBrewQueue((prev) => {
          const next = prev.map((item) => ({ ...item, progress: item.progress + 1 }));
          const completed = next.filter((item) => item.progress >= item.duration);
          if (completed.length > 0) {
            completed.forEach((c) => {
              setPickupCounter((curr) => [...curr, { id: c.id, name: c.name, emoji: MENU.find(m => m.id === c.id)?.emoji || "☕" }]);
            });
            setTextLog(`Brew finished! Pickup counter loaded with fresh beverages.`);
          }
          return next.filter((item) => item.progress < item.duration);
        });

        // Bake Station
        setBakeQueue((prev) => {
          const next = prev.map((item) => ({ ...item, progress: item.progress + 1 }));
          const completed = next.filter((item) => item.progress >= item.duration);
          if (completed.length > 0) {
            completed.forEach((c) => {
              setPickupCounter((curr) => [...curr, { id: c.id, name: c.name, emoji: MENU.find(m => m.id === c.id)?.emoji || "🧁" }]);
            });
            setTextLog(`Oven DING! Pastries finished baking.`);
          }
          return next.filter((item) => item.progress < item.duration);
        });
      }, 1000);
    }

    return () => {
      if (stationInterval) clearInterval(stationInterval);
    };
  }, [isShiftActive]);

  // --- Day Management ---
  const startDayShift = () => {
    setIsShiftActive(true);
    setDayTime(60);
    setCustomers([]);
    setBrewQueue([]);
    setBakeQueue([]);
    setPickupCounter([]);
    setCoinsEarnedToday(0);
    setTextLog(`Day ${day} started! Preparing to open registers... ☕`);
    spawnCustomer();
  };

  const endDayShift = () => {
    setIsShiftActive(false);
    if (shiftIntervalRef.current) clearInterval(shiftIntervalRef.current);
    if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    setIsReportOpen(true);
  };

  const handlePayRent = () => {
    const rentCost = 15;
    if (coins >= rentCost) {
      const nextCoins = coins - rentCost;
      const nextDay = day + 1;
      setCoins(nextCoins);
      setDay(nextDay);
      setIsReportOpen(false);
      saveStats(nextCoins, nextDay, shopRating, upgrades);
      setTextLog(`Rent of 15 Gold Coins paid successfully! Ready for Day ${nextDay}.`);
    } else {
      // Trigger Grace Period unscramble mini-game!
      setIsScrambleActive(true);
      startScrambleWord();
    }
  };

  // --- Cooking & Brewing Actions ---
  const startBrew = (itemId: string) => {
    const recipe = MENU.find((m) => m.id === itemId);
    if (!recipe) return;

    // Check cost
    if (coins < recipe.cost) {
      setTextLog("Baa! Not enough Gold Coins to buy ingredients for this recipe!");
      return;
    }

    // Pro machine modifier (40% speed up)
    const hasProMachine = upgrades.find((u) => u.id === "espresso_pro")?.purchased;
    const duration = hasProMachine ? Math.round(recipe.prepTime * 0.6) : recipe.prepTime;

    setCoins((c) => c - recipe.cost);
    setBrewQueue((prev) => [...prev, { id: recipe.id, name: recipe.name, progress: 0, duration }]);
    setTextLog(`Started brewing: ${recipe.name} (${duration}s timer)`);
  };

  const startBake = (itemId: string) => {
    const recipe = MENU.find((m) => m.id === itemId);
    if (!recipe) return;

    // Check cost
    if (coins < recipe.cost) {
      setTextLog("Baa! Not enough Gold Coins to buy ingredients for this recipe!");
      return;
    }

    // Pro oven modifier (35% speed up)
    const hasProOven = upgrades.find((u) => u.id === "oven_pro")?.purchased;
    const duration = hasProOven ? Math.round(recipe.prepTime * 0.65) : recipe.prepTime;

    setCoins((c) => c - recipe.cost);
    setBakeQueue((prev) => [...prev, { id: recipe.id, name: recipe.name, progress: 0, duration }]);
    setTextLog(`Baking in progress: ${recipe.name} (${duration}s timer)`);
  };

  const discardPickup = (index: number) => {
    setPickupCounter((prev) => prev.filter((_, i) => i !== index));
    setTextLog("Discarded food item from pickup counter.");
  };

  // --- Serve Customer ---
  const serveCustomer = (customer: Customer) => {
    // Check if pickup counter has all elements requested by the customer
    const orderList = [...customer.order];
    const pickupList = [...pickupCounter];

    const matchedIndices: number[] = [];
    let matchSuccessful = true;

    for (const orderItem of orderList) {
      const matchIndex = pickupList.findIndex((item) => item.id === orderItem);
      if (matchIndex !== -1) {
        matchedIndices.push(matchIndex);
        pickupList[matchIndex] = { id: "", name: "", emoji: "" }; // Consume item
      } else {
        matchSuccessful = false;
        break;
      }
    }

    if (matchSuccessful) {
      // Calculate earnings
      const totalEarned = customer.order.reduce((acc, orderId) => {
        const item = MENU.find((m) => m.id === orderId);
        return acc + (item ? item.price : 0);
      }, 0);

      // Patience bonus (extra coins if served quickly)
      const patienceBonus = customer.patience > customer.maxPatience * 0.75 ? 3 : 0;
      const finalEarning = totalEarned + patienceBonus;

      setCoins((c) => c + finalEarning);
      setCoinsEarnedToday((c) => c + finalEarning);
      setShopRating((r) => Math.min(100, r + 2));

      // Remove served customer and consumed items
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
      setPickupCounter((prev) => prev.filter((_, idx) => !matchedIndices.includes(idx)));

      setTextLog(`Success! Served cute animal customer. Earned +${finalEarning} Gold Coins! 🪙✨`);
    } else {
      setTextLog("Baa! You don't have the correct orders prepared on the pickup counter yet!");
    }
  };

  // --- Shop & Upgrades Actions ---
  const buyUpgrade = (item: UpgradeItem) => {
    if (coins < item.cost) {
      setTextLog("Baa! Not enough Gold Coins for this upgrade.");
      return;
    }

    const nextCoins = coins - item.cost;
    const nextUpgrades = upgrades.map((u) => (u.id === item.id ? { ...u, purchased: true } : u));
    setCoins(nextCoins);
    setUpgrades(nextUpgrades);
    setTextLog(`Unlocked: ${item.name}! Applied cozy stat benefits.`);
    saveStats(nextCoins, day, shopRating, nextUpgrades);
  };

  // --- Scripture Unscramble (Grace Period) ---
  const startScrambleWord = () => {
    const wordInfo = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    setScrambleInfo(wordInfo);
    
    // Scramble letters
    const letters = wordInfo.scrambled.split("").map((c, i) => ({
      id: i,
      char: c,
      clicked: false
    }));
    setScrambleLetters(letters);
    setScrambleAnswer([]);
    setScrambleMessage("");
  };

  const handleScrambleLetterClick = (letterId: number, char: string) => {
    setScrambleLetters((prev) => prev.map((l) => (l.id === letterId ? { ...l, clicked: true } : l)));
    setScrambleAnswer((prev) => [...prev, char]);
  };

  const handleScrambleUndo = () => {
    if (scrambleAnswer.length === 0) return;
    const removedChar = scrambleAnswer[scrambleAnswer.length - 1];
    setScrambleAnswer((prev) => prev.slice(0, -1));

    // Reset first clicked match in letters
    setScrambleLetters((prev) => {
      let found = false;
      return prev.map((l) => {
        if (!found && l.char === removedChar && l.clicked) {
          found = true;
          return { ...l, clicked: false };
        }
        return l;
      });
    });
  };

  const checkScrambleSubmit = () => {
    if (!scrambleInfo) return;
    const guess = scrambleAnswer.join("");
    if (guess === scrambleInfo.word) {
      // Unscramble success!
      const bonusCoins = 20; // rewards enough emergency cash
      const finalCoins = coins + bonusCoins;
      const nextDay = day + 1;
      setCoins(finalCoins);
      setDay(nextDay);
      setIsScrambleActive(false);
      setIsReportOpen(false);
      saveStats(finalCoins, nextDay, shopRating, upgrades);
      setTextLog(`Grace Period complete! Unscrambled correctly! (+20 Gold Coins) Paid Rent & advanced to Day ${nextDay}! 🎉`);
    } else {
      setScrambleMessage("Not quite correct. Try checking the letters order again!");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#FFF9F2] border-4 border-[#D3BFA7] rounded-[48px] overflow-hidden shadow-2xl relative select-none flex flex-col min-h-[580px]">
      
      {/* ─── HUD Top Status Bar ─── */}
      <div className="bg-[#4E342E] text-[#FFF9F2] p-4 flex items-center justify-between border-b-4 border-[#3D2723]">
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-amber-300 font-extrabold">Cozy Tabernacle</span>
          <span className="font-serif text-sm font-bold flex items-center gap-1.5">
            ☕ Grace Cafe
          </span>
        </div>
        
        {/* Day shift indicator */}
        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-amber-200">DAY {day}</span>
            <span className="text-[10px] font-extrabold text-stone-100 flex items-center gap-0.5">
              ⭐ {shopRating}% Rating
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#3D2723] flex items-center justify-center border border-amber-300/40 text-xs">
            {isShiftActive ? `⏰${dayTime}` : "💤"}
          </div>
        </div>
      </div>

      {/* ─── Main Shop View Backdrop Graphic ─── */}
      <div className="relative w-full h-48 bg-gradient-to-b from-[#EFEBE9] to-[#D7CCC8] border-b-4 border-[#A1887F] overflow-hidden flex items-end justify-center">
        {/* Soft Cafe Background elements */}
        {/* Chalkboard Menu */}
        <div className="absolute top-2 left-6 w-32 bg-stone-900 border border-stone-850 p-1.5 rounded-md text-[#F5F5F5] font-serif leading-tight shadow-md text-left z-0">
          <span className="text-[6.5px] uppercase font-bold text-amber-300 tracking-wider block border-b border-stone-800 pb-0.5 mb-0.5">Today's Grace</span>
          <span className="text-[6.5px] block">🍵 Living Water - Free</span>
          <span className="text-[6.5px] block">☕ Latte - $14</span>
          <span className="text-[6.5px] block">🧁 Daily Bread - $12</span>
        </div>

        {/* Cafe String Lights */}
        <div className="absolute top-1 right-2 left-2 flex justify-between pointer-events-none opacity-85 z-0">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-200/90 shadow-[0_0_6px_#fde047] animate-pulse" style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
        </div>

        {/* Cozy Placed Decors */}
        <div className="absolute bottom-16 right-4 flex items-center gap-2 pointer-events-none z-0">
          {upgrades.map((u) => u.type === "decor" && u.purchased && (
            <span key={u.id} className="text-3xl animate-bounce filter drop-shadow-sm" style={{ animationDuration: u.id === "hanging_plants" ? "4s" : "6s" }}>
              {u.id === "hanging_plants" ? "🌿" : "🖼️"}
            </span>
          ))}
        </div>

        {/* Hired Staff behind counter */}
        <div className="absolute bottom-14 left-8 flex items-center gap-2.5 pointer-events-none z-10">
          {upgrades.map((u) => u.type === "staff" && u.purchased && (
            <div key={u.id} className="flex flex-col items-center">
              <span className="text-[6px] font-bold text-stone-700 bg-white/70 px-1 rounded-sm shadow-xs mb-0.5">Helper</span>
              <span className="text-2xl animate-bounce" style={{ animationDuration: u.id === "helper_joy" ? "2.5s" : "3s" }}>🐑</span>
            </div>
          ))}
        </div>

        {/* Main Serving Counter */}
        <div className="w-full h-14 bg-gradient-to-r from-[#8D6E63] via-[#795548] to-[#8D6E63] border-t-2 border-t-[#5D4037] shadow-inner relative z-20 flex items-center px-4 justify-between">
          <div className="w-2.5 h-5 bg-[#3D2723] rounded-sm absolute left-1/2 top-0" />
          <div className="text-[8.5px] text-[#FFF] font-serif uppercase tracking-widest font-extrabold opacity-60">Selahly Grace Counter</div>
        </div>

        {/* Customer Queues (cute Animal vectors sitting/standing at counter) */}
        <div className="absolute bottom-0 right-4 left-4 flex gap-4 justify-end items-end z-30 pointer-events-auto">
          {customers.map((c) => (
            <div 
              key={c.id} 
              onClick={() => serveCustomer(c)} 
              className="flex flex-col items-center cursor-pointer hover:scale-105 active:scale-95 transition-all relative group"
            >
              {/* Customer Order Speech Bubble */}
              <div className="absolute bottom-16 bg-white border border-stone-250 p-1.5 rounded-2xl shadow-md text-[8.5px] font-bold text-stone-700 leading-tight w-24 text-center z-45 group-hover:scale-105 transition-all">
                <span className="block border-b border-stone-100 pb-0.5 mb-0.5 uppercase tracking-wide text-[7px] text-[#8D6E63]">wants:</span>
                {c.order.map((id) => {
                  const item = MENU.find((m) => m.id === id);
                  return (
                    <div key={id} className="flex justify-between">
                      <span>{item?.emoji}</span>
                      <span className="truncate">{item?.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Animal Character */}
              <CustomerAnimal type={c.type} patience={c.patience} />

              {/* Patience Hearts */}
              <div className="h-1.5 w-12 bg-stone-250 rounded-full overflow-hidden border border-stone-300 mt-1 shadow-inner relative">
                <div 
                  className={`h-full transition-all duration-300 ${c.patience < 35 ? "bg-red-400" : "bg-emerald-400"}`} 
                  style={{ width: `${(c.patience / c.maxPatience) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HUD Gold Coins display ─── */}
      <div className="bg-[#FAF0E6] py-2.5 px-4 flex justify-between items-center border-b border-[#D7CCC8] shadow-sm select-none">
        <span className="text-[10px] font-extrabold text-stone-900 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 px-3 py-1 rounded-full flex items-center gap-1 shadow-md border border-amber-300">
          ✨ 🪙 {coins} Gold Coins
        </span>

        <div className="flex gap-2">
          {/* Shop Toggle */}
          <button
            onClick={() => setIsShopOpen(true)}
            className="p-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-250 text-[#8D6E63] shadow-xs active:scale-90 transition-all cursor-pointer flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-3"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Shop
          </button>
        </div>
      </div>

      {/* ─── Text Log / Shepherd Dialogues ─── */}
      <div className="bg-[#FCF6E8] p-3 text-left border-b border-[#EFEBE9] text-[9.5px] leading-relaxed font-serif text-warm-cocoa font-medium italic min-h-[44px]">
        💬 {textLog}
      </div>

      {/* ─── Active Station Grid Areas ─── */}
      <div className="flex-1 p-3 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
        {!isShiftActive ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
            <span className="text-[10.5px] text-stone-400 font-bold uppercase tracking-widest">Store Closed</span>
            <button
              onClick={startDayShift}
              className="px-6 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Start Day {day} shift ☕✨
            </button>
          </div>
        ) : (
          <>
            {/* 1. PICKUP COUNTER */}
            <div className="bg-white border border-stone-200 p-2.5 rounded-2xl flex flex-col text-left">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1">Serving Pickup Counter</span>
              {pickupCounter.length === 0 ? (
                <span className="text-[9px] text-stone-400 italic py-1 block">Prepared orders load here...</span>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {pickupCounter.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="px-2.5 py-1 rounded-xl bg-[#FFF9F2] border border-[#E0D0C0] flex items-center gap-1 shadow-xs hover:border-red-400 transition-all cursor-pointer relative group"
                      onClick={() => discardPickup(idx)}
                    >
                      <span className="text-xs">{item.emoji}</span>
                      <span className="text-[9px] font-bold text-stone-700">{item.name}</span>
                      <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white w-3 h-3 rounded-full text-[6.5px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xs">X</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BREWING & BAKING QUEUES */}
            <div className="grid grid-cols-2 gap-3">
              {/* Brewing station queue list */}
              <div className="bg-[#FAF4EE]/75 border border-[#EFE5DC] p-2.5 rounded-2xl flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1.5">Brew Progress</span>
                {brewQueue.length === 0 ? (
                  <span className="text-[8.5px] text-stone-400 italic">No drinks brewing...</span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {brewQueue.map((item, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[8.5px] font-bold text-stone-700 truncate">{item.name}</span>
                        <div className="h-1 bg-stone-200 rounded-full overflow-hidden relative">
                          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(item.progress / item.duration) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Baking station queue list */}
              <div className="bg-[#FAF4EE]/75 border border-[#EFE5DC] p-2.5 rounded-2xl flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1.5">Bake Progress</span>
                {bakeQueue.length === 0 ? (
                  <span className="text-[8.5px] text-stone-400 italic">Oven empty...</span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {bakeQueue.map((item, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <span className="text-[8.5px] font-bold text-stone-700 truncate">{item.name}</span>
                        <div className="h-1 bg-stone-200 rounded-full overflow-hidden relative">
                          <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${(item.progress / item.duration) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. MENU STATIONS */}
            <div className="bg-white border border-stone-200 p-2.5 rounded-2xl flex flex-col text-left">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-450 block mb-1.5">Prepare Menu Items</span>
              <div className="grid grid-cols-2 gap-2">
                {MENU.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.type === "drink" ? startBrew(item.id) : startBake(item.id)}
                    className="p-1.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-white hover:bg-amber-50/10 text-left cursor-pointer transition-all active:scale-98 flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm select-none">{item.emoji}</span>
                      <div className="flex flex-col truncate">
                        <span className="text-[9px] font-bold text-stone-700 truncate">{item.name}</span>
                        <span className="text-[7.5px] text-stone-450">Cost: 🪙 {item.cost}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 rounded-md shrink-0 group-hover:scale-105 transition-all">
                      {item.type === "drink" ? "Brew" : "Bake"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── A. SHOP UPGRADES DRAWER OVERLAY ─── */}
      <AnimatePresence>
        {isShopOpen && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in">
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="bg-white rounded-t-[36px] w-full max-h-[85%] flex flex-col justify-between p-5 border-t-4 border-[#D3BFA7] shadow-2xl relative"
            >
              <button
                onClick={() => setIsShopOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full text-left">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-600 block">Expand Sanctuary</span>
                <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-4">
                  🛍️ Cozy Cafe Upgrades
                </h3>
              </div>

              {/* Upgrades List Container */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 pb-4">
                {upgrades.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl border border-stone-150 bg-stone-50/20 flex justify-between items-center text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-800">{item.name}</span>
                        <span className="text-[8.5px] text-stone-450 max-w-[200px] leading-tight">{item.description}</span>
                      </div>
                    </div>

                    {item.purchased ? (
                      <span className="text-[9.5px] font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-xl">Owned</span>
                    ) : (
                      <button
                        onClick={() => buyUpgrade(item)}
                        className="px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[10px] font-extrabold active:scale-95 transition-all cursor-pointer border border-amber-200/50"
                      >
                        🪙 {item.cost}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── B. DAY SHIFT REPORT MODAL OVERLAY ─── */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF9F2] border-4 border-[#A1887F] p-5 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[280px] flex flex-col justify-between"
            >
              <div className="w-full">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#795548] block">Shift Summary</span>
                <h3 className="font-serif text-sm font-bold text-stone-800 mb-4">
                  📋 Day Completed!
                </h3>
              </div>

              {/* Stats Sheet */}
              <div className="flex-1 flex flex-col gap-2.5 py-4 border-y border-[#EFEBE9] my-2 text-left text-xs text-stone-700">
                <div className="flex justify-between">
                  <span>Gold Coins Earned:</span>
                  <span className="font-bold text-emerald-600">+🪙 {coinsEarnedToday}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Rent Charge:</span>
                  <span className="font-bold text-red-500">-🪙 15</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2 mt-2 font-bold text-stone-850">
                  <span>Current Balance:</span>
                  <span className="text-amber-700">🪙 {coins} Gold Coins</span>
                </div>
              </div>

              {/* Controls */}
              <button
                onClick={handlePayRent}
                className="w-full py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-md cursor-pointer mt-4"
              >
                {coins >= 15 ? "Pay Rent 🪙15" : "Request Grace Period 🙏"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── C. GRACE PERIOD SCRIPTURE SCRAMBLE OVERLAY ─── */}
      <AnimatePresence>
        {isScrambleActive && scrambleInfo && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-amber-300 p-5 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[340px] flex flex-col justify-between"
            >
              <div className="w-full">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 block">Grace Period Challenge</span>
                <h3 className="font-serif text-sm font-bold text-amber-800 mb-1">
                  ✍️ Scripture Unscramble
                </h3>
                <p className="text-[9px] text-stone-500 italic mb-4">
                  Unscramble the holy word below to receive emergency Gold Coins!
                </p>
              </div>

              {/* Clue/Hint */}
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3 text-[10px] text-amber-900 font-bold mb-4">
                💡 Clue: "{scrambleInfo.clue}"
              </div>

              {/* Scrambled input display */}
              <div className="flex flex-col gap-1 items-center justify-center my-2">
                <span className="text-[8.5px] uppercase font-bold text-stone-400 tracking-wider">Your Answer:</span>
                <div className="flex gap-1 h-9 items-center justify-center border-b-2 border-dashed border-stone-300 w-full px-4 text-sm font-extrabold text-stone-850 tracking-widest">
                  {scrambleAnswer.length === 0 ? (
                    <span className="text-[10px] font-bold text-stone-400 italic">Tap letter blocks...</span>
                  ) : (
                    scrambleAnswer.join(" ")
                  )}
                </div>
              </div>

              {/* Clickable letter blocks */}
              <div className="flex gap-2 justify-center flex-wrap my-3">
                {scrambleLetters.map((l) => (
                  <button
                    key={l.id}
                    disabled={l.clicked}
                    onClick={() => handleScrambleLetterClick(l.id, l.char)}
                    className={`w-9 h-9 rounded-xl font-extrabold text-xs shadow-xs active:scale-90 transition-all cursor-pointer border flex items-center justify-center ${
                      l.clicked
                        ? "bg-stone-100 border-stone-200 text-stone-300 opacity-40 pointer-events-none"
                        : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    {l.char}
                  </button>
                ))}
              </div>

              {/* Scramble status/error messages */}
              {scrambleMessage && (
                <span className="text-[9px] font-bold text-red-500 italic block py-0.5">{scrambleMessage}</span>
              )}

              {/* Buttons */}
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={handleScrambleUndo}
                  className="flex-1 py-2 rounded-xl border border-stone-250 text-stone-600 font-bold text-[9.5px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  Undo
                </button>
                <button
                  onClick={checkScrambleSubmit}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[9.5px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
