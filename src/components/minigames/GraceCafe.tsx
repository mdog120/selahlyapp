"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  Clock3,
  Coffee,
  Lock,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from "lucide-react";

type Animal = "bunny" | "bear" | "deer" | "mouse" | "sloth";
type CustomerState = "waiting" | "eating" | "leaving";
type Station = "oven" | "drinks";

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
}

interface Customer {
  id: string;
  animal: Animal;
  order: string[];
  patience: number;
  tableId: number;
  state: CustomerState;
}

interface CookingJob {
  jobId: string;
  itemId: string;
  startedAt: number;
  finishesAt: number;
}

interface Upgrade {
  id: "oven" | "machine" | "plants" | "helper";
  name: string;
  emoji: string;
  price: number;
  description: string;
}

interface SaveData {
  coins?: number;
  day?: number;
  rating?: number;
  owned?: Upgrade["id"][];
}

const MENU: MenuItem[] = [
  { id: "cookie", name: "Covenant Choco Cookies", shortName: "Choco cookies", emoji: "🍪", station: "oven", ingredientCost: 8, price: 8, batch: 3, seconds: 3, unlockDay: 1 },
  { id: "cupcake", name: "Cherub Strawberry Cupcake", shortName: "Cupcake", emoji: "🧁", station: "oven", ingredientCost: 10, price: 12, batch: 2, seconds: 4, unlockDay: 1 },
  { id: "latte", name: "Sanctuary Cinnamon Latte", shortName: "Cinnamon latte", emoji: "☕", station: "drinks", ingredientCost: 7, price: 15, batch: 1, seconds: 3, unlockDay: 1 },
  { id: "pancake", name: "Pentecost Berry Pancakes", shortName: "Berry pancakes", emoji: "🥞", station: "oven", ingredientCost: 13, price: 18, batch: 2, seconds: 5, unlockDay: 2 },
  { id: "tea", name: "Living Water Green Tea", shortName: "Green tea", emoji: "🍵", station: "drinks", ingredientCost: 9, price: 18, batch: 1, seconds: 4, unlockDay: 2 },
  { id: "roll", name: "Grace Cinnamon Roll", shortName: "Cinnamon roll", emoji: "🥐", station: "oven", ingredientCost: 16, price: 14, batch: 3, seconds: 6, unlockDay: 3 },
  { id: "boba", name: "Beatitude Strawberry Boba", shortName: "Strawberry boba", emoji: "🧋", station: "drinks", ingredientCost: 14, price: 24, batch: 1, seconds: 5, unlockDay: 4 },
  { id: "cake", name: "Selah Strawberry Cake", shortName: "Strawberry cake", emoji: "🍰", station: "oven", ingredientCost: 24, price: 22, batch: 3, seconds: 7, unlockDay: 5 },
];

const UPGRADES: Upgrade[] = [
  { id: "oven", name: "Honeybee Oven", emoji: "🍯", price: 120, description: "Bakes every pastry 30% faster." },
  { id: "machine", name: "Cloud Milk Frother", emoji: "☁️", price: 140, description: "Makes every drink 30% faster." },
  { id: "plants", name: "Trailing Pothos", emoji: "🌿", price: 90, description: "Customers lose patience more slowly." },
  { id: "helper", name: "Muffin the Helper", emoji: "🐰", price: 180, description: "Cleans used tables automatically." },
];

const TABLES = [
  { id: 1, left: "43%" },
  { id: 2, left: "64%" },
  { id: 3, left: "84%" },
];

const ANIMALS: Record<Animal, { emoji: string; name: string; color: string }> = {
  bunny: { emoji: "🐰", name: "Bunny", color: "#f8d9df" },
  bear: { emoji: "🐻", name: "Bear", color: "#d8b69b" },
  deer: { emoji: "🦌", name: "Deer", color: "#e4c39e" },
  mouse: { emoji: "🐭", name: "Mouse", color: "#cbd5d8" },
  sloth: { emoji: "🦥", name: "Sloth", color: "#c9b9a4" },
};

const SAVE_KEY = "selahly_grace_cafe_v3";
const SHIFT_LENGTH = 55;

const menuItem = (id: string) => MENU.find((item) => item.id === id);

function makeCustomer(day: number, tableId: number): Customer {
  const unlocked = MENU.filter((item) => item.unlockDay <= day);
  const orderSize = day >= 3 && Math.random() > 0.68 ? 2 : 1;
  const order = Array.from({ length: orderSize }, () => unlocked[Math.floor(Math.random() * unlocked.length)].id);
  const animals = Object.keys(ANIMALS) as Animal[];

  return {
    id: crypto.randomUUID(),
    animal: animals[Math.floor(Math.random() * animals.length)],
    order,
    patience: 100,
    tableId,
    state: "waiting",
  };
}

function CustomerCharacter({ customer, onServe }: { customer: Customer; onServe: () => void }) {
  const animal = ANIMALS[customer.animal];

  return (
    <motion.button
      type="button"
      aria-label={`Serve ${animal.name}`}
      initial={{ y: 22, opacity: 0, scale: 0.85 }}
      animate={{
        y: customer.state === "eating" ? [0, -3, 0] : 0,
        opacity: customer.state === "leaving" ? 0 : 1,
        scale: customer.state === "leaving" ? 0.8 : 1,
      }}
      transition={customer.state === "eating" ? { repeat: Infinity, duration: 1.2 } : { duration: 0.35 }}
      onClick={onServe}
      disabled={customer.state !== "waiting"}
      className="absolute bottom-[36px] z-30 flex -translate-x-1/2 flex-col items-center disabled:cursor-default"
      style={{ left: TABLES.find((table) => table.id === customer.tableId)?.left }}
    >
      {customer.state === "waiting" && (
        <div className="mb-1 min-w-[76px] rounded-[14px] border-2 border-[#6f5144] bg-[#fffaf0] px-2 py-1 text-center shadow-[2px_3px_0_#6f5144]">
          <span className="block text-[7px] font-black uppercase tracking-[0.14em] text-[#a36d61]">May I have…</span>
          <span className="flex justify-center gap-1 text-[17px] leading-5">
            {customer.order.map((id, index) => <span key={`${id}-${index}`}>{menuItem(id)?.emoji}</span>)}
          </span>
        </div>
      )}
      {customer.state === "eating" && (
        <div className="mb-1 rounded-full border border-[#a8be98] bg-[#f4f7e9] px-2 py-0.5 text-[9px] font-black text-[#58704d]">
          yum! ♡
        </div>
      )}
      <div
        className="grid h-14 w-14 place-items-center rounded-[45%_45%_40%_40%] border-2 border-[#6f5144] text-[35px] shadow-[2px_3px_0_rgba(111,81,68,.28)]"
        style={{ backgroundColor: animal.color }}
      >
        {animal.emoji}
      </div>
      {customer.state === "waiting" && (
        <div className="mt-1 h-1.5 w-12 overflow-hidden rounded-full border border-[#6f5144]/40 bg-[#fffaf0]">
          <div
            className={`h-full transition-all ${customer.patience < 35 ? "bg-[#d66f68]" : "bg-[#91b681]"}`}
            style={{ width: `${customer.patience}%` }}
          />
        </div>
      )}
    </motion.button>
  );
}

export function GraceCafe() {
  const [coins, setCoins] = useState(70);
  const [day, setDay] = useState(1);
  const [rating, setRating] = useState(100);
  const [timeLeft, setTimeLeft] = useState(SHIFT_LENGTH);
  const [shiftActive, setShiftActive] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dirtyTables, setDirtyTables] = useState<number[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [jobs, setJobs] = useState<CookingJob[]>([]);
  const [owned, setOwned] = useState<Upgrade["id"][]>([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [earnedToday, setEarnedToday] = useState(0);
  const [servedToday, setServedToday] = useState(0);
  const [message, setMessage] = useState("Welcome to Grace Café! Open the doors when you are ready.");
  const [now, setNow] = useState(0);
  const nowRef = useRef(0);
  const customerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shiftActiveRef = useRef(false);

  const hasUpgrade = useCallback((id: Upgrade["id"]) => owned.includes(id), [owned]);

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as SaveData;
      queueMicrotask(() => {
        setCoins(saved.coins ?? 70);
        setDay(saved.day ?? 1);
        setRating(saved.rating ?? 100);
        setOwned(saved.owned ?? []);
      });
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

  useEffect(() => () => clearCustomerTimers(), [clearCustomerTimers]);

  const endShift = useCallback(() => {
    shiftActiveRef.current = false;
    setShiftActive(false);
    setCustomers([]);
    setJobs([]);
    setDirtyTables([]);
    clearCustomerTimers();
    setReportOpen(true);
    setMessage("The café is closed for the evening. Lovely work today!");
  }, [clearCustomerTimers]);

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

  useEffect(() => {
    if (!shiftActive) return;

    const patienceTimer = setInterval(() => {
      setCustomers((current) => {
        const drain = hasUpgrade("plants") ? 3 : 5;
        const impatient = current.filter((customer) => customer.state === "waiting" && customer.patience <= drain);
        if (impatient.length) {
          setRating((value) => Math.max(20, value - impatient.length * 4));
          setMessage("Oh crumbs—someone waited too long. Prep a small batch before the next guest!");
        }
        return current
          .filter((customer) => !(customer.state === "waiting" && customer.patience <= drain))
          .map((customer) => customer.state === "waiting"
            ? { ...customer, patience: Math.max(0, customer.patience - drain) }
            : customer);
      });
    }, 1000);

    return () => clearInterval(patienceTimer);
  }, [hasUpgrade, shiftActive]);

  useEffect(() => {
    if (!shiftActive) return;

    const spawnTimer = setInterval(() => {
      setCustomers((current) => {
        const occupied = new Set(current.map((customer) => customer.tableId));
        const available = TABLES.find((table) => !occupied.has(table.id) && !dirtyTables.includes(table.id));
        if (!available) return current;
        const customer = makeCustomer(day, available.id);
        setMessage(`${ANIMALS[customer.animal].name} found a cozy table and is ready to order.`);
        return [...current, customer];
      });
    }, Math.max(4300, 6800 - day * 250));

    return () => clearInterval(spawnTimer);
  }, [day, dirtyTables, shiftActive]);

  useEffect(() => {
    if (!shiftActive || jobs.length === 0) return;

    const jobTimer = setInterval(() => {
      nowRef.current += 250;
      const timestamp = nowRef.current;
      setNow(timestamp);
      setJobs((current) => {
        const finished = current.filter((job) => job.finishesAt <= timestamp);
        if (!finished.length) return current;

        setStock((currentStock) => {
          const next = { ...currentStock };
          finished.forEach((job) => {
            const item = menuItem(job.itemId);
            if (item) next[item.id] = (next[item.id] ?? 0) + item.batch;
          });
          return next;
        });
        setMessage("Ding! A fresh batch is waiting on the serving counter.");
        return current.filter((job) => job.finishesAt > timestamp);
      });
    }, 250);

    return () => clearInterval(jobTimer);
  }, [jobs.length, shiftActive]);

  useEffect(() => {
    if (!shiftActive || !hasUpgrade("helper") || dirtyTables.length === 0) return;
    const tableId = dirtyTables[0];
    const timer = setTimeout(() => {
      setDirtyTables((current) => current.filter((id) => id !== tableId));
      setMessage(`Muffin polished table ${tableId} until it sparkled.`);
    }, 2200);
    return () => clearTimeout(timer);
  }, [dirtyTables, hasUpgrade, shiftActive]);

  const startShift = () => {
    clearCustomerTimers();
    shiftActiveRef.current = true;
    setShiftActive(true);
    setReportOpen(false);
    setTimeLeft(SHIFT_LENGTH);
    nowRef.current = 0;
    setNow(0);
    setCustomers([makeCustomer(day, 1)]);
    setDirtyTables([]);
    setStock({});
    setJobs([]);
    setEarnedToday(0);
    setServedToday(0);
    setMessage(`Day ${day} is open! Your first guest is already seated.`);
  };

  const startCooking = (item: MenuItem) => {
    if (!shiftActive || item.unlockDay > day || jobs.length >= 3) return;
    if (coins < item.ingredientCost) {
      setMessage("Not enough coins for those ingredients yet.");
      return;
    }

    const isFaster = item.station === "oven" ? hasUpgrade("oven") : hasUpgrade("machine");
    const duration = item.seconds * (isFaster ? 0.7 : 1) * 1000;
    const timestamp = nowRef.current;
    setCoins((value) => value - item.ingredientCost);
    setJobs((current) => [...current, {
      jobId: crypto.randomUUID(),
      itemId: item.id,
      startedAt: timestamp,
      finishesAt: timestamp + duration,
    }]);
    setMessage(`${item.name} is ${item.station === "oven" ? "baking" : "brewing"} now.`);
  };

  const serveCustomer = (customer: Customer) => {
    if (customer.state !== "waiting") return;

    const needed: Record<string, number> = {};
    customer.order.forEach((id) => { needed[id] = (needed[id] ?? 0) + 1; });
    const missing = Object.entries(needed).find(([id, amount]) => (stock[id] ?? 0) < amount);
    if (missing) {
      setMessage(`You still need ${menuItem(missing[0])?.shortName ?? "part of this order"}.`);
      return;
    }

    const earnings = customer.order.reduce((total, id) => total + (menuItem(id)?.price ?? 0), 0);
    const tip = customer.patience >= 70 ? 3 : 0;
    setStock((current) => {
      const next = { ...current };
      Object.entries(needed).forEach(([id, amount]) => { next[id] = Math.max(0, (next[id] ?? 0) - amount); });
      return next;
    });
    setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, state: "eating" } : item));
    setMessage(`Order served! ${ANIMALS[customer.animal].name} is happily eating.`);

    const finishTimer = setTimeout(() => {
      if (!shiftActiveRef.current) return;
      setCoins((value) => value + earnings + tip);
      setEarnedToday((value) => value + earnings + tip);
      setServedToday((value) => value + 1);
      setRating((value) => Math.min(100, value + (tip ? 2 : 1)));
      setDirtyTables((current) => [...current, customer.tableId]);
      setCustomers((current) => current.map((item) => item.id === customer.id ? { ...item, state: "leaving" } : item));
      setMessage(`${ANIMALS[customer.animal].name} left ${earnings + tip} coins${tip ? " including a sweet-service tip" : ""}.`);

      const leaveTimer = setTimeout(() => {
        if (!shiftActiveRef.current) return;
        setCustomers((current) => current.filter((item) => item.id !== customer.id));
      }, 700);
      customerTimers.current.push(leaveTimer);
    }, 3800);
    customerTimers.current.push(finishTimer);
  };

  const cleanTable = (tableId: number) => {
    if (!dirtyTables.includes(tableId)) return;
    setDirtyTables((current) => current.filter((id) => id !== tableId));
    setMessage(`Table ${tableId} is clean and ready for another guest.`);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (owned.includes(upgrade.id)) return;
    if (coins < upgrade.price) {
      setMessage("Save a few more coins for that café upgrade.");
      return;
    }
    setCoins((value) => value - upgrade.price);
    setOwned((current) => [...current, upgrade.id]);
    setMessage(`${upgrade.name} is now part of Grace Café!`);
  };

  const payRentAndContinue = () => {
    const rent = 12 + Math.max(0, day - 1) * 2;
    setCoins((value) => Math.max(20, value - rent));
    setDay((value) => value + 1);
    setReportOpen(false);
    setMessage(`Rent paid. The kitchen is ready for day ${day + 1}.`);
  };

  const stockItems = useMemo(
    () => MENU.filter((item) => (stock[item.id] ?? 0) > 0),
    [stock],
  );

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[30px] border-[3px] border-[#6f5144] bg-[#f8efe0] text-[#5d4439] shadow-[0_18px_50px_rgba(93,68,57,.22)]">
      <header className="flex items-center justify-between border-b-[3px] border-[#6f5144] bg-[#b96f69] px-4 py-3 text-[#fff9ed]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#fff2d9] bg-[#89544f] text-xl">☕</div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#ffe4bd]">A little place to pause</p>
            <h2 className="font-serif text-lg font-black leading-none">Grace Café</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black">
          <span className="rounded-full border border-[#fff2d9]/60 bg-[#89544f]/60 px-2.5 py-1">DAY {day}</span>
          <span className="flex items-center gap-1 rounded-full border border-[#fff2d9]/60 bg-[#89544f]/60 px-2.5 py-1">
            <Star className="h-3 w-3 fill-[#ffe49d] text-[#ffe49d]" /> {rating}%
          </span>
          <span className="flex items-center gap-1 rounded-full border border-[#fff2d9]/60 bg-[#89544f]/60 px-2.5 py-1">
            <Clock3 className="h-3 w-3" /> {shiftActive ? `${timeLeft}s` : "closed"}
          </span>
        </div>
      </header>

      <section className="relative h-[300px] overflow-hidden border-b-[3px] border-[#6f5144] bg-[#f5dfc5]">
        <div className="absolute inset-x-0 top-0 h-[205px] bg-[linear-gradient(#f7e7cf_0_73%,#e9c7ad_73%)]" />
        <div className="absolute inset-x-0 top-4 flex justify-around px-8">
          {Array.from({ length: 10 }).map((_, index) => (
            <span key={index} className={`h-2.5 w-2.5 rounded-full border border-[#6f5144] ${index % 3 === 0 ? "bg-[#f2b2a0]" : index % 3 === 1 ? "bg-[#f4d685]" : "bg-[#a9c7aa]"} shadow-[0_0_8px_#fff3bd]`} />
          ))}
        </div>

        <div className="absolute left-5 top-10 h-[104px] w-[132px] rounded-t-[62px] border-[3px] border-[#6f5144] bg-[#b9d7d0] p-2 shadow-[inset_0_0_0_5px_#f8efe0]">
          <div className="h-full rounded-t-[48px] bg-[linear-gradient(145deg,#cfe7e1_0_48%,#fff7df_49%_52%,#b5d2cb_53%)]" />
          <div className="absolute -bottom-2 left-1/2 h-4 w-36 -translate-x-1/2 rounded border-2 border-[#6f5144] bg-[#c68c67]" />
        </div>

        <div className="absolute left-[177px] top-10 w-[124px] -rotate-2 rounded border-[3px] border-[#6f5144] bg-[#fff8e8] p-2 text-center shadow-[3px_4px_0_#d8a783]">
          <p className="font-serif text-[13px] font-black">give thanks</p>
          <p className="text-[7px] font-bold uppercase tracking-widest text-[#a36d61]">in every little thing</p>
          <div className="mt-1 text-sm">🌼 ☕ 🌿</div>
        </div>

        {hasUpgrade("plants") && <div className="absolute right-6 top-0 text-5xl drop-shadow-md">🌿</div>}
        <div className="absolute left-0 top-[145px] h-[62px] w-[35%] rounded-tr-[24px] border-r-[3px] border-t-[3px] border-[#6f5144] bg-[#9faf82]">
          <div className="absolute -top-12 left-5 flex items-end gap-3">
            <div className="grid h-14 w-16 place-items-center rounded-t-xl border-[3px] border-[#6f5144] bg-[#d9b88d] text-3xl">{hasUpgrade("oven") ? "🍯" : "♨️"}</div>
            <div className="grid h-16 w-14 place-items-center rounded-t-[18px] border-[3px] border-[#6f5144] bg-[#91b6b2] text-3xl">{hasUpgrade("machine") ? "☁️" : "☕"}</div>
          </div>
          <span className="absolute bottom-2 left-5 font-serif text-[11px] font-black text-[#fff9ed]">GRACE KITCHEN</span>
          {hasUpgrade("helper") && <span className="absolute bottom-5 right-4 text-4xl">🐰</span>}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-[95px] border-t-[3px] border-[#6f5144] bg-[#d5b28f] bg-[linear-gradient(45deg,rgba(255,248,232,.22)_25%,transparent_25%_75%,rgba(255,248,232,.22)_75%),linear-gradient(45deg,rgba(255,248,232,.22)_25%,transparent_25%_75%,rgba(255,248,232,.22)_75%)] bg-[position:0_0,15px_15px] bg-[size:30px_30px]" />

        {TABLES.map((table) => {
          const dirty = dirtyTables.includes(table.id);
          return (
            <button
              key={table.id}
              type="button"
              onClick={() => cleanTable(table.id)}
              className="absolute bottom-[18px] z-20 h-12 w-[76px] -translate-x-1/2 rounded-[50%] border-[3px] border-[#6f5144] bg-[#f7e8cf] shadow-[0_8px_0_#9b735d]"
              style={{ left: table.left }}
            >
              {dirty ? <span className="text-xl">🧽</span> : <span className="text-[8px] font-black text-[#a36d61]">TABLE {table.id}</span>}
            </button>
          );
        })}

        <AnimatePresence>
          {customers.map((customer) => (
            <CustomerCharacter key={customer.id} customer={customer} onServe={() => serveCustomer(customer)} />
          ))}
        </AnimatePresence>
      </section>

      <div className="flex items-center justify-between gap-3 border-b-2 border-[#d2ad91] bg-[#fff8e8] px-4 py-2.5">
        <span className="rounded-full border-2 border-[#8c684f] bg-[#f2ce74] px-3 py-1 text-[11px] font-black shadow-[2px_2px_0_#8c684f]">🪙 {coins}</span>
        <p className="flex-1 text-center font-serif text-[11px] font-bold italic text-[#7c5b4d]">{message}</p>
        <button type="button" onClick={() => setShopOpen(true)} className="flex items-center gap-1.5 rounded-full border-2 border-[#6f5144] bg-[#b6c99e] px-3 py-1 text-[10px] font-black shadow-[2px_2px_0_#6f5144] transition active:translate-y-0.5 active:shadow-none">
          <ShoppingBag className="h-3.5 w-3.5" /> Shop
        </button>
      </div>

      {!shiftActive ? (
        <div className="grid min-h-[245px] place-items-center bg-[#f8efe0] p-8 text-center">
          <div>
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full border-[3px] border-[#6f5144] bg-[#f3c4bb] text-3xl shadow-[4px_5px_0_#d7a487]">🏡</div>
            <h3 className="font-serif text-xl font-black">Ready for a cozy shift?</h3>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-[#8d7064]">Bake a few treats, tap a guest when their complete order is ready, and clean the table after they leave.</p>
            <button type="button" onClick={startShift} className="mt-4 rounded-2xl border-[3px] border-[#6f5144] bg-[#c87870] px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-[3px_4px_0_#6f5144] transition active:translate-y-1 active:shadow-none">
              Open for day {day} ✦
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 bg-[#f8efe0] p-3 md:grid-cols-[1fr_1.8fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-[#9a7662] bg-[#fff8e8] p-3 shadow-[2px_3px_0_#d6b294]">
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#a36d61]"><Sparkles className="h-3 w-3" /> Serving counter</p>
              {stockItems.length ? (
                <div className="flex flex-wrap gap-2">
                  {stockItems.map((item) => (
                    <span key={item.id} className="rounded-xl border-2 border-[#d4ad8d] bg-[#f9e6c8] px-2 py-1 text-[11px] font-black">
                      {item.emoji} ×{stock[item.id]}
                    </span>
                  ))}
                </div>
              ) : <p className="text-[10px] italic text-[#a08a7e]">Fresh food will appear here.</p>}
            </div>

            <div className="rounded-2xl border-2 border-[#9a7662] bg-[#e4ecd8] p-3 shadow-[2px_3px_0_#b8c69f]">
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#617557]"><Clock3 className="h-3 w-3" /> In the kitchen · {jobs.length}/3</p>
              {jobs.length ? jobs.map((job) => {
                const item = menuItem(job.itemId);
                const progress = Math.min(100, ((now - job.startedAt) / (job.finishesAt - job.startedAt)) * 100);
                return (
                  <div key={job.jobId} className="mb-2 last:mb-0">
                    <div className="mb-0.5 flex justify-between text-[9px] font-bold"><span>{item?.emoji} {item?.shortName}</span><span>{Math.max(0, Math.ceil((job.finishesAt - now) / 1000))}s</span></div>
                    <div className="h-2 overflow-hidden rounded-full border border-[#708365] bg-[#fff8e8]"><div className="h-full bg-[#91b681]" style={{ width: `${progress}%` }} /></div>
                  </div>
                );
              }) : <p className="text-[10px] italic text-[#718069]">Choose a recipe to begin.</p>}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#9a7662] bg-[#fffaf0] p-3 shadow-[2px_3px_0_#d6b294]">
            <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#a36d61]"><ChefHat className="h-3 w-3" /> Recipe book</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MENU.map((item) => {
                const locked = item.unlockDay > day;
                const disabled = locked || jobs.length >= 3 || coins < item.ingredientCost;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => startCooking(item)}
                    className="relative min-h-[76px] rounded-xl border-2 border-[#c99e7f] bg-[#f8e6ca] p-2 text-left shadow-[2px_2px_0_#c99e7f] transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#fcefdc] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {locked ? <Lock className="mb-1 h-4 w-4" /> : <span className="text-xl">{item.emoji}</span>}
                    <span className="block truncate text-[9px] font-black">{locked ? `Unlocks day ${item.unlockDay}` : item.shortName}</span>
                    {!locked && <span className="mt-1 flex items-center justify-between text-[8px] font-bold text-[#9c6c58]"><span>🪙{item.ingredientCost}</span><span>makes {item.batch}</span></span>}
                    <span className="absolute right-1.5 top-1.5 text-[#8d7064]">{item.station === "drinks" ? <Coffee className="h-3 w-3" /> : <ChefHat className="h-3 w-3" />}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {shopOpen && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-[#4c382f]/55 p-4 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="w-full max-w-md rounded-[26px] border-[3px] border-[#6f5144] bg-[#fff8e8] p-5 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div><p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#a36d61]">The cozy corner shop</p><h3 className="font-serif text-lg font-black">Café upgrades</h3></div>
                <button type="button" onClick={() => setShopOpen(false)} className="rounded-full border-2 border-[#6f5144] bg-[#f1c2b8] p-1"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2">
                {UPGRADES.map((upgrade) => {
                  const purchased = owned.includes(upgrade.id);
                  return (
                    <div key={upgrade.id} className="flex items-center gap-3 rounded-2xl border-2 border-[#d0aa8b] bg-[#f9e8cf] p-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-[#9b765f] bg-[#fff8e8] text-2xl">{upgrade.emoji}</span>
                      <div className="min-w-0 flex-1"><p className="text-[11px] font-black">{upgrade.name}</p><p className="text-[9px] text-[#8d7064]">{upgrade.description}</p></div>
                      <button type="button" disabled={purchased} onClick={() => buyUpgrade(upgrade)} className="rounded-xl border-2 border-[#6f5144] bg-[#b6c99e] px-2.5 py-1 text-[9px] font-black disabled:bg-[#ddd2c2]">
                        {purchased ? "Owned" : `🪙 ${upgrade.price}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reportOpen && (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#4c382f]/55 p-4 backdrop-blur-[2px]">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-sm rounded-[28px] border-[3px] border-[#6f5144] bg-[#fff8e8] p-6 text-center shadow-2xl">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border-[3px] border-[#6f5144] bg-[#f2ce74] text-2xl">✨</div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a36d61]">Day {day} complete</p>
              <h3 className="font-serif text-xl font-black">The doors are closed</h3>
              <div className="my-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border-2 border-[#d0aa8b] bg-[#f9e8cf] p-3"><p className="text-xl font-black">{servedToday}</p><p className="text-[8px] font-black uppercase tracking-wider">guests served</p></div>
                <div className="rounded-2xl border-2 border-[#a8bd91] bg-[#e4ecd8] p-3"><p className="text-xl font-black">+{earnedToday}</p><p className="text-[8px] font-black uppercase tracking-wider">coins earned</p></div>
              </div>
              <p className="mb-4 text-[10px] text-[#8d7064]">Evening rent: {12 + Math.max(0, day - 1) * 2} coins. You will always keep enough to reopen.</p>
              <button type="button" onClick={payRentAndContinue} className="w-full rounded-2xl border-[3px] border-[#6f5144] bg-[#c87870] py-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-[3px_4px_0_#6f5144] active:translate-y-1 active:shadow-none">
                Close the register
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
