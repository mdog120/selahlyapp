"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Lock, Sparkles, Coffee, ChefHat, Star, Clock3 } from "lucide-react";

// --- Types & Data ---
type AnimalType = "bunny" | "bear" | "kitty" | "fox" | "lamb";
type CustState = "entering" | "reading" | "waiting" | "eating" | "leaving";
type Station = "oven" | "drinks";
type CafeRoom = "lobby" | "seating" | "kitchen";

interface MenuItem {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  station: Station;
  ingredientCost: number;
  price: number;
  batch: number;
  seconds: number;
  unlockDay: number;
  description: string;
}

interface Customer {
  id: string;
  type: AnimalType;
  order: string[]; // item IDs
  patience: number;
  maxPatience: number;
  tableId: number;
  state: CustState;
}

interface CookingJob {
  jobId: string;
  itemId: string;
  startedAt: number;
  finishesAt: number;
}

interface UpgradeItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  type: "appliance" | "decor" | "staff";
  description: string;
  purchased: boolean;
  wage?: number;
}

interface ScrambleWord {
  word: string;
  scrambled: string;
  clue: string;
}

const MENU: MenuItem[] = [
  { id: "choco_cookies", name: "Covenant Choco Cookies", shortName: "Choco cookies", emoji: "🍪", station: "oven", ingredientCost: 8, price: 15, batch: 4, seconds: 3, unlockDay: 1, description: "Classic chocolate chip cookies baked in a covenant of love." },
  { id: "frosted_cookies", name: "Faith Frosted Cookies", shortName: "Frosted cookies", emoji: "🧁", station: "oven", ingredientCost: 10, price: 20, batch: 3, seconds: 4, unlockDay: 1, description: "Sweet frosted cookies to fuel your faith." },
  { id: "cherub_cupcake", name: "Cherub Cupcakes", shortName: "Cherub cupcakes", emoji: "🧁", station: "oven", ingredientCost: 15, price: 25, batch: 5, seconds: 5, unlockDay: 1, description: "Bite-sized sweet cupcakes, fit for angels." },
  { id: "sanctuary_latte", name: "Sanctuary Latte", emoji: "☕", shortName: "Sanctuary latte", station: "drinks", ingredientCost: 20, price: 45, batch: 2, seconds: 4, unlockDay: 1, description: "A warm cup of coffee brewed in the sanctuary." },
  
  { id: "pentecost_pancakes", name: "Pentecost Pancakes", emoji: "🥞", shortName: "Pentecost pancakes", station: "oven", ingredientCost: 25, price: 50, batch: 2, seconds: 6, unlockDay: 2, description: "Fluffy pancakes served with maple syrup." },
  { id: "divine_donuts", name: "Divine Donuts", emoji: "🍩", shortName: "Divine donuts", station: "oven", ingredientCost: 25, price: 40, batch: 3, seconds: 5, unlockDay: 2, description: "Glazed donuts with divine sprinkles." },
  { id: "green_tea", name: "Living Water Green Tea", emoji: "🍵", shortName: "Green tea", station: "drinks", ingredientCost: 30, price: 60, batch: 2, seconds: 5, unlockDay: 2, description: "A calming green tea brewed with living water." },
  { id: "matcha_boba", name: "Sanctuary Matcha Boba", emoji: "🧋🍵", shortName: "Matcha boba", station: "drinks", ingredientCost: 35, price: 80, batch: 2, seconds: 5, unlockDay: 2, description: "Creamy stone-ground green tea boba with tapioca pearls." },
  
  { id: "grace_rolls", name: "Grace Cinnamon Rolls", emoji: "🍥", shortName: "Cinnamon rolls", station: "oven", ingredientCost: 35, price: 75, batch: 4, seconds: 7, unlockDay: 3, description: "Frosted warm rolls packed with grace." },
  { id: "manna_milkshake", name: "Manna Milkshake", emoji: "🥤", shortName: "Manna milkshake", station: "drinks", ingredientCost: 40, price: 90, batch: 2, seconds: 4, unlockDay: 3, description: "Rich creamy milkshake made of manna." },
  { id: "dirty_boba", name: "Heavenly Dirty Boba", emoji: "🧋🍮", shortName: "Dirty boba", station: "drinks", ingredientCost: 45, price: 110, batch: 2, seconds: 5, unlockDay: 3, description: "Rich brown sugar milk tea with caramel walling and warm boba." },
  
  { id: "strawberry_cake", name: "Selah Strawberry Cake", emoji: "🍰", shortName: "Strawberry cake", station: "oven", ingredientCost: 45, price: 110, batch: 2, seconds: 8, unlockDay: 4, description: "Fresh strawberry layered cake." },
  { id: "mango_boba", name: "Eden Mango Boba", emoji: "🧋🥭", shortName: "Mango boba", station: "drinks", ingredientCost: 55, price: 130, batch: 2, seconds: 5, unlockDay: 4, description: "Sweet tropical mango nectar blended with milk and boba." },
  
  { id: "heavenly_waffles", name: "Heavenly Waffles", emoji: "🧇", shortName: "Waffles", station: "oven", ingredientCost: 70, price: 180, batch: 3, seconds: 6, unlockDay: 5, description: "Fluffy honey-glazed waffles straight from heaven." },
  { id: "hot_chocolate", name: "Heavenly Hot Chocolate", emoji: "🍫", shortName: "Hot chocolate", station: "drinks", ingredientCost: 60, price: 150, batch: 2, seconds: 5, unlockDay: 5, description: "Hot cocoa topped with whipped cream." },
  { id: "strawberry_boba", name: "Selah Strawberry Boba", emoji: "🧋🍓", shortName: "Strawberry boba", station: "drinks", ingredientCost: 65, price: 160, batch: 2, seconds: 6, unlockDay: 5, description: "Fresh strawberry puree layered with creamy milk and tapioca." },
  
  { id: "sacred_scones", name: "Sacred Blueberry Scones", emoji: "🥮", shortName: "Blueberry scones", station: "oven", ingredientCost: 80, price: 210, batch: 4, seconds: 7, unlockDay: 6, description: "Warm butter scones infused with sacred berries." },
  { id: "peace_matcha", name: "Peaceful Matcha Latte", emoji: "🍵", shortName: "Matcha latte", station: "drinks", ingredientCost: 90, price: 240, batch: 2, seconds: 5, unlockDay: 6, description: "Wholesome green tea latte for a quiet spirit." },
  { id: "vietnamese_boba", name: "Covenant Vietnam Boba", emoji: "🧋☕", shortName: "Vietnam boba", station: "drinks", ingredientCost: 85, price: 220, batch: 2, seconds: 6, unlockDay: 6, description: "Strong drip coffee with sweet condensed milk and chewy boba." },
  
  { id: "grace_macarons", name: "Graceful French Macarons", emoji: "🍥", shortName: "Macarons", station: "oven", ingredientCost: 110, price: 300, batch: 6, seconds: 8, unlockDay: 7, description: "Colorfully delicate French macarons packed with grace." },
  { id: "eden_smoothie", name: "Eden Garden Green Smoothie", emoji: "🥤", shortName: "Green smoothie", station: "drinks", ingredientCost: 120, price: 330, batch: 2, seconds: 6, unlockDay: 7, description: "Fresh blended organic fruits and greens from Eden." },
  { id: "slushie_boba", name: "Beatitude Slushie Boba", emoji: "🧋❄️", shortName: "Slushie boba", station: "drinks", ingredientCost: 115, price: 290, batch: 2, seconds: 6, unlockDay: 7, description: "Icy blended fruit slushie topped with popping honey boba." },
  
  { id: "revelation_cake", name: "Revelation Lava Cake", emoji: "🎂", shortName: "Lava cake", station: "oven", ingredientCost: 150, price: 420, batch: 2, seconds: 10, unlockDay: 8, description: "Rich chocolate lava cake revealing sweet molten goodness." },
  { id: "seraphim_shake", name: "Seraphim Gold Shake", emoji: "🧋", shortName: "Gold milkshake", station: "drinks", ingredientCost: 160, price: 450, batch: 2, seconds: 7, unlockDay: 8, description: "Spiced golden milkshake fit for angels." }
];

const SCRAMBLE_WORDS: ScrambleWord[] = [
  { word: "FAITHFUL", scrambled: "IFAHTLFU", clue: "God is ___ and true." },
  { word: "SHEPHERD", scrambled: "PEHDRESH", clue: "The Lord is my ___." },
  { word: "SALVATION", scrambled: "TIANASLOV", clue: "The helmet of ___." },
  { word: "GRACE", scrambled: "REGAC", clue: "Saved by His ___." },
  { word: "BLESSING", scrambled: "LSEBSIGN" , clue: "Count your ___ one by one." },
  { word: "PEACEFUL", scrambled: "EAEFCLUP", clue: "A calm and quiet heart." }
];

const TABLES = [
  { id: 1, left: "28%" },
  { id: 2, left: "50%" },
  { id: 3, left: "72%" }
];

const LOBBY_WAITING_SPOTS = [
  { left: "50%", bottom: 48, delay: 0.05 },
  { left: "65%", bottom: 38, delay: 0.22 },
  { left: "78%", bottom: 44, delay: 0.38 },
  { left: "40%", bottom: 32, delay: 0.14 }
];

const TUTORIAL_STEPS = [
  {
    title: "Welcome guests",
    detail: "Customers stroll into the lobby, read the menu, then show what they want. When they are ready, tap them and choose an open table.",
    room: "Lobby"
  },
  {
    title: "Prep orders",
    detail: "Go to the kitchen, pick recipes from the book, and collect finished batches from the oven or espresso machine.",
    room: "Kitchen"
  },
  {
    title: "Serve and clean",
    detail: "Return to the dining room, tap waiting guests to serve complete orders, then clean tables after they leave.",
    room: "Dining Room"
  },
  {
    title: "Grow the cafe",
    detail: "Use coins for staff, decor, and better appliances. Pay rent at the end of each day to keep Grace Cafe open.",
    room: "Upgrades"
  }
];

const SAVE_KEY = "selahly_grace_cafe_v3";
const SHIFT_LENGTH = 300; // standard 5m shift

// --- Scratch-inspired animal character components ---
const CHARACTER_STYLES: Record<AnimalType, {
  body: string;
  outline: string;
  inner: string;
  blush: string;
  outfit: string;
  accent: string;
}> = {
  bunny: { body: "#fff7f8", outline: "#6b4a3a", inner: "#ffd8df", blush: "#f4b4bf", outfit: "#dfead2", accent: "#9ab684" },
  bear: { body: "#d7aa83", outline: "#5b3525", inner: "#f2d0b0", blush: "#e9a79b", outfit: "#fff7e6", accent: "#b98562" },
  kitty: { body: "#f5f0e9", outline: "#574132", inner: "#f8cbc6", blush: "#eeb2ad", outfit: "#e6f3e1", accent: "#98b89a" },
  fox: { body: "#d9824e", outline: "#5b3322", inner: "#fff5df", blush: "#efaa92", outfit: "#f9e0a8", accent: "#a35e37" },
  lamb: { body: "#fffaf0", outline: "#6a5547", inner: "#f2dbc4", blush: "#f2b8ad", outfit: "#dce8f2", accent: "#9fb9c9" }
};

type StaffKey = "muffin" | "cherry" | "floofer" | "goldie" | "flash";

const StaffAnimal: React.FC<{ staff: StaffKey; className?: string }> = ({ staff, className = "w-14 h-14" }) => {
  const staffToType: Record<StaffKey, AnimalType> = {
    muffin: "bunny",
    cherry: "kitty",
    floofer: "bear",
    goldie: "bear",
    flash: "lamb"
  };

  return (
    <div className={className}>
      <CustomerAnimal
        type={staffToType[staff]}
        patience={100}
        state="waiting"
        accessory={staff === "cherry" ? "bow" : staff === "goldie" ? "coin" : staff === "flash" ? "cap" : staff === "floofer" ? "apron" : "kerchief"}
      />
    </div>
  );
};

const getStaffKey = (upgradeId: string): StaffKey | null => {
  if (upgradeId === "staff_muffin") return "muffin";
  if (upgradeId === "staff_cherry") return "cherry";
  if (upgradeId === "staff_floofer") return "floofer";
  if (upgradeId === "staff_goldie") return "goldie";
  if (upgradeId === "staff_flash") return "flash";
  return null;
};

const CustomerAnimal: React.FC<{
  type: AnimalType;
  patience: number;
  state: CustState;
  pose?: "standing" | "walking" | "sitting";
  accessory?: "bow" | "coin" | "cap" | "apron" | "kerchief";
}> = ({ type, patience, state, pose = "standing", accessory }) => {
  const isSad = patience < 35 && state !== "eating";
  const isEating = state === "eating";
  const isWalking = pose === "walking";
  const isSitting = pose === "sitting";
  const style = CHARACTER_STYLES[type];
  const eyeStroke = style.outline;

  const eyes = (() => {
    if (isEating) {
      return (
        <>
          <path d="M34 42 Q38 47 42 42" fill="none" stroke={eyeStroke} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M58 42 Q62 47 66 42" fill="none" stroke={eyeStroke} strokeWidth="3.4" strokeLinecap="round" />
        </>
      );
    }

    if (isSad) {
      return (
        <>
          <path d="M34 45 Q38 40 43 45" fill="none" stroke={eyeStroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M57 45 Q62 40 66 45" fill="none" stroke={eyeStroke} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    }

    return (
      <>
        <ellipse cx="38" cy="43" rx="3.4" ry="5.2" fill={eyeStroke} />
        <ellipse cx="62" cy="43" rx="3.4" ry="5.2" fill={eyeStroke} />
        <circle cx="36.8" cy="41" r="1.1" fill="#fffdf7" />
        <circle cx="60.8" cy="41" r="1.1" fill="#fffdf7" />
      </>
    );
  })();

  return (
    <svg viewBox="0 0 100 110" className="h-16 w-16 select-none overflow-visible drop-shadow-md pointer-events-none">
      <ellipse cx="50" cy="97" rx={isSitting ? "25" : "20"} ry="5" fill="#6F5144" opacity="0.16" />
      <motion.g
        stroke={style.outline}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isWalking ? { y: [0, -2.5, 0], rotate: [-1.5, 1.5, -1.5] } : isSitting ? { y: [2, 1, 2] } : { y: [0, -1.5, 0] }}
        transition={isWalking ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" } : { repeat: Infinity, duration: 2.1, ease: "easeInOut" }}
        style={{ transformOrigin: "50px 78px" }}
      >
        {type === "bunny" && (
          <>
            <motion.ellipse cx="35" cy="20" rx="8" ry="19" fill={style.body} strokeWidth="3" transform="rotate(-8 35 20)" animate={isWalking ? { rotate: [-10, -2, -10] } : { rotate: [-8, -12, -8] }} transition={{ repeat: Infinity, duration: isWalking ? 0.55 : 2.2 }} style={{ transformOrigin: "35px 39px" }} />
            <motion.ellipse cx="65" cy="20" rx="8" ry="19" fill={style.body} strokeWidth="3" transform="rotate(8 65 20)" animate={isWalking ? { rotate: [10, 2, 10] } : { rotate: [8, 12, 8] }} transition={{ repeat: Infinity, duration: isWalking ? 0.55 : 2.2 }} style={{ transformOrigin: "65px 39px" }} />
            <ellipse cx="35" cy="22" rx="3.8" ry="12" fill={style.inner} stroke="none" transform="rotate(-8 35 22)" />
            <ellipse cx="65" cy="22" rx="3.8" ry="12" fill={style.inner} stroke="none" transform="rotate(8 65 22)" />
          </>
        )}

        {type === "bear" && (
          <>
            <circle cx="30" cy="33" r="10" fill={style.body} strokeWidth="3" />
            <circle cx="70" cy="33" r="10" fill={style.body} strokeWidth="3" />
            <circle cx="30" cy="34" r="5" fill={style.inner} stroke="none" />
            <circle cx="70" cy="34" r="5" fill={style.inner} stroke="none" />
          </>
        )}

        {type === "kitty" && (
          <>
            <path d="M28 42 L25 20 L43 34 Z" fill={style.body} strokeWidth="3" />
            <path d="M72 42 L75 20 L57 34 Z" fill={style.body} strokeWidth="3" />
            <path d="M30 36 L28 26 L39 34 Z" fill={style.inner} stroke="none" />
            <path d="M70 36 L72 26 L61 34 Z" fill={style.inner} stroke="none" />
          </>
        )}

        {type === "fox" && (
          <>
            <path d="M28 42 L18 22 L40 34 Z" fill={style.body} strokeWidth="3" />
            <path d="M72 42 L82 22 L60 34 Z" fill={style.body} strokeWidth="3" />
            <path d="M28 37 L23 28 L36 35 Z" fill={style.inner} stroke="none" />
            <path d="M72 37 L77 28 L64 35 Z" fill={style.inner} stroke="none" />
          </>
        )}

        {type === "lamb" && (
          <>
            <circle cx="34" cy="30" r="8" fill="#fffdf7" strokeWidth="2.5" />
            <circle cx="48" cy="25" r="9" fill="#fffdf7" strokeWidth="2.5" />
            <circle cx="62" cy="30" r="8" fill="#fffdf7" strokeWidth="2.5" />
            <path d="M27 40 Q14 41 17 53 Q27 54 31 46" fill={style.body} strokeWidth="2.5" />
            <path d="M73 40 Q86 41 83 53 Q73 54 69 46" fill={style.body} strokeWidth="2.5" />
          </>
        )}

        <ellipse cx="50" cy="55" rx="25" ry="22" fill={style.body} strokeWidth="3" />
        <path d="M27 52 Q50 71 73 52 L68 82 Q50 94 32 82 Z" fill={style.outfit} strokeWidth="3" />
        {isSitting ? (
          <>
            <path d="M38 80 Q30 84 26 91" fill="none" strokeWidth="5" />
            <path d="M62 80 Q70 84 74 91" fill="none" strokeWidth="5" />
            <ellipse cx="30" cy="91" rx="8" ry="4.5" fill="#fffaf0" strokeWidth="3" />
            <ellipse cx="70" cy="91" rx="8" ry="4.5" fill="#fffaf0" strokeWidth="3" />
          </>
        ) : (
          <>
            <motion.path d="M37 83 Q33 94 24 91" fill="none" strokeWidth="5" animate={isWalking ? { rotate: [-8, 8, -8] } : { rotate: 0 }} transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }} style={{ transformOrigin: "37px 83px" }} />
            <motion.path d="M63 83 Q67 94 76 91" fill="none" strokeWidth="5" animate={isWalking ? { rotate: [8, -8, 8] } : { rotate: 0 }} transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }} style={{ transformOrigin: "63px 83px" }} />
            <motion.ellipse cx="34" cy="92" rx="8" ry="4.5" fill="#fffaf0" strokeWidth="3" animate={isWalking ? { x: [-2, 2, -2] } : { x: 0 }} transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }} />
            <motion.ellipse cx="66" cy="92" rx="8" ry="4.5" fill="#fffaf0" strokeWidth="3" animate={isWalking ? { x: [2, -2, 2] } : { x: 0 }} transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }} />
          </>
        )}
        <ellipse cx="50" cy="60" rx="12" ry="9" fill={type === "fox" ? "#fff8e9" : style.inner} strokeWidth="2" />

        {eyes}
        <circle cx="31" cy="54" r="3.2" fill={style.blush} stroke="none" opacity="0.85" />
        <circle cx="69" cy="54" r="3.2" fill={style.blush} stroke="none" opacity="0.85" />
        <path d="M47 57 Q50 60 53 57" fill="none" strokeWidth="2" />
        <path d={isSad ? "M43 66 Q50 62 57 66" : "M43 65 Q50 70 57 65"} fill="none" strokeWidth="2.4" />

        {type === "kitty" && (
          <>
            <path d="M25 55 H14" strokeWidth="1.8" />
            <path d="M25 61 L13 63" strokeWidth="1.8" />
            <path d="M75 55 H86" strokeWidth="1.8" />
            <path d="M75 61 L87 63" strokeWidth="1.8" />
          </>
        )}

        {accessory === "bow" && (
          <g>
            <path d="M40 25 Q30 18 31 31 Q35 36 43 30 Z" fill="#d66f68" strokeWidth="2.5" />
            <path d="M60 25 Q70 18 69 31 Q65 36 57 30 Z" fill="#d66f68" strokeWidth="2.5" />
            <circle cx="50" cy="28" r="5" fill="#f3c0b8" strokeWidth="2.5" />
          </g>
        )}
        {accessory === "coin" && <circle cx="70" cy="25" r="8" fill="#f2ce74" strokeWidth="3" />}
        {accessory === "cap" && <path d="M33 31 Q50 19 67 31 L62 38 Q50 34 38 38 Z" fill="#91b681" strokeWidth="3" />}
        {accessory === "apron" && <path d="M39 58 H61 L65 86 Q50 94 35 86 Z" fill="#fffaf0" strokeWidth="2.5" />}
        {accessory === "kerchief" && <path d="M38 67 L50 78 L62 67" fill="#f2ce74" strokeWidth="2.5" />}
      </motion.g>
    </svg>
  );
};

const CoquetteOven: React.FC<{ isBusy: boolean; isReady: boolean; isUpgraded: boolean; readyEmoji?: string }> = ({ isBusy, isReady, isUpgraded, readyEmoji }) => (
  <div className="relative grid h-[78px] w-[86px] place-items-center">
    <div className="absolute -top-2 left-1/2 h-4 w-11 -translate-x-1/2 rounded-t-full border-3 border-[#6F5144] bg-[#F8D6CB]" />
    <div className="absolute top-0 h-3 w-14 rounded-full border-2 border-[#6F5144] bg-[#FFF8E8] shadow-sm" />
    <div className={`relative h-[68px] w-[76px] rounded-t-[26px] rounded-b-xl border-[4px] border-[#6F5144] shadow-[3px_4px_0_rgba(111,81,68,0.24)] ${isUpgraded ? "bg-[#F7BFC8]" : "bg-[#F3C9BF]"}`}>
      <div className="absolute left-2 right-2 top-2 flex items-center justify-between">
        {[0, 1, 2].map((knob) => (
          <span key={knob} className="h-2.5 w-2.5 rounded-full border border-[#6F5144] bg-[#F9E7BC] shadow-inner" />
        ))}
      </div>
      <div className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full border border-white/30 opacity-30" />
      <div className="absolute left-1/2 top-[24px] h-[30px] w-[48px] -translate-x-1/2 overflow-hidden rounded-lg border-[3px] border-[#6F5144] bg-[#3E2B28]">
        <div className={`absolute inset-x-1 bottom-1 h-3 rounded-full ${isReady ? "bg-[#F2CE74] shadow-[0_0_12px_#F2CE74]" : isBusy ? "bg-[#E87D5A] shadow-[0_0_10px_#F2A45C]" : "bg-[#A36D61]/40"}`} />
        {readyEmoji && <span className="absolute inset-0 grid place-items-center text-xl">{readyEmoji}</span>}
        {isBusy && !readyEmoji && <span className="absolute inset-x-0 top-1 text-center text-[16px]">🔥</span>}
      </div>
      <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full bg-[#6F5144]/40" />
      <div className="absolute -right-3 top-6 h-5 w-6 rounded-r-full border-2 border-[#6F5144] bg-[#F9E7BC]" />
      <div className="absolute -left-3 top-6 h-5 w-6 rounded-l-full border-2 border-[#6F5144] bg-[#F9E7BC]" />
      <div className="absolute -top-4 right-1 flex items-center">
        <span className="h-4 w-5 rounded-l-full border-2 border-[#6F5144] bg-[#FFF8E8]" />
        <span className="h-3 w-3 rounded-full border-2 border-[#6F5144] bg-[#F2AEB3]" />
        <span className="h-4 w-5 rounded-r-full border-2 border-[#6F5144] bg-[#FFF8E8]" />
      </div>
    </div>
  </div>
);

const CoquetteEspresso: React.FC<{ isBusy: boolean; isReady: boolean; isUpgraded: boolean; readyEmoji?: string }> = ({ isBusy, isReady, isUpgraded, readyEmoji }) => (
  <div className="relative grid h-[78px] w-[86px] place-items-center">
    <div className="absolute top-0 h-5 w-12 rounded-t-2xl border-[3px] border-[#6F5144] bg-[#FFF8E8]" />
    <div className={`relative mt-3 h-[62px] w-[74px] rounded-[24px] border-[4px] border-[#6F5144] shadow-[3px_4px_0_rgba(111,81,68,0.24)] ${isUpgraded ? "bg-[#D8ECF0]" : "bg-[#C7E4E1]"}`}>
      <div className="absolute left-1/2 top-2 h-5 w-11 -translate-x-1/2 rounded-full border-2 border-[#6F5144] bg-[#F9E7BC]">
        <span className={`absolute left-2 top-1 h-2 w-2 rounded-full ${isReady ? "bg-[#91B681]" : isBusy ? "bg-[#F2CE74]" : "bg-[#C87870]"}`} />
        <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-[#FFF8E8] border border-[#6F5144]" />
      </div>
      <div className="absolute left-1/2 top-[24px] h-3 w-9 -translate-x-1/2 rounded-b-lg border-2 border-[#6F5144] bg-[#6F5144]" />
      <div className="absolute left-[52px] top-[28px] h-3 w-7 rounded-r-full border-2 border-[#6F5144] bg-[#4D3A34]" />
      <div className="absolute left-1/2 top-[38px] h-16 w-8 -translate-x-1/2 rounded-b-xl border-2 border-[#6F5144] bg-[#FFF8E8]" />
      <div className={`absolute left-1/2 top-[43px] h-4 w-6 -translate-x-1/2 rounded-b-lg ${isReady ? "bg-[#B98562]" : isBusy ? "bg-[#D4A373] animate-pulse" : "bg-[#EADBC6]"}`} />
      <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full border border-[#6F5144] bg-[#F9E7BC]" />
      {readyEmoji && <span className="absolute inset-x-0 top-[38px] text-center text-lg">{readyEmoji}</span>}
      {isBusy && !readyEmoji && (
        <div className="absolute left-1/2 top-[36px] flex -translate-x-1/2 gap-1">
          <span className="h-5 w-0.5 animate-pulse rounded-full bg-[#6F5144]/50" />
          <span className="h-4 w-0.5 animate-pulse rounded-full bg-[#6F5144]/40 [animation-delay:120ms]" />
        </div>
      )}
      <div className="absolute -top-4 right-0 flex items-center">
        <span className="h-4 w-5 rounded-l-full border-2 border-[#6F5144] bg-[#F8D6CB]" />
        <span className="h-3 w-3 rounded-full border-2 border-[#6F5144] bg-[#FFF8E8]" />
        <span className="h-4 w-5 rounded-r-full border-2 border-[#6F5144] bg-[#F8D6CB]" />
      </div>
    </div>
  </div>
);

export function GraceCafe() {
  const [coins, setCoins] = useState(50);
  const [day, setDay] = useState(1);
  const [rating, setRating] = useState(100);
  const [timeLeft, setTimeLeft] = useState(SHIFT_LENGTH);
  const [shiftActive, setShiftActive] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dirtyTables, setDirtyTables] = useState<number[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [jobs, setJobs] = useState<CookingJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<CookingJob[]>([]);
  const [seatingCustomer, setSeatingCustomer] = useState<Customer | null>(null);
  
  // Upgrades list - synced with variables
  const [owned, setOwned] = useState<string[]>([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [activeRoom, setActiveRoom] = useState<CafeRoom>("lobby");
  const [earnedToday, setEarnedToday] = useState(0);
  const [servedToday, setServedToday] = useState(0);
  
  // Scripture Unscramble Drawer (Grace Period)
  const [isScrambleActive, setIsScrambleActive] = useState(false);
  const [scrambleInfo, setScrambleInfo] = useState<ScrambleWord | null>(null);
  const [scrambleLetters, setScrambleLetters] = useState<{ id: number; char: string; clicked: boolean }[]>([]);
  const [scrambleAnswer, setScrambleAnswer] = useState<string[]>([]);
  const [scrambleMessage, setScrambleMessage] = useState("");

  const [message, setMessage] = useState("Welcome to Grace Café! Open the doors when you are ready.");
  const [now, setNow] = useState(0);
  
  const nowRef = useRef(0);
  const customerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shiftActiveRef = useRef(false);

  const hasUpgrade = useCallback((id: string) => owned.includes(id), [owned]);

  const upgradesList = useMemo<UpgradeItem[]>(() => [
    // Appliances
    { id: "oven_pro", name: "Honeybee Stone Oven", emoji: "⚡🍯", cost: 250, type: "appliance", description: "Bakes pastries 30% faster.", purchased: hasUpgrade("oven_pro") },
    { id: "espresso_pro", name: "Cloud Milk Espresso", emoji: "⚡☁️", cost: 300, type: "appliance", description: "Brews lattes and green tea 30% faster.", purchased: hasUpgrade("espresso_pro") },
    
    // Decor Upgrades
    { id: "string_lights", name: "Warm String Lights", emoji: "✨💡", cost: 90, type: "decor", description: "Ceiling fairy lights glowing in all rooms.", purchased: hasUpgrade("string_lights") },
    { id: "cozy_rug", name: "Cozy Welcome Rug", emoji: "🧶🧸", cost: 120, type: "decor", description: "A gorgeous floral patterned rug in the Lobby.", purchased: hasUpgrade("cozy_rug") },
    { id: "staff_sofa", name: "Plush Velvet Sofa", emoji: "🛋️👑", cost: 160, type: "decor", description: "Luxe crimson velvet sofa in the Lobby.", purchased: hasUpgrade("staff_sofa") },
    { id: "lobby_vase", name: "Reception Flower Vase", emoji: "💐🏺", cost: 80, type: "decor", description: "Elegantly arranged seasonal flowers at check-in.", purchased: hasUpgrade("lobby_vase") },
    { id: "scripture_frame", name: "Scripture Wall Frame", emoji: "🖼️📖", cost: 150, type: "decor", description: "Scripture plaque: 'Grow in Grace' in Seating room.", purchased: hasUpgrade("scripture_frame") },
    { id: "hanging_plants", name: "Trailing Pothos Vines", emoji: "🌿💚", cost: 180, type: "decor", description: "Hanging plants. Customers lose patience 30% slower.", purchased: hasUpgrade("hanging_plants") },
    { id: "wood_flooring", name: "Oak Wood Flooring", emoji: "🪵🧱", cost: 200, type: "decor", description: "Premium wooden panel flooring in the Dining Room.", purchased: hasUpgrade("wood_flooring") },
    { id: "herb_shelves", name: "Potted Herb Shelves", emoji: "🌱🪴", cost: 140, type: "decor", description: "Cute rows of aromatic herb pots on the Kitchen wall.", purchased: hasUpgrade("herb_shelves") },
    
    // Scratch Hired Staff
    { id: "staff_floofer", name: "Floofer", emoji: "🐶", cost: 160, type: "staff", description: "Dog helper. Reduces eating duration. (Wages: 🪙160/day)", purchased: hasUpgrade("staff_floofer"), wage: 160 },
    { id: "staff_flash", name: "Flash", emoji: "🦥", cost: 100, type: "staff", description: "Sloth helper. Reduces shift to 240 seconds. (Wages: 🪙60/day)", purchased: hasUpgrade("staff_flash"), wage: 60 },
    { id: "staff_cherry", name: "Cherry", emoji: "🐱", cost: 200, type: "staff", description: "Cat helper. Stops slow service penalties. (Wages: 🪙200/day)", purchased: hasUpgrade("staff_cherry"), wage: 200 },
    { id: "staff_goldie", name: "Goldie", emoji: "🐹", cost: 300, type: "staff", description: "Hamster helper. 15% end-of-day cash bonus. (Wages: 🪙300/day)", purchased: hasUpgrade("staff_goldie"), wage: 300 },
    { id: "staff_muffin", name: "Muffin", emoji: "🐰", cost: 80, type: "staff", description: "Bunny helper. Auto-cleans used tables. (Wages: 🪙20/day)", purchased: hasUpgrade("staff_muffin"), wage: 20 }
  ], [hasUpgrade]);

  const isStationBusy = useCallback((station: Station) => {
    const hasActive = jobs.some(j => MENU.find(m => m.id === j.itemId)?.station === station);
    const hasCompleted = completedJobs.some(j => MENU.find(m => m.id === j.itemId)?.station === station);
    return hasActive || hasCompleted;
  }, [jobs, completedJobs]);

  const getStaffWages = useCallback(() => {
    let wages = 0;
    upgradesList.forEach(u => {
      if (u.purchased && u.wage) wages += u.wage;
    });
    return wages;
  }, [upgradesList]);

  const getDayTotalDeductions = useCallback(() => {
    return 10 + getStaffWages(); // rent is 10 + staff wages
  }, [getStaffWages]);

  // Sync state values on start
  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      setTimeout(() => {
        setCoins(saved.coins ?? 50);
        setDay(saved.day ?? 1);
        setRating(saved.rating ?? 100);
        setOwned(saved.owned ?? []);
      }, 0);
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!shiftActive && !reportOpen) {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ coins, day, rating, owned }));
    }
  }, [coins, day, owned, rating, reportOpen, shiftActive]);

  const clearCustomerTimers = useCallback(() => {
    customerTimers.current.forEach(clearTimeout);
    customerTimers.current = [];
  }, []);

  const endShift = useCallback(() => {
    shiftActiveRef.current = false;
    setShiftActive(false);
    setCustomers([]);
    setJobs([]);
    setCompletedJobs([]);
    setSeatingCustomer(null);
    setDirtyTables([]);
    clearCustomerTimers();
    setReportOpen(true);
    setMessage("The café doors are closed for the evening. Lovely work today!");
  }, [clearCustomerTimers]);

  // Shift length timer loop
  useEffect(() => {
    if (!shiftActive) return;

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          queueMicrotask(endShift);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endShift, shiftActive]);

  // Customer patience loop
  useEffect(() => {
    if (!shiftActive) return;

    const patienceTimer = setInterval(() => {
      setCustomers((current) => {
        const leaves = (c: Customer) => {
          if (c.state !== "entering" && c.state !== "reading" && c.state !== "waiting") return false;
          const drain = c.state === "entering"
            ? (hasUpgrade("hanging_plants") ? 0.25 : 0.35)
            : c.state === "reading"
              ? (hasUpgrade("hanging_plants") ? 0.4 : 0.55)
            : (hasUpgrade("hanging_plants") ? 0.7 : 1.0);
          return c.patience <= drain;
        };

        const impatient = current.filter(leaves);
        if (impatient.length) {
          setRating((value) => Math.max(30, value - impatient.length * 4));
          setMessage("Oh crumbs! A customer lost patience and walked out.");
        }

        return current
          .filter((c) => !leaves(c))
          .map((c) => {
            if (c.state !== "entering" && c.state !== "reading" && c.state !== "waiting") return c;
            const drain = c.state === "entering"
              ? (hasUpgrade("hanging_plants") ? 0.25 : 0.35)
              : c.state === "reading"
                ? (hasUpgrade("hanging_plants") ? 0.4 : 0.55)
              : (hasUpgrade("hanging_plants") ? 0.7 : 1.0);
            return { ...c, patience: Math.max(0, c.patience - drain) };
          });
      });
    }, 1000);

    return () => clearInterval(patienceTimer);
  }, [hasUpgrade, shiftActive]);

  // Customer walking/seating transition
  const guideGuestToSeat = useCallback((customer: Customer, tableId: number) => {
    setCustomers((current) => current.map((item) => (
      item.id === customer.id ? { ...item, tableId, state: "entering" } : item
    )));
    
    const timer = setTimeout(() => {
      if (!shiftActiveRef.current) return;
      setCustomers((current) => current.map((item) => (
        item.id === customer.id ? { ...item, state: "waiting" } : item
      )));
      setMessage(`${customer.type.toUpperCase()} is seated at table ${tableId}.`);
    }, 2000);
    customerTimers.current.push(timer);
  }, []);

  const handleTableClick = (tableId: number) => {
    const isDirty = dirtyTables.includes(tableId);
    if (isDirty) {
      cleanTable(tableId);
      return;
    }

    const isOccupied = customers.some(c => c.tableId === tableId && c.state !== "leaving");
    if (seatingCustomer && !isOccupied) {
      guideGuestToSeat(seatingCustomer, tableId);
      setSeatingCustomer(null);
    }
  };

  const settleLobbyGuest = useCallback((customerId: string) => {
    const readTimer = setTimeout(() => {
      if (!shiftActiveRef.current) return;
      setCustomers((current) => current.map((item) => (
        item.id === customerId && item.tableId === -1 && item.state === "entering"
          ? { ...item, state: "reading" }
          : item
      )));
    }, 2200);

    const decideTimer = setTimeout(() => {
      if (!shiftActiveRef.current) return;
      setCustomers((current) => current.map((item) => (
        item.id === customerId && item.tableId === -1 && item.state === "reading"
          ? { ...item, state: "waiting" }
          : item
      )));
    }, 7200);

    customerTimers.current.push(readTimer, decideTimer);
  }, []);

  // Customer spawning loop
  useEffect(() => {
    if (!shiftActive) return;

    const spawnTimer = setInterval(() => {
      setCustomers((current) => {
        const lobbyCount = current.filter(c => c.tableId === -1).length;
        if (lobbyCount >= 4) return current;

        const animalPool: AnimalType[] = ["bunny", "bear", "kitty", "fox", "lamb"];
        const randAnimal = animalPool[Math.floor(Math.random() * animalPool.length)];

        // Choose order items from unlocked menu
        const unlockedMenu = MENU.filter((m) => m.unlockDay <= day);
        const orderSize = day >= 3 && Math.random() > 0.65 ? 2 : 1;
        const order = Array.from({ length: orderSize }, () => unlockedMenu[Math.floor(Math.random() * unlockedMenu.length)].id);

        const newCust: Customer = {
          id: Math.random().toString(),
          type: randAnimal,
          order,
          patience: 100,
          maxPatience: 100,
          tableId: -1,
          state: "entering"
        };

        settleLobbyGuest(newCust.id);
        setMessage(`A cute ${randAnimal} customer strolled in and is reading the menu.`);
        return [...current, newCust];
      });
    }, Math.max(5000, 8000 - day * 400));

    return () => clearInterval(spawnTimer);
  }, [day, settleLobbyGuest, shiftActive]);

  // Kitchen cooking progress loop
  useEffect(() => {
    if (!shiftActive || jobs.length === 0) return;

    const jobTimer = setInterval(() => {
      nowRef.current += 250;
      const timestamp = nowRef.current;
      setNow(timestamp);
      
      setJobs((current) => {
        const finished = current.filter((job) => job.finishesAt <= timestamp);
        if (!finished.length) return current;

        setCompletedJobs((prev) => [...prev, ...finished]);
        setMessage("Ding! Batch cooking finished! Go to the Kitchen to retrieve your items.");
        return current.filter((job) => job.finishesAt > timestamp);
      });
    }, 250);

    return () => clearInterval(jobTimer);
  }, [jobs.length, shiftActive]);

  const collectCompleted = (station: Station) => {
    const targets = completedJobs.filter(j => MENU.find(m => m.id === j.itemId)?.station === station);
    if (targets.length === 0) return;

    setStock((currentStock) => {
      const next = { ...currentStock };
      targets.forEach((job) => {
        const item = MENU.find((m) => m.id === job.itemId);
        if (item) next[item.id] = (next[item.id] ?? 0) + item.batch;
      });
      return next;
    });

    setCompletedJobs((prev) => prev.filter(j => MENU.find(m => m.id === j.itemId)?.station !== station));
    
    const itemsList = targets.map(j => MENU.find(m => m.id === j.itemId)?.shortName).join(", ");
    setMessage(`Collected: ${itemsList} batch! Added to serving counter.`);
  };

  // Muffin helper auto-bussing
  useEffect(() => {
    if (!shiftActive || !hasUpgrade("staff_muffin") || dirtyTables.length === 0) return;
    const tableId = dirtyTables[0];
    const timer = setTimeout(() => {
      setDirtyTables((current) => current.filter((id) => id !== tableId));
      setMessage(`Muffin bunny automatically cleaned and polished table ${tableId}! 🧹`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [dirtyTables, hasUpgrade, shiftActive]);

  const startShift = () => {
    clearCustomerTimers();
    shiftActiveRef.current = true;
    setShiftActive(true);
    setReportOpen(false);

    // Flash helper reduces shift length (5m default, 4m with Flash)
    const hasFlash = hasUpgrade("staff_flash");
    const shiftLength = hasFlash ? 240 : 300;
    
    setTimeLeft(shiftLength);
    nowRef.current = 0;
    setNow(0);
    setActiveRoom("lobby");

    const firstCust: Customer = {
      id: Math.random().toString(),
      type: "lamb",
      order: [MENU[0].id],
      patience: 100,
      maxPatience: 100,
      tableId: -1,
      state: "entering"
    };

    setCustomers([firstCust]);
    settleLobbyGuest(firstCust.id);
    setCompletedJobs([]);
    setSeatingCustomer(null);
    setDirtyTables([]);
    setStock({});
    setJobs([]);
    setEarnedToday(0);
    setServedToday(0);
    setMessage(`Day ${day} is open! A lamb customer is strolling in to read the menu.`);
  };

  const startCooking = (item: MenuItem) => {
    if (!shiftActive || item.unlockDay > day) return;
    if (activeRoom !== "kitchen") {
      setMessage("⚠️ You can only start cooking inside the Kitchen room!");
      return;
    }
    if (isStationBusy(item.station)) {
      setMessage(`The ${item.station === "oven" ? "Stone Oven" : "Espresso Machine"} is currently busy or contains finished items.`);
      return;
    }
    if (coins < item.ingredientCost) {
      setMessage("Not enough Gold Coins to purchase these batch ingredients.");
      return;
    }

    const isFaster = item.station === "oven" ? hasUpgrade("oven_pro") : hasUpgrade("espresso_pro");
    const duration = item.seconds * (isFaster ? 0.7 : 1) * 1000;
    const timestamp = nowRef.current;
    
    setCoins((value) => value - item.ingredientCost);
    setJobs((current) => [...current, {
      jobId: Math.random().toString(),
      itemId: item.id,
      startedAt: timestamp,
      finishesAt: timestamp + duration
    }]);
    setMessage(`Preparing: ${item.name} batch (${item.station === "oven" ? "baking" : "brewing"})...`);
  };

  const handleRecipeClick = (item: MenuItem) => {
    const locked = item.unlockDay > day;
    if (locked) {
      setMessage(`🔒 The ${item.name} unlocks on Day ${item.unlockDay}!`);
      return;
    }
    const busy = isStationBusy(item.station);
    if (busy) {
      setMessage(`⚠️ The ${item.station === "oven" ? "Stone Oven" : "Espresso Machine"} is busy cooking or has ready items!`);
      return;
    }
    if (coins < item.ingredientCost) {
      setMessage(`⚠️ You need 🪙${item.ingredientCost} Gold Coins to buy ingredients for ${item.shortName}!`);
      return;
    }
    startCooking(item);
  };

  const serveCustomer = (customer: Customer) => {
    if (customer.state !== "waiting") return;

    const needed: Record<string, number> = {};
    customer.order.forEach((id) => { needed[id] = (needed[id] ?? 0) + 1; });
    const missing = Object.entries(needed).find(([id, amount]) => (stock[id] ?? 0) < amount);
    
    if (missing) {
      const item = MENU.find(m => m.id === missing[0]);
      setMessage(`You still need to prepare: ${item?.shortName ?? "part of this order"}.`);
      return;
    }

    const earnings = customer.order.reduce((total, id) => total + (MENU.find(m => m.id === id)?.price ?? 0), 0);
    const patienceBonus = customer.patience >= 70 ? 3 : 0;
    let finalEarning = earnings + patienceBonus;

    // Cherry helper stops slow service penalties
    const isSlow = customer.patience < 35;
    const stopSlow = hasUpgrade("staff_cherry");
    
    let ratingGain = 3;
    if (isSlow && !stopSlow) {
      finalEarning = Math.round(finalEarning * 0.5);
      ratingGain = 1;
      setMessage("Slow service! Customer left a very small tip. (Hire Cherry to prevent this).");
    } else if (isSlow && stopSlow) {
      setMessage("Cherry's hospitality negated the slow service penalty! Full tip earned.");
    }

    setStock((current) => {
      const next = { ...current };
      Object.entries(needed).forEach(([id, amount]) => { next[id] = Math.max(0, (next[id] ?? 0) - amount); });
      return next;
    });

    setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, state: "eating" } : item));

    // Floofer reduces customer eating speed
    const hasFloofer = hasUpgrade("staff_floofer");
    const eatDuration = hasFloofer ? 8400 : 12000;

    const finishTimer = setTimeout(() => {
      if (!shiftActiveRef.current) return;
      setCoins((value) => value + finalEarning);
      setEarnedToday((value) => value + finalEarning);
      setServedToday((value) => value + 1);
      setRating((value) => Math.min(100, value + ratingGain));
      setDirtyTables((current) => [...current, customer.tableId]);
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, state: "leaving" } : item));
      setMessage(`${customer.type.toUpperCase()} finished eating and left 🪙${finalEarning} Gold Coins tip.`);

      const leaveTimer = setTimeout(() => {
        if (!shiftActiveRef.current) return;
        setCustomers((current) => current.filter((item) => item.id !== customer.id));
      }, 700);
      customerTimers.current.push(leaveTimer);
    }, eatDuration);
    
    customerTimers.current.push(finishTimer);
  };

  const cleanTable = (tableId: number) => {
    if (!dirtyTables.includes(tableId)) return;
    setDirtyTables((current) => current.filter((id) => id !== tableId));
    setCoins((c) => c + 1); // cleaning bonus
    setMessage(`Table ${tableId} is cleaned! Earned +1 Gold Coin.`);
  };

  const buyUpgrade = (upgrade: UpgradeItem) => {
    if (owned.includes(upgrade.id)) return;
    if (coins < upgrade.cost) {
      setMessage("Save a few more Gold Coins to afford this upgrade.");
      return;
    }
    setCoins((value) => value - upgrade.cost);
    setOwned((current) => [...current, upgrade.id]);
    setMessage(`Unlocked: ${upgrade.name}! Cozy benefits applied.`);
  };

  const handlePayRent = () => {
    const totalDeduction = getDayTotalDeductions();
    
    if (coins >= totalDeduction) {
      let nextCoins = coins - totalDeduction;
      
      // Goldie 15% end-of-day money multiplier
      const hasGoldie = hasUpgrade("staff_goldie");
      if (hasGoldie) {
        nextCoins = Math.round(nextCoins * 1.15);
      }
      
      const nextDay = day + 1;
      setCoins(nextCoins);
      setDay(nextDay);
      setReportOpen(false);
      setMessage(`Rent and wages of 🪙${totalDeduction} paid! Ready for Day ${nextDay}.`);
    } else {
      setIsScrambleActive(true);
      startScrambleWord();
    }
  };

  // --- Scripture Unscramble Drawer (Grace Period) ---
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
      const bonusCoins = totalDeduction + 10;
      
      let finalCoins = coins + bonusCoins - totalDeduction;
      const hasGoldie = hasUpgrade("staff_goldie");
      if (hasGoldie) {
        finalCoins = Math.round(finalCoins * 1.15);
      }
      
      const nextDay = day + 1;
      setCoins(finalCoins);
      setDay(nextDay);
      setIsScrambleActive(false);
      setReportOpen(false);
      setMessage(`Grace Period challenge passed! Rent paid & advanced to Day ${nextDay}! 🎉`);
    } else {
      setScrambleMessage("Not quite correct. Check the letter tiles order again!");
    }
  };

  const stockItems = useMemo(
    () => MENU.filter((item) => (stock[item.id] ?? 0) > 0),
    [stock]
  );

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-[36px] border-4 border-[#C8B097] bg-[#FAF3E8] text-[#5D4439] shadow-2xl flex flex-col select-none">
      
      {/* ─── HUD Header Bar ─── */}
      <header className="flex items-center justify-between border-b-4 border-[#C8B097] bg-[#B96F69] px-5 py-4 text-[#FFF9ED] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#98534C] border border-white/20 text-lg shadow-inner">౨ৎ</div>
          <div className="text-left">
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#FFE4BD]">Cozy Tabernacle simulation</p>
            <h2 className="font-serif text-base font-bold leading-none">Grace Café</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-extrabold">
          <button
            type="button"
            onClick={() => {
              setTutorialStep(0);
              setTutorialOpen(true);
            }}
            className="grid h-7 w-7 place-items-center rounded-full border border-[#FFF2D9]/50 bg-[#98534C]/60 text-[11px] font-black text-[#FFF8E8] transition hover:bg-[#8C4B45] active:scale-95"
            aria-label="Open Grace Cafe tutorial"
          >
            ?
          </button>
          <span className="rounded-full border border-[#FFF2D9]/40 bg-[#98534C]/60 px-3 py-1.5">DAY {day}</span>
          <span className="flex items-center gap-1 rounded-full border border-[#FFF2D9]/40 bg-[#98534C]/60 px-3 py-1.5">
            <Star className="h-3.5 w-3.5 fill-[#FFE49D] text-[#FFE49D]" /> {rating}%
          </span>
          <span className="flex items-center gap-1 rounded-full border border-[#FFF2D9]/40 bg-[#98534C]/60 px-3 py-1.5">
            <Clock3 className="h-3.5 w-3.5" /> {shiftActive ? `${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : "closed"}
          </span>
        </div>
      </header>

      {/* ─── Room Tabs Navigation ─── */}
      <div className="flex items-center gap-2 border-b-4 border-[#C8B097] bg-[#FAF8E4] px-4 py-2.5">
        {(["lobby", "seating", "kitchen"] as CafeRoom[]).map((room) => {
          const active = activeRoom === room;
          const label = room === "lobby" ? "Lobby" : room === "seating" ? "Dining Room" : "Kitchen";
          const emoji = room === "lobby" ? "🚪" : room === "seating" ? "🪑" : "🍳";
          
          const lobbyCount = room === "lobby" ? customers.filter((c) => c.tableId === -1).length : 0;
          const seatingCount = room === "seating" ? customers.filter((c) => c.tableId !== -1 && c.state !== "leaving").length : 0;
          const kitchenCount = room === "kitchen" ? jobs.length + completedJobs.length : 0;
          const badgeCount = lobbyCount || seatingCount || kitchenCount;

          return (
            <button
              key={room}
              type="button"
              onClick={() => setActiveRoom(room)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition active:scale-95 sm:flex-none ${
                active
                  ? "border-[#6F5144] bg-[#C87870] text-white shadow-[2px_3px_0_#6F5144]"
                  : "border-[#D4AD8D] bg-[#F8E6CA] text-[#7C5B4D] hover:bg-[#FBEFD9]"
              }`}
            >
              <span>{emoji}</span>
              <span>{label}</span>
              {badgeCount > 0 && (
                <span className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[8px] ${active ? "bg-white text-[#A45D59]" : "bg-[#B96F69] text-white"}`}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
        <p className="hidden flex-1 text-right font-serif text-[10px] font-bold italic text-[#8D7064] sm:block">
          {activeRoom === "lobby" && "🚪 Check in customers and assign seats"}
          {activeRoom === "seating" && "🪑 Deliver food and clean tables"}
          {activeRoom === "kitchen" && "🍳 Brew and bake recipe batches"}
        </p>
      </div>

      {/* ─── Dynamic Room Canvas floor ─── */}
      <section className="relative h-[280px] overflow-hidden border-b-[3px] border-[#6F5144] bg-[#F5DFC5]">
        <div 
          className={`absolute inset-x-0 top-0 h-[190px] transition-all duration-300 ${
            activeRoom === "seating" && hasUpgrade("wood_flooring")
              ? "bg-[#D2B48C] bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[size:24px_100%]"
              : "bg-[linear-gradient(#f7e7cf_0_75%,#e9c7ad_75%)]"
          }`} 
        />
        
        {/* Cozy String Lights */}
        <div className="absolute inset-x-0 top-4 flex justify-around px-8 z-20">
          {Array.from({ length: 11 }).map((_, index) => (
            <span 
              key={index} 
              className={`h-2.5 w-2.5 rounded-full border border-[#6F5144] ${
                index % 3 === 0 ? "bg-[#f2b2a0]" : index % 3 === 1 ? "bg-[#f4d685]" : "bg-[#a9c7aa]"
              } ${
                hasUpgrade("string_lights") 
                  ? "shadow-[0_0_12px_#fff3bd] scale-125 animate-pulse" 
                  : "shadow-[0_0_6px_rgba(255,243,189,0.3)] opacity-40"
              }`} 
              style={{ animationDelay: `${index * 0.15}s` }} 
            />
          ))}
        </div>

        {/* 1. LOBBY VIEW */}
        {activeRoom === "lobby" && (
          <>
            {/* Reception Desk */}
            <div className="absolute left-6 bottom-[40px] h-24 w-32 rounded-t-3xl border-4 border-[#6F5144] bg-[#AF9A85] shadow-lg flex flex-col justify-between p-2">
              <span className="rounded-full bg-white/60 border border-[#6F5144] px-2 py-0.5 text-[7px] font-black uppercase text-[#6F5144] tracking-wider self-center mt-1">Check-in</span>
              <div className="flex justify-around text-lg">📚 {hasUpgrade("lobby_vase") ? "💐🏺" : "💐"}</div>
            </div>
            
            {/* Cozy sofa */}
            <div 
              className={`absolute right-6 bottom-[30px] h-12 w-48 rounded-2xl border-4 border-[#6F5144] text-center shadow-md flex items-center justify-center transition-colors ${
                hasUpgrade("staff_sofa") 
                  ? "bg-[#A34E46] border-[#5C1A14] text-amber-100" 
                  : "bg-[#91B6B2] text-white"
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-widest">
                {hasUpgrade("staff_sofa") ? "🛋️ Plush Velvet Lounge" : "Cozy Waiting Area"}
              </span>
            </div>

            {/* Cozy Welcome Rug */}
            {hasUpgrade("cozy_rug") && (
              <div className="absolute left-[36%] bottom-[12px] h-12 w-32 rounded-full bg-[#E5C3A6] border-2 border-dashed border-[#8C6B53] flex flex-col items-center justify-center opacity-85 z-0 select-none pointer-events-none">
                <span className="text-[8px] font-bold text-[#8C6B53] uppercase tracking-wider">Welcome 🙏</span>
              </div>
            )}

            {/* Render Lobby Waiting Room */}
            <div className="absolute inset-x-[150px] bottom-[24px] h-[128px] z-30">
              {customers.filter(c => c.tableId === -1).map((c, index) => {
                const isSelected = seatingCustomer?.id === c.id;
                return (
                  <LobbyCustomer 
                    key={c.id} 
                    customer={c} 
                    spotIndex={index}
                    isSelected={isSelected} 
                    onClick={() => {
                      if (c.state !== "waiting") {
                        setMessage("Give them a moment to walk in and read the menu first.");
                        return;
                      }
                      setSeatingCustomer(isSelected ? null : c);
                    }} 
                  />
                );
              })}
            </div>

            {/* Seating Banner Alert */}
            {seatingCustomer && (
              <div className="absolute inset-x-4 top-12 z-40 rounded-2xl border-2 border-amber-400 bg-amber-50 p-2 shadow-md flex items-center justify-between animate-fade-in">
                <span className="text-[9px] font-black uppercase text-amber-800 ml-2">Seat {seatingCustomer.type.toUpperCase()}:</span>
                <div className="flex gap-1.5">
                  {TABLES.map(t => {
                    const isDirty = dirtyTables.includes(t.id);
                    const isOccupied = customers.some(c => c.tableId === t.id && c.state !== "leaving");
                    const available = !isDirty && !isOccupied;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          guideGuestToSeat(seatingCustomer, t.id);
                          setSeatingCustomer(null);
                        }}
                        className={`px-2 py-1 rounded-lg text-[8.5px] font-black uppercase border transition active:scale-95 cursor-pointer ${
                          available 
                            ? "bg-amber-600 border-amber-700 text-white shadow-xs" 
                            : "bg-stone-200 border-stone-300 text-stone-400 opacity-60 pointer-events-none"
                        }`}
                      >
                        Table {t.id} {isDirty ? "(Dirty)" : isOccupied ? "(Occupied)" : ""}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSeatingCustomer(null)}
                    className="px-2 py-1 rounded-lg text-[8.5px] font-bold text-stone-500 border border-stone-300 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 2. DINING ROOM (SEATING) VIEW */}
        {activeRoom === "seating" && (
          <>
            {/* Scripture wall decor / Frame */}
            {hasUpgrade("scripture_frame") ? (
              <div className="absolute top-8 left-6 bg-[#FAF6EE] border-4 border-[#8C6B53] px-2.5 py-1.5 rounded-lg shadow-md text-center max-w-[150px] z-0 animate-fade-in">
                <p className="text-[7.5px] font-serif font-black text-amber-800 leading-tight italic">
                  &quot;Grow in grace, and in knowledge...&quot;
                </p>
                <span className="text-[5px] uppercase font-bold text-stone-400 block mt-0.5">2 Peter 3:18</span>
              </div>
            ) : (
              <div className="absolute top-8 left-6 text-4xl drop-shadow-md z-0">🖼️</div>
            )}
            
            {hasUpgrade("hanging_plants") && <div className="absolute right-6 top-0 text-5xl drop-shadow-md z-0">🌿</div>}
            
            {/* Render 3 seating tables */}
            {TABLES.map((table) => {
              const dirty = dirtyTables.includes(table.id);
              const occupied = customers.some(c => c.tableId === table.id && c.state !== "leaving");
              const targetSelectable = seatingCustomer && !occupied && !dirty;

              return (
                <div
                  key={table.id}
                  className="absolute bottom-[24px] z-10 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: table.left }}
                >
                  {/* Chairs */}
                  <div className="h-6 w-8 rounded-t-md bg-[#8D6E63] border-2 border-[#6F5144] mb-[-4px]" />
                  
                  {/* Table Round Top */}
                  <button
                    type="button"
                    onClick={() => handleTableClick(table.id)}
                    className={`h-11 w-16 rounded-full border-2 border-[#6F5144] flex items-center justify-center shadow-md transition-all ${
                      dirty 
                        ? "bg-[#D7CCC8] border-amber-500 hover:bg-amber-100 cursor-pointer animate-pulse" 
                        : targetSelectable
                          ? "bg-amber-100 border-amber-500 hover:bg-amber-200 cursor-pointer animate-bounce scale-105"
                          : "bg-[#FFF9F2]"
                    }`}
                    style={dirty ? undefined : {
                      background: "#FFF",
                      backgroundImage: `
                        repeating-linear-gradient(0deg, rgba(214, 111, 104, 0.22) 0px, rgba(214, 111, 104, 0.22) 6px, transparent 6px, transparent 12px),
                        repeating-linear-gradient(90deg, rgba(214, 111, 104, 0.22) 0px, rgba(214, 111, 104, 0.22) 6px, transparent 6px, transparent 12px)
                      `
                    }}
                  >
                    {dirty ? (
                      <span className="text-xs">🧹</span>
                    ) : occupied ? (
                      <span className="text-xs">🍽️</span>
                    ) : (
                      <span className="text-[7.5px] font-black text-[#6F5144] bg-white/85 px-1.5 py-0.2 rounded-sm border border-stone-200">
                        {targetSelectable ? "Tap to Seat" : `TABLE ${table.id}`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Prompt for Seating in Dining Room */}
            {seatingCustomer && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-300 rounded-full px-4 py-1 text-[8.5px] font-bold text-amber-900 shadow-sm animate-pulse z-35 flex items-center gap-1.5">
                <span>👈 Tap any flashing table to seat the {seatingCustomer.type} customer!</span>
                <button onClick={() => setSeatingCustomer(null)} className="underline hover:text-amber-700 cursor-pointer ml-1">Cancel</button>
              </div>
            )}
          </>
        )}

        {/* 3. KITCHEN VIEW */}
        {activeRoom === "kitchen" && (
          <div className="absolute inset-x-0 bottom-[40px] h-[130px] border-y-4 border-[#6F5144] bg-[#9FAF82] flex justify-around items-center px-4">
            
            {/* Potted Herb Shelves */}
            {hasUpgrade("herb_shelves") && (
              <div className="absolute right-4 top-4 flex gap-2 bg-[#F1E5D5] border-2 border-[#8C6B53] px-2 py-1 rounded-md shadow-xs z-10 select-none pointer-events-none animate-fade-in">
                <span className="text-xs">🪴</span>
                <span className="text-xs">🌱</span>
                <span className="text-xs">🌿</span>
              </div>
            )}

            {/* Stone Hearth Baking Oven */}
            <div className="flex flex-col items-center relative">
              <span className="text-[8px] font-black text-white bg-[#6F5144] px-2 py-0.5 rounded-md mb-1.5 shadow-sm">Stone Oven</span>
              {(() => {
                const completedOvenJob = completedJobs.find(j => MENU.find(m => m.id === j.itemId)?.station === "oven");
                const ovenItem = completedOvenJob ? MENU.find(m => m.id === completedOvenJob.itemId) : null;
                const ovenBusy = jobs.some(j => MENU.find(m => m.id === j.itemId)?.station === "oven");
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (ovenItem) {
                        collectCompleted("oven");
                      } else {
                        setMessage("Stone Oven: Select a baking recipe below to start baking!");
                      }
                    }}
                    className="relative z-20 grid h-24 w-24 place-items-center rounded-[28px] border-2 border-[#F8E6CA]/80 bg-[#FFF8E8]/35 shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                  >
                    <CoquetteOven
                      isBusy={ovenBusy}
                      isReady={Boolean(ovenItem)}
                      isUpgraded={hasUpgrade("oven_pro")}
                      readyEmoji={ovenItem?.emoji}
                    />
                    {ovenBusy && (
                      <div className="absolute inset-2 bg-orange-500/20 border border-orange-400 rounded-full animate-ping pointer-events-none" />
                    )}
                  </button>
                );
              })()}
              
              {/* Collection Indicator Badge */}
              {(() => {
                const completedOvenJob = completedJobs.find(j => MENU.find(m => m.id === j.itemId)?.station === "oven");
                const ovenItem = completedOvenJob ? MENU.find(m => m.id === completedOvenJob.itemId) : null;
                return ovenItem && (
                  <button
                    type="button"
                    onClick={() => collectCompleted("oven")}
                    className="absolute -top-6 bg-amber-500 hover:bg-amber-600 text-white border-2 border-white px-2 py-0.8 rounded-full text-[9px] font-black shadow-md animate-bounce cursor-pointer z-30 flex items-center gap-1"
                  >
                    <span>Collect</span>
                    <span>{ovenItem.emoji}</span>
                  </button>
                );
              })()}
            </div>

            {/* Brass Espresso Maker */}
            <div className="flex flex-col items-center relative">
              <span className="text-[8px] font-black text-white bg-[#6F5144] px-2 py-0.5 rounded-md mb-1.5 shadow-sm">Espresso Machine</span>
              {(() => {
                const completedDrinksJob = completedJobs.find(j => MENU.find(m => m.id === j.itemId)?.station === "drinks");
                const drinksItem = completedDrinksJob ? MENU.find(m => m.id === completedDrinksJob.itemId) : null;
                const drinksBusy = jobs.some(j => MENU.find(m => m.id === j.itemId)?.station === "drinks");
                
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (drinksItem) {
                        collectCompleted("drinks");
                      } else {
                        setMessage("Espresso Machine: Select a beverage recipe below to start brewing!");
                      }
                    }}
                    className="relative z-20 grid h-24 w-24 place-items-center rounded-[28px] border-2 border-[#F8E6CA]/80 bg-[#FFF8E8]/35 shadow-md transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                  >
                    <CoquetteEspresso
                      isBusy={drinksBusy}
                      isReady={Boolean(drinksItem)}
                      isUpgraded={hasUpgrade("espresso_pro")}
                      readyEmoji={drinksItem?.emoji}
                    />
                    {drinksBusy && (
                      <div className="absolute inset-2 bg-teal-500/20 border border-teal-400 rounded-full animate-ping pointer-events-none" />
                    )}
                  </button>
                );
              })()}

              {/* Collection Indicator Badge */}
              {(() => {
                const completedDrinksJob = completedJobs.find(j => MENU.find(m => m.id === j.itemId)?.station === "drinks");
                const drinksItem = completedDrinksJob ? MENU.find(m => m.id === completedDrinksJob.itemId) : null;
                return drinksItem && (
                  <button
                    type="button"
                    onClick={() => collectCompleted("drinks")}
                    className="absolute -top-6 bg-teal-500 hover:bg-teal-600 text-white border-2 border-white px-2 py-0.8 rounded-full text-[9px] font-black shadow-md animate-bounce cursor-pointer z-30 flex items-center gap-1"
                  >
                    <span>Collect</span>
                    <span>{drinksItem.emoji}</span>
                  </button>
                );
              })()}
            </div>

            {/* Kitchen staff animation if helper is owned */}
            {hasUpgrade("staff_muffin") && (
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-[#58704D] bg-[#F4F7E9] px-2 py-0.5 rounded-md mb-1 shadow-sm">Helper</span>
                <div className="animate-bounce">
                  <StaffAnimal staff="muffin" className="h-16 w-16" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floor styling boards */}
        <div 
          className={`absolute inset-x-0 bottom-0 h-[48px] border-t-2 border-[#6F5144]/60 transition-all pointer-events-none ${
            activeRoom === "seating" && hasUpgrade("wood_flooring")
              ? "bg-[#8B5A2B] bg-[linear-gradient(90deg,rgba(0,0,0,0.1)_2px,transparent_2px)] bg-[size:16px_100%]"
              : "bg-[#C89E7F] bg-[linear-gradient(45deg,rgba(255,248,232,.12)_25%,transparent_25%_75%,rgba(255,248,232,.12)_75%)] bg-[size:20px_20px]"
          }`} 
        />

        {/* Render Customer Characters inside Seating room */}
        <AnimatePresence>
          {activeRoom === "seating" && customers.filter((c) => c.tableId !== -1).map((c) => (
            <CustomerCharacter key={c.id} customer={c} onServe={() => serveCustomer(c)} />
          ))}
        </AnimatePresence>
      </section>

      {/* ─── Notification Text Log ─── */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-[#D2AD91] bg-[#FFF8E8] px-4 py-2.5">
        <span className="rounded-full border-2 border-[#8C684F] bg-[#F2CE74] px-4 py-1 text-[11px] font-black shadow-[2px_2px_0_#8C684F]">
          🪙 {coins} Gold Coins
        </span>
        <p className="flex-1 text-center font-serif text-[11px] font-semibold italic text-[#7C5B4D] leading-tight">
          💬 {message}
        </p>
        <button 
          type="button" 
          onClick={() => setShopOpen(true)} 
          className="flex items-center gap-1.5 rounded-full border-2 border-[#6F5144] bg-[#B6C99E] px-4 py-1 text-[10px] font-black shadow-[2px_2px_0_#6F5144] transition active:scale-95 active:shadow-none cursor-pointer"
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Upgrades
        </button>
      </div>

      {/* ─── Bottom Console Control Station Panels ─── */}
      {!shiftActive ? (
        <div className="grid min-h-[220px] place-items-center bg-[#FAF3E8] p-6 text-center">
          <div>
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-3 border-[#6F5144] bg-[#F3C4BB] text-2xl shadow-md">🏡</div>
            <h3 className="font-serif text-base font-black">Open Sanctuary Cafe</h3>
            <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-[#8D7064]">
              Start the shift to welcome travelers! Prepare recipes, deliver complete orders, and clean dirty tables to build reputation.
            </p>
            <button 
              type="button" 
              onClick={startShift} 
              className="mt-4 rounded-2xl border-3 border-[#6F5144] bg-[#C87870] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-md active:scale-95 transition cursor-pointer"
            >
              Open for Day {day} shift ✦
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 bg-[#FAF3E8] p-3 md:grid-cols-[1.2fr_1.8fr]">
          <div className="space-y-3 text-left">
            {/* Serving Pickup stock counter */}
            <div className="rounded-2xl border-2 border-[#9A7662] bg-[#FFF8E8] p-3 shadow-[2px_3px_0_#D6B294]">
              <p className="mb-2 flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider text-[#A36D61]"><Sparkles className="h-3 w-3" /> Pickup Counter</p>
              {stockItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {stockItems.map((item) => (
                    <span key={item.id} className="rounded-xl border-2 border-[#D4AD8D] bg-[#F9E6C8] px-2.5 py-1 text-[10px] font-black">
                      {item.emoji} ×{stock[item.id]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[9px] italic text-[#A08A7E]">Ready batches will land here...</p>
              )}
            </div>

            {/* Active preparation progress bars */}
            <div className="rounded-2xl border-2 border-[#9A7662] bg-[#E4ECD8] p-3 shadow-[2px_3px_0_#B8C69F]">
              <p className="mb-2 flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider text-[#617557]"><Clock3 className="h-3 w-3" /> Prep Queues ({jobs.length}/3)</p>
              {jobs.length ? (
                <div className="space-y-2">
                  {jobs.map((job) => {
                    const item = MENU.find((m) => m.id === job.itemId);
                    const progress = Math.min(100, ((now - job.startedAt) / (job.finishesAt - job.startedAt)) * 100);
                    return (
                      <div key={job.jobId} className="flex flex-col gap-1">
                        <div className="flex justify-between text-[8px] font-bold text-stone-700">
                          <span>{item?.emoji} {item?.shortName}</span>
                          <span>{Math.max(0, Math.ceil((job.finishesAt - now) / 1000))}s</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full border border-[#708365] bg-[#FFF8E8]">
                          <div className="h-full bg-[#91B681]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[9px] italic text-[#718069]">No recipes currently cooking.</p>
              )}
            </div>
          </div>

          {/* Active Recipe book grid */}
          {activeRoom !== "kitchen" ? (
            <div className="rounded-2xl border-2 border-dashed border-[#C8B097] bg-[#FAF8E4]/90 p-4 flex flex-col items-center justify-center text-center min-h-[170px] flex-1">
              <ChefHat className="h-7 w-7 text-[#A36D61] mb-1.5 animate-bounce" />
              <p className="text-[9.5px] font-bold text-[#8D7064] leading-tight">Recipe book is locked outside the Kitchen.</p>
              <button
                type="button"
                onClick={() => setActiveRoom("kitchen")}
                className="mt-2.5 rounded-xl border-2 border-[#6F5144] bg-[#C87870] px-4 py-1 text-[8.5px] font-black uppercase tracking-wider text-white shadow-xs hover:bg-[#D68880] active:scale-95 transition cursor-pointer"
              >
                Go to Kitchen 🍳
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-[#9A7662] bg-[#FFFAF0] p-3 shadow-[2px_3px_0_#D6B294] text-left flex-1 flex flex-col">
              <p className="mb-2 flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-wider text-[#A36D61]"><ChefHat className="h-3 w-3" /> Prep Recipes Book</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-[140px] overflow-y-auto pr-1">
                {MENU.map((item) => {
                  const locked = item.unlockDay > day;
                  const busy = isStationBusy(item.station);
                  const cantCook = locked || busy || coins < item.ingredientCost;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleRecipeClick(item)}
                      className={`relative min-h-[72px] rounded-xl border-2 border-[#C99E7F] bg-[#F8E6CA] p-2 text-left shadow-[2px_2px_0_#C99E7F] transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#FCEFDC] cursor-pointer ${
                        cantCook ? "opacity-60" : ""
                      }`}
                    >
                      {locked ? <Lock className="mb-1 h-3.5 w-3.5 text-stone-400" /> : <span className="text-lg">{item.emoji}</span>}
                      <span className="block truncate text-[8.5px] font-black">{locked ? `Day ${item.unlockDay} Unlock` : item.shortName}</span>
                      {!locked && (
                        <span className="mt-1 flex items-center justify-between text-[7.5px] font-bold text-[#9C6C58]">
                          <span>🪙{item.ingredientCost}</span>
                          <span>makes {item.batch}</span>
                        </span>
                      )}
                      <span className="absolute right-1.5 top-1.5 text-[#8D7064]">
                        {item.station === "drinks" ? <Coffee className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TUTORIAL OVERLAY ─── */}
      <AnimatePresence>
        {tutorialOpen && (
          <div className="absolute inset-0 z-[70] grid place-items-center bg-[#4C382F]/60 p-4 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="w-full max-w-sm overflow-hidden rounded-[30px] border-[3px] border-[#6F5144] bg-[#FFF8E8] shadow-2xl"
            >
              <div className="relative min-h-[136px] border-b-2 border-[#D7B99D] bg-[#F6D7D6] p-5 text-left">
                <button
                  type="button"
                  onClick={() => setTutorialOpen(false)}
                  className="absolute right-3 top-3 rounded-full border-2 border-[#6F5144] bg-[#FFF8E8] p-1 text-[#6F5144] active:scale-95"
                  aria-label="Close tutorial"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-3 right-4 flex gap-1">
                  {TUTORIAL_STEPS.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-5 rounded-full border border-[#6F5144] ${index === tutorialStep ? "bg-[#C87870]" : "bg-[#FFF8E8]"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl border-2 border-[#6F5144] bg-[#FFF8E8] shadow-md">
                    {tutorialStep === 0 && <StaffAnimal staff="cherry" className="h-14 w-14" />}
                    {tutorialStep === 1 && <div className="scale-[0.74]"><CoquetteOven isBusy={false} isReady={false} isUpgraded readyEmoji="🍪" /></div>}
                    {tutorialStep === 2 && <CustomerAnimal type="lamb" patience={100} state="waiting" pose="sitting" />}
                    {tutorialStep === 3 && <StaffAnimal staff="goldie" className="h-14 w-14" />}
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A36D61]">{TUTORIAL_STEPS[tutorialStep].room}</p>
                    <h3 className="font-serif text-lg font-black leading-tight text-[#5D4439]">{TUTORIAL_STEPS[tutorialStep].title}</h3>
                  </div>
                </div>
              </div>
              <div className="p-5 text-left">
                <p className="min-h-[58px] text-[11px] font-semibold leading-relaxed text-[#7C5B4D]">
                  {TUTORIAL_STEPS[tutorialStep].detail}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setTutorialStep((value) => Math.max(0, value - 1))}
                    disabled={tutorialStep === 0}
                    className="rounded-2xl border-2 border-[#6F5144] bg-[#F8E6CA] px-4 py-2 text-[9px] font-black uppercase tracking-wider text-[#6F5144] disabled:opacity-40 active:scale-95"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tutorialStep === TUTORIAL_STEPS.length - 1) {
                        setTutorialOpen(false);
                        setMessage("Tutorial complete. Open the doors when you are ready!");
                        return;
                      }
                      setTutorialStep((value) => Math.min(TUTORIAL_STEPS.length - 1, value + 1));
                    }}
                    className="flex-1 rounded-2xl border-2 border-[#6F5144] bg-[#C87870] px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white shadow-[2px_3px_0_#6F5144] active:translate-y-0.5 active:shadow-none"
                  >
                    {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Start Playing" : "Next"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── A. SHOP UPGRADES OVERLAY ─── */}
      <AnimatePresence>
        {shopOpen && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#4C382F]/55 p-4 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="w-full max-w-md rounded-[26px] border-[3px] border-[#6F5144] bg-[#FFF8E8] p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div className="text-left">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A36D61]">The cozy corner shop</p>
                  <h3 className="font-serif text-base font-black">Café Hired Staff & Upgrades</h3>
                </div>
                <button type="button" onClick={() => setShopOpen(false)} className="rounded-full border-2 border-[#6F5144] bg-[#F1C2B8] p-1 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {upgradesList.map((upgrade) => {
                  const purchased = owned.includes(upgrade.id);
                  const staffKey = getStaffKey(upgrade.id);
                  return (
                    <div key={upgrade.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#D0AA8B] bg-[#F9E8CF] p-3 text-left">
                      <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#9B765F] bg-[#FFF8E8] text-2xl">
                        {staffKey ? <StaffAnimal staff={staffKey} className="h-12 w-12" /> : upgrade.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black">{upgrade.name}</p>
                        <p className="text-[9px] text-[#8D7064] leading-tight">{upgrade.description}</p>
                      </div>
                      <button 
                        type="button" 
                        disabled={purchased} 
                        onClick={() => buyUpgrade(upgrade)} 
                        className="rounded-xl border-2 border-[#6F5144] bg-[#B6C99E] px-2.5 py-1 text-[9px] font-black disabled:bg-[#DDD2C2] cursor-pointer shrink-0"
                      >
                        {purchased ? "Owned" : `🪙 ${upgrade.cost}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── B. SHIFT SUMMARY REPORT OVERLAY ─── */}
      <AnimatePresence>
        {reportOpen && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#4C382F]/55 p-4 backdrop-blur-[2px]">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-sm rounded-[28px] border-[3px] border-[#6F5144] bg-[#FFF8E8] p-6 text-center shadow-2xl">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-[3px] border-[#6F5144] bg-[#F2CE74] text-2xl">✨</div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#A36D61]">Day {day} complete</p>
              <h3 className="font-serif text-lg font-black">The doors are closed</h3>
              <div className="my-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border-2 border-[#D0AA8B] bg-[#F9E8CF] p-3 text-center">
                  <p className="text-xl font-black">{servedToday}</p>
                  <p className="text-[8px] font-black uppercase tracking-wider text-[#A36D61]">guests served</p>
                </div>
                <div className="rounded-2xl border-2 border-[#A8BD91] bg-[#E4ECD8] p-3 text-center">
                  <p className="text-xl font-black">+{earnedToday}</p>
                  <p className="text-[8px] font-black uppercase tracking-wider text-[#617557]">coins earned</p>
                </div>
              </div>
              <div className="bg-[#FAF3E8] p-3 rounded-2xl text-[10px] text-stone-600 space-y-1 mb-4 border border-stone-200 text-left">
                <div className="flex justify-between"><span>Base Rent Charge:</span><span className="font-bold text-red-500">-🪙 10</span></div>
                {getStaffWages() > 0 && (
                  <div className="flex justify-between"><span>Hired Staff Wages:</span><span className="font-bold text-red-400">-🪙 {getStaffWages()}</span></div>
                )}
                {hasUpgrade("staff_goldie") && (
                  <div className="flex justify-between text-yellow-600 font-bold"><span>Goldie Multiplier:</span><span>Applied (+15%) 💫</span></div>
                )}
                <div className="border-t border-stone-300 pt-1.5 flex justify-between font-bold text-stone-850"><span>Current Cash:</span><span>🪙 {coins}</span></div>
              </div>
              <button 
                type="button" 
                onClick={handlePayRent} 
                className="w-full rounded-2xl border-[3px] border-[#6F5144] bg-[#C87870] py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-[3px_4px_0_#6F5144] active:translate-y-1 active:shadow-none cursor-pointer"
              >
                {coins >= getDayTotalDeductions() 
                  ? `Pay Rent & Wages 🪙${getDayTotalDeductions()}` 
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
              className="bg-[#FFF9F2] border-4 border-amber-300 p-6 rounded-[36px] shadow-2xl text-center max-w-sm w-full relative min-h-[340px] flex flex-col justify-between"
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

              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3 text-[10px] text-amber-900 font-bold mb-4">
                💡 Clue: &quot;{scrambleInfo.clue}&quot;
              </div>

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
}

// --- Customer and Lobby characters components ---
function CustomerCharacter({ customer, onServe }: { customer: Customer; onServe: () => void }) {
  const animal = customer.type;

  return (
    <motion.button
      type="button"
      aria-label={`Serve ${animal}`}
      initial={{ y: 22, opacity: 0, scale: 0.85 }}
      animate={{
        y: customer.state === "eating" ? [0, -3, 0] : 0,
        opacity: customer.state === "leaving" ? 0 : 1,
        scale: customer.state === "leaving" ? 0.8 : 1,
      }}
      transition={customer.state === "eating" ? { repeat: Infinity, duration: 1.2 } : { duration: 0.35 }}
      onClick={onServe}
      disabled={customer.state !== "waiting"}
      className="absolute bottom-[28px] z-30 flex -translate-x-1/2 flex-col items-center disabled:cursor-default"
      style={{ left: TABLES.find((table) => table.id === customer.tableId)?.left }}
    >
      {customer.state === "waiting" && (
        <div className="mb-1 min-w-[76px] rounded-[14px] border-2 border-[#6F5144] bg-[#FFFAF0] px-2 py-1 text-center shadow-md animate-bounce flex flex-col items-center">
          <span className="block text-[6.5px] font-black uppercase tracking-[0.14em] text-[#A36D61]">Ordering:</span>
          <span className="flex justify-center gap-1 text-[15px] leading-5">
            {customer.order.map((id, index) => {
              const item = MENU.find(m => m.id === id);
              return <span key={`${id}-${index}`}>{item?.emoji}</span>;
            })}
          </span>
        </div>
      )}
      {customer.state === "eating" && (
        <div className="mb-1 rounded-full border border-[#A8BE98] bg-[#F4F7E9] px-2 py-0.5 text-[9px] font-black text-[#58704D]">
          yum! ♡
        </div>
      )}
      
      {/* Custom SVG Render */}
      <CustomerAnimal type={customer.type} patience={customer.patience} state={customer.state} />
      
      {customer.state === "waiting" && (
        <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full border border-[#6F5144]/40 bg-[#FFFFAF]">
          <div
            className={`h-full transition-all ${customer.patience < 35 ? "bg-[#d66f68]" : "bg-[#91b681]"}`}
            style={{ width: `${customer.patience}%` }}
          />
        </div>
      )}
    </motion.button>
  );
}

function LobbyCustomer({ 
  customer, 
  spotIndex,
  isSelected, 
  onClick 
}: { 
  customer: Customer; 
  spotIndex: number;
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const isSad = customer.patience < 35;
  const spot = LOBBY_WAITING_SPOTS[spotIndex % LOBBY_WAITING_SPOTS.length];
  const isWalkingIn = customer.state === "entering";
  const isReading = customer.state === "reading";
  const shouldStroll = !isSelected && customer.state === "waiting";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ x: -120, y: 18, opacity: 0, scale: 0.72 }}
      animate={{
        x: isWalkingIn ? [-120, -58, -18, 0] : shouldStroll ? [0, 10, -6, 0] : 0,
        y: isWalkingIn ? [18, -8, 2, 0] : shouldStroll ? [0, -3, 2, 0] : 0,
        opacity: 1,
        scale: isSelected ? 1.09 : 1,
      }}
      transition={isWalkingIn
        ? { duration: 1.8, ease: "easeOut", delay: spot.delay }
        : shouldStroll
          ? { repeat: Infinity, repeatDelay: 3.2 + spot.delay, duration: 2.4, ease: "easeInOut" }
          : { duration: 0.25 }}
      className={`absolute flex flex-col items-center transition-all cursor-pointer select-none ${
        isSelected 
          ? "z-40 -translate-y-2" 
          : "z-30"
      }`}
      style={{ left: spot.left, bottom: spot.bottom }}
    >
      <motion.div
        animate={isSelected ? { y: [-2, -7, -2] } : { y: [0, -1.5, 0] }}
        transition={{ repeat: Infinity, duration: isSelected ? 0.75 : 2.4, ease: "easeInOut" }}
        className={`relative flex min-w-[70px] flex-col items-center px-1 py-1.5 ${
          isSelected 
            ? "rounded-2xl border-2 border-amber-500 bg-amber-50/70 shadow-[0_0_0_4px_rgba(245,158,11,0.25)]" 
            : "drop-shadow-sm"
        }`}
      >
        {!isWalkingIn && !isReading && (
          <div className="absolute bottom-[29px] h-4 w-14 rounded-full border-2 border-[#6F5144] bg-[#C99E7F] shadow-sm" />
        )}

        <span className="relative z-10 mb-[-4px] rounded-full bg-[#FFF8E8]/80 px-2 py-0.5 text-[7px] font-black uppercase text-[#A36D61] leading-none shadow-sm">
          {isSelected ? "Select Table" : isWalkingIn ? "Walking in..." : isReading ? "Reading menu..." : "Seat Me!"}
        </span>
      
        <div className="relative z-10">
          <CustomerAnimal
            type={customer.type}
            patience={customer.patience}
            state={customer.state}
            pose={isWalkingIn ? "walking" : "sitting"}
          />
        </div>

        {isReading && (
          <motion.div
            animate={{ rotate: [-2, 2, -2], y: [0, -1, 0] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            className="relative z-20 mt-[-17px] flex h-7 w-10 items-center justify-center rounded-sm border-2 border-[#6F5144] bg-[#F3D6A7] text-[9px] shadow-sm"
          >
            <span className="absolute left-1 top-1 h-4 w-3 rounded-sm border border-[#B98562] bg-[#FFF3CF]" />
            <span className="absolute right-1 top-1 h-4 w-3 rounded-sm border border-[#B98562] bg-[#FFF3CF]" />
            <span className="relative z-10 text-[8px]">☕</span>
          </motion.div>
        )}
      
        <div className="relative z-10 mt-[-2px] h-1 w-10 overflow-hidden rounded-full border border-[#6F5144]/30 bg-[#FFFFAF]">
          <div
            className={`h-full transition-all ${isSad ? "bg-[#d66f68]" : "bg-[#91b681]"}`}
            style={{ width: `${customer.patience}%` }}
          />
        </div>

        {customer.state === "waiting" && (
          <div className="relative z-10 mt-1 flex gap-0.5 text-[10px]">
            {customer.order.map((id, index) => {
              const item = MENU.find(m => m.id === id);
              return <span key={`${customer.id}-lobby-item-${id}-${index}`}>{item?.emoji}</span>;
            })}
          </div>
        )}
      </motion.div>
    </motion.button>
  );
}
