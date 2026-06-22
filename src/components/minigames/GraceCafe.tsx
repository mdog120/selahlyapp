"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Heart, Lock, Check, Sparkles, Coffee, ChefHat, Trash2 } from "lucide-react";

// --- Types & Data ---
type AnimalType = "bunny" | "bear" | "kitty" | "fox" | "lamb";
type CustState = "walking_in" | "waiting_food" | "eating" | "leaving";

interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  type: "drink" | "food";
  cost: number;
  price: number;
  prepTime: number; // in seconds
  supply: number; // batch size
  unlockedAtDay: number;
  description: string;
}

const MENU: MenuItem[] = [
  { id: "choco_cookies", name: "Covenant Choco Chip Cookies", emoji: "🍪", type: "food", cost: 10, price: 15, prepTime: 0.5, supply: 4, unlockedAtDay: 1, description: "Classic chocolate chip cookies baked in a covenant of love." },
  { id: "frosted_cookies", name: "Faith Frosted Cookies", emoji: "🍪", type: "food", cost: 15, price: 30, prepTime: 1.0, supply: 6, unlockedAtDay: 1, description: "Sweet frosted cookies to fuel your faith." },
  { id: "cherub_cupcake", name: "Cherub Cupcakes", emoji: "🧁", type: "food", cost: 20, price: 5, prepTime: 2.0, supply: 25, unlockedAtDay: 1, description: "Bite-sized sweet cupcakes, fit for angels." },
  { id: "sanctuary_latte", name: "Sanctuary Latte", emoji: "☕", type: "drink", cost: 100, price: 120, prepTime: 3.0, supply: 3, unlockedAtDay: 1, description: "A warm cup of coffee brewed in the sanctuary." },
  
  { id: "pentecost_pancakes", name: "Pentecost Pancakes", emoji: "🥞", type: "food", cost: 25, price: 10, prepTime: 3.5, supply: 20, unlockedAtDay: 2, description: "Fluffy pancakes served with maple syrup." },
  { id: "divine_donuts", name: "Divine Donuts", emoji: "🍩", type: "food", cost: 25, price: 20, prepTime: 2.0, supply: 10, unlockedAtDay: 2, description: "Glazed donuts with divine sprinkles." },
  { id: "green_tea", name: "Living Water Green Tea", emoji: "🍵", type: "drink", cost: 120, price: 150, prepTime: 3.5, supply: 4, unlockedAtDay: 2, description: "A calming green tea brewed with living water." },
  
  { id: "grace_rolls", name: "Grace Cinnamon Rolls", emoji: "🍥", type: "food", cost: 30, price: 5, prepTime: 6.0, supply: 50, unlockedAtDay: 3, description: "Frosted warm rolls packed with grace." },
  { id: "manna_milkshake", name: "Manna Milkshake", emoji: "🥤", type: "drink", cost: 200, price: 300, prepTime: 1.0, supply: 3, unlockedAtDay: 3, description: "Rich creamy milkshake made of manna from heaven." },
  
  { id: "strawberry_cake", name: "Selah Strawberry Cake", emoji: "🍰", type: "food", cost: 45, price: 40, prepTime: 3.5, supply: 15, unlockedAtDay: 4, description: "Fresh strawberry layered cake." },
  { id: "bubble_tea", name: "Beatitude Bubble Tea", emoji: "🧋", type: "drink", cost: 200, price: 250, prepTime: 4.5, supply: 10, unlockedAtDay: 4, description: "Refreshing bubble tea with tapioca pearls." },
  
  { id: "hot_chocolate", name: "Heavenly Hot Chocolate", emoji: "🍫", type: "drink", cost: 250, price: 270, prepTime: 3.0, supply: 5, unlockedAtDay: 5, description: "Hot cocoa topped with whipped cream." }
];

interface Customer {
  id: string;
  type: AnimalType;
  order: string[]; // item IDs
  patience: number; // 0 to 100
  maxPatience: number;
  state: CustState;
  targetTableId: number | null; // null if take-out register queue
  x: number;
}

interface Table {
  id: number;
  name: string;
  x: number;
  status: "vacant" | "occupied" | "dirty";
  customerId: string | null;
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
const CustomerAnimal: React.FC<{ type: AnimalType; patience: number; state: CustState }> = ({ type, patience, state }) => {
  const isSad = patience < 35 && state !== "eating";
  const isEating = state === "eating";

  return (
    <svg viewBox="0 0 100 100" className="w-14 h-14 filter drop-shadow-md select-none pointer-events-none">
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
          {isEating ? (
            <>
              <path d="M 38 48 Q 41 53 44 48" fill="none" stroke="#4A343F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 56 48 Q 59 53 62 48" fill="none" stroke="#4A343F" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : isSad ? (
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
          {isEating ? (
            <>
              <path d="M 38 50 Q 41 54 44 50" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 56 50 Q 59 54 62 50" fill="none" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : isSad ? (
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
          {isEating ? (
            <>
              <path d="M 37 50 Q 40 55 43 50" fill="none" stroke="#37474F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 57 50 Q 60 55 63 50" fill="none" stroke="#37474F" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : isSad ? (
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
          {isEating ? (
            <>
              <path d="M 35 45 Q 39 49 43 45" fill="none" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 57 45 Q 61 49 65 45" fill="none" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : isSad ? (
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
          {isEating ? (
            <>
              <path d="M 39 49 Q 42 53 45 49" fill="none" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 55 49 Q 58 53 61 49" fill="none" stroke="#4E342E" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : isSad ? (
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
  const [coins, setCoins] = useState(100);
  const [day, setDay] = useState(1);
  const [dayTime, setDayTime] = useState(25); // default day shift: 25 seconds
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shopRating, setShopRating] = useState(100); // 0-100%
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Tables State (3 Tables: Table 1 at x=390, Table 2 at x=510, Table 3 at x=630)
  const [tables, setTables] = useState<Table[]>([
    { id: 1, name: "Cozy Table 1", x: 390, status: "vacant", customerId: null },
    { id: 2, name: "Cozy Table 2", x: 510, status: "vacant", customerId: null },
    { id: 3, name: "Cozy Table 3", x: 630, status: "vacant", customerId: null }
  ]);

  // Stations queues and Counter items
  const [brewQueue, setBrewQueue] = useState<{ id: string; name: string; progress: number; duration: number }[]>([]);
  const [bakeQueue, setBakeQueue] = useState<{ id: string; name: string; progress: number; duration: number }[]>([]);
  const [pickupCounter, setPickupCounter] = useState<{ id: string; name: string; emoji: string }[]>([]);

  // Shop & Upgrades
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>([
    { id: "oven_pro", name: "Pro Turbo Oven", emoji: "⚡🍳", cost: 250, type: "appliance", description: "Bakes cookies and cakes 35% faster.", purchased: false },
    { id: "espresso_pro", name: "Premium Espresso Machine", emoji: "⚡☕", cost: 300, type: "appliance", description: "Brews lattes and tea 40% faster.", purchased: false },
    { id: "scripture_frame", name: "Verses Frame", emoji: "🖼️✨", cost: 120, type: "decor", description: "Cozy scripture frame. Boosts customer starting patience by +20%.", purchased: false },
    { id: "hanging_plants", name: "Pothos Vines", emoji: "🌿💚", cost: 180, type: "decor", description: "Cozy plants. Customer patience drains 15% slower.", purchased: false },
    
    // Hired Staff
    { id: "staff_floofer", name: "Floofer", emoji: "🐶", cost: 160, type: "staff", description: "Dog helper. Reduces customer eating duration from 12s to 8.4s. (Wages: 🪙160/day)", purchased: false },
    { id: "staff_flash", name: "Flash", emoji: "🦥", cost: 100, type: "staff", description: "Sloth helper. Speeds up the day cycle, reducing shift from 25s to 20s. (Wages: 🪙60/day)", purchased: false },
    { id: "staff_cherry", name: "Cherry", emoji: "🐱", cost: 200, type: "staff", description: "Cat helper. Negates rating and tip penalties for slow service. (Wages: 🪙200/day)", purchased: false },
    { id: "staff_goldie", name: "Goldie", emoji: "🐹", cost: 300, type: "staff", description: "Hamster helper. Grants a 15% money multiplier at the end of each day. (Wages: 🪙300/day)", purchased: false },
    { id: "staff_muffin", name: "Muffin", emoji: "🐰", cost: 80, type: "staff", description: "Bunny helper. Automatically cleans dirty tables after 3 seconds. (Wages: 🪙20/day)", purchased: false }
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

  // Calculate day deductions
  const getStaffWages = () => {
    let wages = 0;
    if (upgrades.find(u => u.id === "staff_floofer")?.purchased) wages += 160;
    if (upgrades.find(u => u.id === "staff_flash")?.purchased) wages += 60;
    if (upgrades.find(u => u.id === "staff_cherry")?.purchased) wages += 200;
    if (upgrades.find(u => u.id === "staff_goldie")?.purchased) wages += 300;
    if (upgrades.find(u => u.id === "staff_muffin")?.purchased) wages += 20;
    return wages;
  };

  const getDayTotalDeductions = () => {
    return 10 + getStaffWages(); // Rent 10 + wages
  };

  // --- Local Storage Sync ---
  useEffect(() => {
    const saved = localStorage.getItem("selahly_grace_cafe_v2");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCoins(data.coins ?? 100);
        setDay(data.day ?? 1);
        setShopRating(data.shopRating ?? 100);
        if (data.upgrades) {
          setUpgrades((prev) =>
            prev.map((u) => {
              const savedU = data.upgrades.find((su: any) => su.id === u.id);
              return savedU ? { ...u, purchased: savedU.purchased } : u;
            })
          );
        }
      } catch (e) {
        console.error("Failed to load Grace Cafe save stats", e);
      }
    }
  }, []);

  const saveStats = (updatedCoins: number, updatedDay: number, updatedRating: number, updatedUpgrades: UpgradeItem[]) => {
    localStorage.setItem(
      "selahly_grace_cafe_v2",
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
    if (!isShiftActive) return;

    setCustomers((prev) => {
      if (prev.length >= 5) return prev; // Limit total active screen characters to 5

      const animalPool: AnimalType[] = ["bunny", "bear", "kitty", "fox", "lamb"];
      const randAnimal = animalPool[Math.floor(Math.random() * animalPool.length)];

      // Choose order items from unlocked menu
      const unlockedMenu = MENU.filter((m) => m.unlockedAtDay <= day);
      if (unlockedMenu.length === 0) return prev;

      const orderSize = Math.random() > 0.7 ? 2 : 1;
      const orderItems: string[] = [];
      for (let i = 0; i < orderSize; i++) {
        const item = unlockedMenu[Math.floor(Math.random() * unlockedMenu.length)];
        orderItems.push(item.id);
      }

      // Check decor upgrades for patience
      const hasFrame = upgrades.find((u) => u.id === "scripture_frame")?.purchased;
      const baseMax = hasFrame ? 120 : 100;

      // Find a vacant dining table
      let chosenTableId: number | null = null;
      let targetX = 220; // Default register queue position

      setTables((currTables) => {
        const vacantTable = currTables.find((t) => t.status === "vacant");
        if (vacantTable) {
          chosenTableId = vacantTable.id;
          targetX = vacantTable.x;
          // Set table as occupied
          return currTables.map((t) => (t.id === vacantTable.id ? { ...t, status: "occupied" } : t));
        }
        return currTables;
      });

      const newCust: Customer = {
        id: Math.random().toString(),
        type: randAnimal,
        order: orderItems,
        patience: baseMax,
        maxPatience: baseMax,
        state: "walking_in",
        targetTableId: chosenTableId,
        x: targetX
      };

      // Set state to waiting food after arrival animation (2 seconds)
      setTimeout(() => {
        setCustomers((curr) => 
          curr.map((cust) => (cust.id === newCust.id && cust.state === "walking_in" ? { ...cust, state: "waiting_food" } : cust))
        );
      }, 2000);

      const tableText = chosenTableId ? `taking seat at Cozy Table ${chosenTableId}` : "standing in the counter register queue";
      setTextLog(`A cute ${randAnimal} customer walked in, ${tableText}, and ordered: ${orderItems.map(id => MENU.find(m => m.id === id)?.name).join(", ")}!`);
      return [...prev, newCust];
    });
  };

  // --- Automation: Muffin clean-up routine ---
  useEffect(() => {
    const hasMuffin = upgrades.find((u) => u.id === "staff_muffin")?.purchased;
    if (!hasMuffin || !isShiftActive) return;

    const dirtyTable = tables.find((t) => t.status === "dirty");
    if (dirtyTable) {
      const timer = setTimeout(() => {
        busTable(dirtyTable.id);
        setTextLog(`Muffin clean-up: Automatically cleaned Cozy Table ${dirtyTable.id}! 🧹`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [tables, upgrades, isShiftActive]);

  // --- Core Game Loops (Time & Patience) ---
  useEffect(() => {
    if (isShiftActive) {
      // 1. Shift Timer
      shiftIntervalRef.current = setInterval(() => {
        setDayTime((prev) => {
          if (prev <= 1) {
            endDayShift();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Spawn Customers
      queueIntervalRef.current = setInterval(() => {
        spawnCustomer();
      }, 7000 + Math.random() * 3000);
    }

    return () => {
      if (shiftIntervalRef.current) clearInterval(shiftIntervalRef.current);
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    };
  }, [isShiftActive, day]);

  // 3. Customer patience draining and leaving
  useEffect(() => {
    let patienceInterval: NodeJS.Timeout;
    if (isShiftActive) {
      patienceInterval = setInterval(() => {
        const hasVines = upgrades.find((u) => u.id === "hanging_plants")?.purchased;
        const drainAmount = hasVines ? 1.7 : 2.0;

        setCustomers((prev) => {
          const updated = prev.map((c) => {
            if (c.state === "eating" || c.state === "leaving") return c;
            return {
              ...c,
              patience: Math.max(0, c.patience - drainAmount)
            };
          });

          // Identify leaving customers
          const lostPatience = updated.filter((c) => c.patience <= 0 && c.state !== "eating" && c.state !== "leaving");
          if (lostPatience.length > 0) {
            setShopRating((r) => Math.max(30, r - 5 * lostPatience.length));
            setTextLog("A customer lost patience and walked out! Ratings dropped.");
            
            // Clean table ownership
            setTables((currTables) => 
              currTables.map((t) => {
                const associatedLeaving = lostPatience.find((l) => l.targetTableId === t.id);
                if (associatedLeaving) {
                  return { ...t, status: "vacant", customerId: null };
                }
                return t;
              })
            );
          }

          return updated.filter((c) => c.patience > 0 || c.state === "eating" || c.state === "leaving");
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
              const recipe = MENU.find((m) => m.id === c.id);
              const supplyCount = recipe ? recipe.supply : 1;
              const newItems = Array.from({ length: supplyCount }).map(() => ({
                id: c.id,
                name: c.name,
                emoji: recipe?.emoji || "🍵"
              }));
              setPickupCounter((curr) => [...curr, ...newItems]);
            });
            setTextLog("Fresh beverage prepared and placed on counter.");
          }
          return next.filter((item) => item.progress < item.duration);
        });

        // Bake Station
        setBakeQueue((prev) => {
          const next = prev.map((item) => ({ ...item, progress: item.progress + 1 }));
          const completed = next.filter((item) => item.progress >= item.duration);
          if (completed.length > 0) {
            completed.forEach((c) => {
              const recipe = MENU.find((m) => m.id === c.id);
              const supplyCount = recipe ? recipe.supply : 1;
              const newItems = Array.from({ length: supplyCount }).map(() => ({
                id: c.id,
                name: c.name,
                emoji: recipe?.emoji || "🧁"
              }));
              setPickupCounter((curr) => [...curr, ...newItems]);
            });
            setTextLog("Oven DING! Baked pastry added to pickup counter.");
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
    
    // Check if Flash is hired to shorten day duration
    const hasFlash = upgrades.find((u) => u.id === "staff_flash")?.purchased;
    setDayTime(hasFlash ? 20 : 25);
    
    setCustomers([]);
    setTables([
      { id: 1, name: "Cozy Table 1", x: 390, status: "vacant", customerId: null },
      { id: 2, name: "Cozy Table 2", x: 510, status: "vacant", customerId: null },
      { id: 3, name: "Cozy Table 3", x: 630, status: "vacant", customerId: null }
    ]);
    setBrewQueue([]);
    setBakeQueue([]);
    setPickupCounter([]);
    setCoinsEarnedToday(0);
    setTextLog(`Day ${day} started! Preparing dining tables and registers... ☕`);
    spawnCustomer();
  };

  const endDayShift = () => {
    setIsShiftActive(false);
    if (shiftIntervalRef.current) clearInterval(shiftIntervalRef.current);
    if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
    setIsReportOpen(true);
  };

  const handlePayRent = () => {
    const totalDeduction = getDayTotalDeductions();
    
    if (coins >= totalDeduction) {
      let nextCoins = coins - totalDeduction;
      
      // Apply Goldie multiplier
      const hasGoldie = upgrades.find((u) => u.id === "staff_goldie")?.purchased;
      if (hasGoldie) {
        nextCoins = Math.round(nextCoins * 1.15);
      }
      
      const nextDay = day + 1;
      setCoins(nextCoins);
      setDay(nextDay);
      setIsReportOpen(false);
      saveStats(nextCoins, nextDay, shopRating, upgrades);
      setTextLog(`Rent and staff wages of ${totalDeduction} paid! ${hasGoldie ? "Goldie granted 15% balance multiplier!" : ""} Ready for Day ${nextDay}.`);
    } else {
      setIsScrambleActive(true);
      startScrambleWord();
    }
  };

  // --- Cooking & Brewing Actions ---
  const startBrew = (itemId: string) => {
    const recipe = MENU.find((m) => m.id === itemId);
    if (!recipe) return;

    if (coins < recipe.cost) {
      setTextLog("Baa! Not enough Gold Coins for ingredients!");
      return;
    }

    const hasProMachine = upgrades.find((u) => u.id === "espresso_pro")?.purchased;
    const duration = hasProMachine ? Math.round(recipe.prepTime * 0.6) : recipe.prepTime;

    setCoins((c) => c - recipe.cost);
    setBrewQueue((prev) => [...prev, { id: recipe.id, name: recipe.name, progress: 0, duration }]);
    setTextLog(`Started brewing: ${recipe.name}`);
  };

  const startBake = (itemId: string) => {
    const recipe = MENU.find((m) => m.id === itemId);
    if (!recipe) return;

    if (coins < recipe.cost) {
      setTextLog("Baa! Not enough Gold Coins for ingredients!");
      return;
    }

    const hasProOven = upgrades.find((u) => u.id === "oven_pro")?.purchased;
    const duration = hasProOven ? Math.round(recipe.prepTime * 0.65) : recipe.prepTime;

    setCoins((c) => c - recipe.cost);
    setBakeQueue((prev) => [...prev, { id: recipe.id, name: recipe.name, progress: 0, duration }]);
    setTextLog(`Started baking: ${recipe.name}`);
  };

  const discardPickup = (index: number) => {
    setPickupCounter((prev) => prev.filter((_, i) => i !== index));
    setTextLog("Discarded food item.");
  };

  // --- Dining Table cleaning ---
  const busTable = (tableId: number) => {
    setTables((curr) => 
      curr.map((t) => {
        if (t.id === tableId && t.status === "dirty") {
          setCoins((c) => c + 1); // small cleaning reward
          setTextLog(`Table cleaned! Earned +1 Gold Coin. Table is now vacant. ✨`);
          return { ...t, status: "vacant" };
        }
        return t;
      })
    );
  };

  // --- Serve Customer ---
  const serveCustomer = (customer: Customer) => {
    if (customer.state !== "waiting_food") return;

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

      const patienceBonus = customer.patience > customer.maxPatience * 0.75 ? 3 : 0;
      let finalEarning = totalEarned + patienceBonus;

      // Check for slow service penalty
      const isSlow = customer.patience < customer.maxPatience * 0.35;
      const stopSlow = upgrades.find((u) => u.id === "staff_cherry")?.purchased;
      
      let ratingEarned = 4;
      if (isSlow && !stopSlow) {
        finalEarning = Math.round(finalEarning * 0.5);
        ratingEarned = 1;
        setTextLog(`Slow service! Tip reduced by 50%. (Hire Cherry to stop this penalty).`);
      } else if (isSlow && stopSlow) {
        setTextLog(`Cherry prevented the slow service penalty! Full tip earned.`);
      }

      // Update customer state to eating
      setCustomers((prev) => 
        prev.map((c) => (c.id === customer.id ? { ...c, state: "eating", patience: c.maxPatience } : c))
      );

      // Clean matched counter items
      setPickupCounter((prev) => prev.filter((_, idx) => !matchedIndices.includes(idx)));

      // Check eating duration (Floofer helper reduces eating duration)
      const hasFloofer = upgrades.find((u) => u.id === "staff_floofer")?.purchased;
      const eatDuration = hasFloofer ? 8400 : 12000;

      setTimeout(() => {
        setCustomers((curr) => {
          const targetCust = curr.find((c) => c.id === customer.id);
          if (!targetCust) return curr;

          // Set customer state to leaving
          return curr.map((c) => (c.id === customer.id ? { ...c, state: "leaving" } : c));
        });

        // Add coins
        setCoins((c) => c + finalEarning);
        setCoinsEarnedToday((c) => c + finalEarning);
        setShopRating((r) => Math.min(100, r + ratingEarned));

        // Mark table as dirty (if they had a table)
        if (customer.targetTableId) {
          setTables((currTables) => 
            currTables.map((t) => (t.id === customer.targetTableId ? { ...t, status: "dirty" } : t))
          );
          setTextLog(`Customer finished eating! Left +${finalEarning} Gold Coins tip. Table is now dirty! 🧹`);
        } else {
          setTextLog(`Take-out customer finished! Left +${finalEarning} Gold Coins.`);
        }

        // Clean customer from state after exit walk (2 seconds)
        setTimeout(() => {
          setCustomers((curr) => curr.filter((c) => c.id !== customer.id));
        }, 2000);

      }, eatDuration);

    } else {
      setTextLog("Baa! You don't have the correct orders prepared on the pickup counter yet!");
    }
  };

  // --- Shop Upgrades Actions ---
  const buyUpgrade = (item: UpgradeItem) => {
    if (coins < item.cost) {
      setTextLog("Baa! Not enough Gold Coins for this upgrade.");
      return;
    }

    const nextCoins = coins - item.cost;
    const nextUpgrades = upgrades.map((u) => (u.id === item.id ? { ...u, purchased: true } : u));
    setCoins(nextCoins);
    setUpgrades(nextUpgrades);
    setTextLog(`Unlocked: ${item.name}! Applied cozy tycoon benefits.`);
    saveStats(nextCoins, day, shopRating, nextUpgrades);
  };

  // --- Scripture Unscramble (Grace Period) ---
  const startScrambleWord = () => {
    const wordInfo = SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
    setScrambleInfo(wordInfo);
    
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
      const totalDeduction = getDayTotalDeductions();
      const bonusCoins = totalDeduction + 10; // Give enough to pay bills + 10 pocket coins
      
      let finalCoins = coins + bonusCoins - totalDeduction;
      
      // Apply Goldie multiplier
      const hasGoldie = upgrades.find((u) => u.id === "staff_goldie")?.purchased;
      if (hasGoldie) {
        finalCoins = Math.round(finalCoins * 1.15);
      }
      
      const nextDay = day + 1;
      setCoins(finalCoins);
      setDay(nextDay);
      setIsScrambleActive(false);
      setIsReportOpen(false);
      saveStats(finalCoins, nextDay, shopRating, upgrades);
      setTextLog(`Grace Period complete! Unscrambled correctly! Paid Rent and wages & advanced to Day ${nextDay}! 🎉`);
    } else {
      setScrambleMessage("Not quite correct. Try checking the letters order again!");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-[#FFF9F2] border-4 border-[#D3BFA7] rounded-[36px] overflow-hidden shadow-2xl relative select-none flex flex-col min-h-[520px]">
      
      {/* ─── HUD Top Status Bar ─── */}
      <div className="bg-[#4E342E] text-[#FFF9F2] p-4 flex items-center justify-between border-b-4 border-[#3D2723]">
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider text-amber-300 font-extrabold">Cozy Tabernacle</span>
          <span className="font-serif text-sm font-bold flex items-center gap-1.5">
            ☕ Grace Cafe
          </span>
        </div>
        
        {/* Day shift indicator */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-bold text-amber-200">DAY {day}</span>
            <span className="text-[10px] font-extrabold text-stone-100 flex items-center gap-0.5">
              ⭐ {shopRating}% Rating
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#3D2723] flex items-center justify-center border border-amber-300/40 text-xs font-bold">
            {isShiftActive ? `${dayTime}s` : "💤"}
          </div>
        </div>
      </div>

      {/* ─── Cozy Cafe Room Floor View (Horizontal Aspect scrollable on small viewports) ─── */}
      <div className="relative w-full overflow-x-auto select-none scrollbar-thin">
        <div className="relative w-[760px] h-60 bg-gradient-to-b from-[#EFEBE9] to-[#D7CCC8] border-b-4 border-[#A1887F] overflow-hidden flex items-end">
          
          {/* Cafe wall details */}
          {/* String Lights */}
          <div className="absolute top-1 right-2 left-2 flex justify-between pointer-events-none opacity-85 z-0">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-amber-200/90 shadow-[0_0_6px_#fde047] animate-pulse" style={{ animationDelay: `${i * 0.25}s` }} />
            ))}
          </div>

          {/* Purchased Wall Decor Frame */}
          {upgrades.find(u => u.id === "scripture_frame")?.purchased && (
            <div className="absolute top-6 left-[280px] w-24 h-16 bg-[#FFF9F2] border-2 border-amber-800 rounded-sm shadow-md flex flex-col items-center justify-center p-1 z-0 rotate-1">
              <span className="text-[6.5px] uppercase font-bold text-amber-900 tracking-wider">Blessed</span>
              <span className="text-[5.5px] text-stone-600 font-serif italic text-center leading-none mt-1">"The Lord is my strength"</span>
            </div>
          )}

          {/* Purchased Hanging Plants */}
          {upgrades.find(u => u.id === "hanging_plants")?.purchased && (
            <div className="absolute top-0 right-[220px] text-3xl pointer-events-none z-0 animate-bounce" style={{ animationDuration: "5s" }}>
              🌿
            </div>
          )}

          {/* Kitchen counter chalkboard */}
          <div className="absolute top-3 left-4 w-36 bg-stone-900 border border-stone-800 p-1.5 rounded-md text-[#F5F5F5] font-serif leading-tight shadow-md text-left z-0">
            <span className="text-[6.5px] uppercase font-bold text-amber-300 tracking-wider block border-b border-stone-850 pb-0.5 mb-0.5">Unlocked Recipes</span>
            <span className="text-[5.5px] block truncate">🍪 Cookies (Day 1)</span>
            <span className="text-[5.5px] block truncate">🥞 Pancakes (Day 2)</span>
            <span className="text-[5.5px] block truncate">☕ Latte (Day 1)</span>
          </div>

          {/* Hired Staff behind counter */}
          <div className="absolute bottom-14 left-[50px] flex items-end gap-3 pointer-events-none z-10">
            {upgrades.find(u => u.id === "staff_floofer")?.purchased && (
              <div className="flex flex-col items-center">
                <span className="text-[5.5px] font-bold text-amber-900 bg-amber-50 px-1 rounded-sm shadow-xs mb-0.5">Floofer</span>
                <span className="text-xl animate-bounce" style={{ animationDuration: "2.5s" }}>🐶</span>
              </div>
            )}
            {upgrades.find(u => u.id === "staff_flash")?.purchased && (
              <div className="flex flex-col items-center">
                <span className="text-[5.5px] font-bold text-stone-900 bg-stone-50 px-1 rounded-sm shadow-xs mb-0.5">Flash</span>
                <span className="text-xl animate-pulse" style={{ animationDuration: "4s" }}>🦥</span>
              </div>
            )}
            {upgrades.find(u => u.id === "staff_cherry")?.purchased && (
              <div className="flex flex-col items-center">
                <span className="text-[5.5px] font-bold text-rose-900 bg-rose-50 px-1 rounded-sm shadow-xs mb-0.5">Cherry</span>
                <span className="text-xl animate-pulse" style={{ animationDuration: "1.5s" }}>🐱</span>
              </div>
            )}
            {upgrades.find(u => u.id === "staff_goldie")?.purchased && (
              <div className="flex flex-col items-center">
                <span className="text-[5.5px] font-bold text-yellow-900 bg-yellow-50 px-1 rounded-sm shadow-xs mb-0.5">Goldie</span>
                <span className="text-xl animate-bounce" style={{ animationDuration: "3s" }}>🐹</span>
              </div>
            )}
            {upgrades.find(u => u.id === "staff_muffin")?.purchased && (
              <div className="flex flex-col items-center">
                <span className="text-[5.5px] font-bold text-blue-900 bg-blue-50 px-1 rounded-sm shadow-xs mb-0.5">Muffin</span>
                <span className="text-xl animate-bounce" style={{ animationDuration: "2s" }}>🐰</span>
              </div>
            )}
          </div>

          {/* Kitchen Counter */}
          <div className="w-[320px] h-14 bg-gradient-to-r from-[#8D6E63] via-[#795548] to-[#8D6E63] border-t-2 border-[#5D4037] shadow-inner relative z-20 flex items-center px-4 justify-between shrink-0">
            <div className="flex gap-2.5 items-center">
              <span className="text-xs">📠</span>
              <span className="text-[7.5px] text-[#FFF] font-serif uppercase tracking-widest font-extrabold opacity-60">Prep Station</span>
            </div>
            
            {/* Appliance graphics */}
            <div className="flex gap-2">
              <span className={`text-lg transition-transform ${brewQueue.length > 0 ? "animate-bounce" : ""}`}>☕</span>
              <span className={`text-lg transition-transform ${bakeQueue.length > 0 ? "animate-pulse" : ""}`}>🍳</span>
            </div>
          </div>

          {/* Dining Area Tables (rendering wood tables & chairs) */}
          <div className="flex-1 h-14 bg-[#BCAAA4] border-t-2 border-[#8D6E63] relative z-10 flex justify-around px-4">
            {tables.map((t) => (
              <div key={t.id} className="relative w-20 flex justify-center z-15">
                {/* Table structure rendering */}
                <div 
                  className={`absolute -top-12 w-16 h-8 rounded-full border flex flex-col items-center justify-center shadow-md transition-all ${
                    t.status === "dirty" 
                      ? "bg-[#D7CCC8] border-amber-500 hover:bg-amber-100/50 cursor-pointer" 
                      : "bg-[#FFF9F2] border-stone-200"
                  }`}
                  onClick={() => t.status === "dirty" && busTable(t.id)}
                >
                  {t.status === "dirty" ? (
                    <span className="text-[8px] font-extrabold text-amber-800 flex flex-col items-center leading-none animate-pulse">
                      <span>🍽️🧹</span>
                      <span className="text-[6px] tracking-wide mt-0.5">CLEAN</span>
                    </span>
                  ) : (
                    <span className="text-[6.5px] text-[#8D6E63] font-bold uppercase tracking-wider">{t.name}</span>
                  )}
                </div>
                {/* Chair right next to the table */}
                <div className="absolute -top-6 -right-1 w-6 h-6 rounded-md bg-[#8D6E63]/80 border border-[#5D4037] shadow-sm z-0" />
              </div>
            ))}
          </div>

          {/* Customer Animations viewport */}
          <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-30">
            <AnimatePresence>
              {customers.map((c) => {
                const isWaiting = c.state === "waiting_food";
                const isLeaving = c.state === "leaving";
                const startX = 0;
                const endX = isLeaving ? 760 : c.x;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ x: startX, opacity: 0 }}
                    animate={{ x: endX, opacity: 1 }}
                    exit={{ x: 760, opacity: 0 }}
                    transition={{ duration: 2.0, ease: "easeOut" }}
                    onClick={() => serveCustomer(c)}
                    className="absolute bottom-2 flex flex-col items-center pointer-events-auto cursor-pointer"
                    style={{ left: 0 }}
                  >
                    {/* Order Speech bubble */}
                    {isWaiting && (
                      <div className="absolute bottom-16 bg-white border border-stone-250 p-1.5 rounded-2xl shadow-md text-[8px] font-bold text-stone-700 leading-tight w-24 text-center z-45 animate-bounce flex flex-col gap-0.5">
                        <span className="text-[6.5px] uppercase tracking-wide text-amber-700 block border-b pb-0.5 mb-0.5">Order:</span>
                        {c.order.map((id) => {
                          const item = MENU.find((m) => m.id === id);
                          return (
                            <div key={id} className="flex justify-between items-center">
                              <span>{item?.emoji}</span>
                              <span className="truncate">{item?.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Happy Sparkle overlay if eating */}
                    {c.state === "eating" && (
                      <div className="absolute bottom-16 text-xs text-[#8D6E63] font-extrabold animate-bounce">
                        😋💖 Delicious!
                      </div>
                    )}

                    {/* Animal Character rendering */}
                    <CustomerAnimal type={c.type} patience={c.patience} state={c.state} />

                    {/* Patience bar if waiting */}
                    {isWaiting && (
                      <div className="h-1.5 w-12 bg-stone-200 rounded-full overflow-hidden border border-stone-300 mt-1 shadow-inner relative">
                        <div 
                          className={`h-full transition-all duration-300 ${c.patience < 35 ? "bg-red-400" : "bg-emerald-400"}`} 
                          style={{ width: `${(c.patience / c.maxPatience) * 100}%` }} 
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ─── HUD Gold Coins display ─── */}
      <div className="bg-[#FAF0E6] py-3 px-6 flex justify-between items-center border-b border-[#D7CCC8] shadow-sm select-none">
        <span className="text-[10px] font-extrabold text-stone-900 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 px-3.5 py-1 rounded-full flex items-center gap-1 shadow-md border border-amber-300">
          ✨ 🪙 {coins} Gold Coins
        </span>

        <button
          onClick={() => setIsShopOpen(true)}
          className="p-1.5 rounded-full bg-white hover:bg-stone-50 border border-stone-250 text-[#8D6E63] shadow-xs active:scale-90 transition-all cursor-pointer flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-3.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" /> Hired Staff & Shop
        </button>
      </div>

      {/* ─── Status Text Logs ─── */}
      <div className="bg-[#FCF6E8] p-3 text-left border-b border-[#EFEBE9] text-[9.5px] leading-relaxed font-serif text-warm-cocoa font-medium italic min-h-[44px]">
        💬 {textLog}
      </div>

      {/* ─── Active Station Grid Areas ─── */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        {!isShiftActive ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
            <span className="text-[10.5px] text-stone-400 font-bold uppercase tracking-widest">Sanctuary Café Closed</span>
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
            <div className="bg-white border border-stone-200 p-3 rounded-2xl flex flex-col text-left">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1">Serving Pickup Counter (Click to discard)</span>
              {pickupCounter.length === 0 ? (
                <span className="text-[9.5px] text-stone-400 italic py-1 block">Ready beverages and pastries load here...</span>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {pickupCounter.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="px-2.5 py-1 rounded-xl bg-[#FFF9F2] border border-[#E0D0C0] flex items-center gap-1 shadow-xs hover:border-red-400 transition-all cursor-pointer relative group"
                      onClick={() => discardPickup(idx)}
                    >
                      <span className="text-xs">{item.emoji}</span>
                      <span className="text-[9.5px] font-bold text-stone-750">{item.name}</span>
                      <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white w-3 h-3 rounded-full text-[6.5px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-xs">X</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. BREWING & BAKING QUEUES */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FAF4EE]/75 border border-[#EFE5DC] p-3 rounded-2xl flex flex-col text-left">
                <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1.5 flex items-center gap-1"><Coffee className="w-3.5 h-3.5" /> Brew Progress (Max 3)</span>
                {brewQueue.length === 0 ? (
                  <span className="text-[9px] text-stone-400 italic">No drinks brewing...</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {brewQueue.map((item, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-stone-750 truncate">{item.name}</span>
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden relative">
                          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(item.progress / item.duration) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#FAF4EE]/75 border border-[#EFE5DC] p-3 rounded-2xl flex flex-col text-left">
                <span className="text-[8.5px] uppercase tracking-wider font-extrabold text-stone-400 block mb-1.5 flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> Bake Progress (Max 3)</span>
                {bakeQueue.length === 0 ? (
                  <span className="text-[9px] text-stone-400 italic">Oven empty...</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {bakeQueue.map((item, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-stone-750 truncate">{item.name}</span>
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden relative">
                          <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${(item.progress / item.duration) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. MENU STATIONS */}
            <div className="bg-white border border-stone-200 p-3 rounded-2xl flex flex-col text-left">
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-stone-450 block mb-2">Order Recipes Stations</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {MENU.map((item) => {
                  const isLocked = item.unlockedAtDay > day;
                  return (
                    <button
                      key={item.id}
                      disabled={isLocked || (item.type === "drink" ? brewQueue.length >= 3 : bakeQueue.length >= 3)}
                      onClick={() => item.type === "drink" ? startBrew(item.id) : startBake(item.id)}
                      className={`p-2 rounded-xl border text-left transition-all flex justify-between items-center group relative ${
                        isLocked 
                          ? "bg-stone-50 border-stone-150 opacity-60 cursor-not-allowed" 
                          : "bg-white border-stone-200 hover:border-amber-300 hover:bg-amber-50/10 cursor-pointer active:scale-98"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isLocked ? (
                          <span className="text-sm text-stone-400"><Lock className="w-3.5 h-3.5" /></span>
                        ) : (
                          <span className="text-base select-none">{item.emoji}</span>
                        )}
                        <div className="flex flex-col truncate">
                          <span className="text-[9.5px] font-bold text-stone-700 truncate">{item.name}</span>
                          <span className="text-[8px] text-stone-500">
                            {isLocked ? `Day ${item.unlockedAtDay} Unlock` : `Cost: 🪙${item.cost} (x${item.supply})`}
                          </span>
                        </div>
                      </div>
                      {!isLocked && (
                        <span className="text-[9px] font-bold text-[#8D6E63] bg-[#FAF0E6] px-1.5 py-0.5 rounded-md shrink-0 group-hover:scale-105 transition-all">
                          {item.type === "drink" ? "Brew" : "Bake"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── A. SHOP UPGRADES OVERLAY ─── */}
      <AnimatePresence>
        {isShopOpen && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in">
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="bg-white rounded-t-[36px] w-full max-h-[85%] flex flex-col justify-between p-6 border-t-4 border-[#D3BFA7] shadow-2xl relative"
            >
              <button
                onClick={() => setIsShopOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full text-left">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-amber-600 block">Expand Cafe Shop</span>
                <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-4">
                  🛍️ Hired Staff & Upgrades Shop
                </h3>
              </div>

              {/* Upgrades list */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 pb-4">
                {upgrades.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl border border-stone-150 bg-stone-50/20 flex justify-between items-center text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-800">{item.name}</span>
                        <span className="text-[9px] text-stone-500 max-w-[220px] leading-tight">{item.description}</span>
                      </div>
                    </div>

                    {item.purchased ? (
                      <span className="text-[9.5px] font-bold text-stone-450 bg-stone-100 px-3.5 py-1 rounded-xl">Owned</span>
                    ) : (
                      <button
                        onClick={() => buyUpgrade(item)}
                        className="px-3.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-150 text-amber-900 text-[10px] font-extrabold active:scale-95 transition-all cursor-pointer border border-amber-200/50"
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

      {/* ─── B. SHIFT SUMMARY REPORT OVERLAY ─── */}
      <AnimatePresence>
        {isReportOpen && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF9F2] border-4 border-[#A1887F] p-6 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[300px] flex flex-col justify-between"
            >
              <div className="w-full">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#795548] block">Shift Summary</span>
                <h3 className="font-serif text-sm font-bold text-stone-850 mb-4">
                  📋 Day Completed!
                </h3>
              </div>

              <div className="flex-1 flex flex-col gap-2.5 py-4 border-y border-[#EFEBE9] my-2 text-left text-xs text-stone-700">
                <div className="flex justify-between">
                  <span>Gold Coins Earned:</span>
                  <span className="font-bold text-emerald-600">+🪙 {coinsEarnedToday}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Rent Charge:</span>
                  <span className="font-bold text-red-500">-🪙 10</span>
                </div>
                {getStaffWages() > 0 && (
                  <div className="flex justify-between">
                    <span>Hired Staff Wages:</span>
                    <span className="font-bold text-red-400">-🪙 {getStaffWages()}</span>
                  </div>
                )}
                {upgrades.find(u => u.id === "staff_goldie")?.purchased && (
                  <div className="flex justify-between text-yellow-600 font-bold">
                    <span>Goldie 15% Balance Boost:</span>
                    <span>Applied 💫</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed pt-2 mt-2 font-bold text-stone-850">
                  <span>Final balance after deductions:</span>
                  <span className="text-amber-700">🪙 {coins} Gold Coins</span>
                </div>
              </div>

              <button
                onClick={handlePayRent}
                className="w-full py-2.5 rounded-2xl bg-[#795548] hover:bg-[#5D4037] text-white font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-md cursor-pointer mt-4"
              >
                {coins >= getDayTotalDeductions() 
                  ? `Pay rent & wages 🪙${getDayTotalDeductions()}` 
                  : "Request Grace Period 🙏"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── C. SCRIPTURE UNSCRAMBLE DRAWER (GRACE PERIOD) ─── */}
      <AnimatePresence>
        {isScrambleActive && scrambleInfo && (
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-amber-300 p-6 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[340px] flex flex-col justify-between"
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

              {/* Input display */}
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

              {/* Letters selection */}
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

              {scrambleMessage && (
                <span className="text-[9px] font-bold text-red-500 italic block py-0.5">{scrambleMessage}</span>
              )}

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
