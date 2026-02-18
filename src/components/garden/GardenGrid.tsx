"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addMilliseconds } from "date-fns";
import { FlowerType, FLOWERS, getRandomVerse, GardenVerse } from "@/data/gardenVerses";
import { Button } from "@/components/ui/Button";
import { Sprout, Check, ShoppingBag, Plus, X } from "lucide-react";
import confetti from "canvas-confetti";

type Plant = {
    id: string;
    flower_type: FlowerType;
    status: 'planted' | 'growing' | 'ready' | 'bloomed';
    planted_at: string;
    position_index: number;
};

type SeedsInventory = Record<FlowerType, number>;

export function GardenGrid() {
    const [plants, setPlants] = useState<(Plant | null)[]>(Array(9).fill(null));
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [activeChallenge, setActiveChallenge] = useState<{ plant: Plant, verse: GardenVerse } | null>(null);
    const [guess, setGuess] = useState("");
    const [error, setError] = useState("");

    // User Stats
    const [points, setPoints] = useState(0);
    const [seeds, setSeeds] = useState<SeedsInventory>({ daisy: 0, rose: 0, lily: 0, sunflower: 0, tulip: 0 });

    const supabase = createClient();

    // Fetch Data
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Plants
        const { data: plantData } = await supabase
            .from('garden_plants')
            .select('*')
            .eq('user_id', user.id);

        if (plantData) {
            const newPlants = Array(9).fill(null);
            plantData.forEach((p: Plant) => {
                newPlants[p.position_index] = p;
            });
            setPlants(newPlants);
        }

        // Fetch Profile Stats
        const { data: profile } = await supabase
            .from('profiles')
            .select('points, seeds')
            .eq('id', user.id)
            .single();

        if (profile) {
            setPoints(profile.points || 0);
            setSeeds(profile.seeds || { daisy: 0, rose: 0, lily: 0, sunflower: 0, tulip: 0 });
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Mechanics
    const handleSlotClick = (index: number) => {
        const plant = plants[index];
        if (!plant) {
            setSelectedSlot(index);
            // Open inventory mini-menu or check if we have seeds
            // For simplicity, reusing the "Shop/Planting" modal but separating logic
            setIsShopOpen(true);
        } else if (checkIsReady(plant) && plant.status !== 'bloomed') {
            // Harvest
            const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
            const verse = getRandomVerse(flowerInfo.difficulty);
            setActiveChallenge({ plant, verse });
            setGuess("");
            setError("");
        }
    };

    const buySeed = async (type: FlowerType) => {
        const cost = FLOWERS[type].cost;
        if (points < cost) {
            alert("Not enough points!");
            return;
        }

        const newPoints = points - cost;
        const newSeeds = { ...seeds, [type]: (seeds[type] || 0) + 1 };

        // Optimistic UI
        setPoints(newPoints);
        setSeeds(newSeeds);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('profiles').update({
            points: newPoints,
            seeds: newSeeds
        }).eq('id', user.id);
    };

    const plantSeed = async (type: FlowerType) => {
        if (selectedSlot === null) return;
        if ((seeds[type] || 0) <= 0) {
            alert("You need to buy this seed first!");
            return;
        }

        const newSeeds = { ...seeds, [type]: seeds[type] - 1 };
        setSeeds(newSeeds); // Optimistic

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Update Seeds
        await supabase.from('profiles').update({ seeds: newSeeds }).eq('id', user.id);

        // 2. Plant
        const { error } = await supabase.from('garden_plants').insert({
            user_id: user.id,
            flower_type: type,
            status: 'planted', // Starts as seed
            position_index: selectedSlot
        });

        if (!error) {
            setIsShopOpen(false);
            fetchData();
        }
    };

    const checkIsReady = (plant: Plant) => {
        if (plant.status === 'bloomed') return false;
        const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
        const plantedDate = new Date(plant.planted_at);
        const readyDate = addMilliseconds(plantedDate, flowerInfo.growthTimeMs);
        return new Date() >= readyDate;
    };

    const handleGuess = async () => {
        if (!activeChallenge) return;

        if (guess.trim().toLowerCase() === activeChallenge.verse.missingWord.toLowerCase()) {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#FFE4E1', '#98FB98', '#E6E6FA']
            });

            // Update Plant status
            await supabase
                .from('garden_plants')
                .update({ status: 'bloomed' })
                .eq('id', activeChallenge.plant.id);

            // Refund points? Or maybe give XP? 
            // Only blooms stay.

            setActiveChallenge(null);
            fetchData();
        } else {
            setError("Not quite! Try again.");
        }
    };

    // Render Helpers
    const getRenderedPlant = (plant: Plant) => {
        const isReady = checkIsReady(plant);
        const flowerInfo = FLOWERS[plant.flower_type];

        if (plant.status === 'bloomed') {
            return (
                <div className="w-full h-full flex items-center justify-center animate-bounce-slow">
                    <div className="w-24 h-24 overflow-hidden relative">
                        <img
                            src="/images/garden/flowers.png"
                            className="absolute max-w-none h-full object-cover"
                            style={{ left: `-${flowerInfo.imageIndex * 100}%`, width: '500%' }} // 5 flowers
                        />
                    </div>
                </div>
            );
        }

        // Stages: 
        // 1. Packet/Seed (Planted)
        // 2. Sprout (Growing)
        // 3. Bud (Ready) -- Actually let's map:
        // status='planted' -> Seed (Stage 1 or 2 in sprite sheet)
        // time > 50% -> Sprout (Stage 3)
        // ready -> Bud (Stage 4)

        // Sprite Sheet v2: 
        // 1. Packet (we use in UI)
        // 2. Seed on dirt
        // 3. Sprout
        // 4. Bud

        let stageOffset = 1; // Seed on dirt
        const plantedDate = new Date(plant.planted_at);
        const now = new Date();
        const elapsed = now.getTime() - plantedDate.getTime();
        const progress = Math.min(1, elapsed / flowerInfo.growthTimeMs);

        if (isReady) {
            stageOffset = 3; // Bud
        } else if (progress > 0.5) {
            stageOffset = 2; // Sprout
        }

        return (
            <div className={`w-full h-full flex items-center justify-center ${isReady ? "animate-pulse cursor-pointer" : ""}`}>
                <div className="w-20 h-20 overflow-hidden relative">
                    <img
                        src="/images/garden/stages.png"
                        className="absolute max-w-none h-full object-cover"
                        style={{ left: `-${stageOffset * 100}%`, width: '400%' }} // 4 stages
                    />
                </div>
                {isReady && <div className="absolute -top-4 bg-white px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-stone-100 text-sage-green z-10">Ready!</div>}
            </div>
        );
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-6 px-4">
                <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/40">
                    <span className="text-xl">✨</span>
                    <span className="font-serif font-bold text-warm-cocoa">{points} pts</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedSlot(null); setIsShopOpen(true); }} className="gap-2 rounded-full border-warm-grey/20">
                    <ShoppingBag className="w-4 h-4" /> Seed Shop
                </Button>
            </div>

            <div className="relative w-full aspect-square">
                {/* Background */}
                <div
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat rounded-3xl"
                    style={{ backgroundImage: 'url(/images/garden/background.png)' }}
                />

                {/* Plants Grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[10%] gap-[2%]">
                    {plants.map((plant, i) => (
                        <div
                            key={i}
                            className="relative flex items-center justify-center rounded-full hover:bg-white/5 transition-all cursor-pointer group"
                            onClick={() => handleSlotClick(i)}
                        >
                            {plant ? getRenderedPlant(plant) : (
                                <div className="w-12 h-12 rounded-full border-2 border-dashed border-warm-grey/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Shop & Inventory Modal */}
            {isShopOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm sm:p-4 animate-in fade-in">
                    <div className="bg-white hover:bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl h-[80vh] sm:h-auto flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-serif text-2xl text-warm-cocoa">Garden Shed</h3>
                                <p className="text-xs text-warm-grey">Buy seeds and plant them.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsShopOpen(false)}><X className="w-5 h-5" /></Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {Object.entries(FLOWERS).map(([key, info]) => {
                                const count = seeds[key as FlowerType] || 0;
                                return (
                                    <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative border border-warm-grey/5">
                                                {/* Packet Icon */}
                                                <img
                                                    src="/images/garden/stages.png"
                                                    className="absolute max-w-none h-full object-cover"
                                                    style={{ left: '0%', width: '400%' }} // Packet is index 0
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-warm-grey flex items-center gap-2">
                                                    {info.name}
                                                    {count > 0 && <span className="bg-sage-green text-white text-[10px] px-1.5 py-0.5 rounded-full">x{count} owned</span>}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-warm-grey/60">
                                                    <span className="uppercase tracking-wider">{info.difficulty}</span>
                                                    <span>•</span>
                                                    <span>{info.cost} pts</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Plant Button (if slot selected and has seeds) */}
                                            {selectedSlot !== null && count > 0 && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => plantSeed(key as FlowerType)}
                                                    className="rounded-xl bg-sage-green hover:bg-sage-green/90 text-white"
                                                >
                                                    Plant
                                                </Button>
                                            )}

                                            {/* Buy Button */}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => buySeed(key as FlowerType)}
                                                disabled={points < info.cost}
                                                className={`rounded-xl border-warm-grey/20 ${points < info.cost ? "opacity-50" : ""}`}
                                            >
                                                Buy
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Verse Challenge Modal */}
            {activeChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl text-center relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage-green to-muted-rose" />

                        <div className="w-24 h-24 mx-auto mb-6 animate-bounce-slow drop-shadow-lg">
                            <div className="w-24 h-24 overflow-hidden relative mx-auto rounded-full bg-stone-50 border-4 border-white">
                                <img src="/images/garden/stages.png" className="absolute max-w-none h-full object-cover" style={{ left: '-300%', width: '400%' }} />
                            </div>
                        </div>

                        <h3 className="font-serif text-2xl text-warm-cocoa mb-1">Harvest Time!</h3>
                        <p className="text-sm text-warm-grey mb-6">Complete the scripture to collect your flower.</p>

                        <div className="bg-soft-paper/50 p-6 rounded-2xl border border-warm-grey/10 mb-6 relative">
                            <span className="absolute top-4 left-4 text-4xl text-warm-grey/5 font-serif">"</span>
                            <p className="font-serif text-lg text-warm-cocoa leading-relaxed relative z-10">
                                {activeChallenge.verse.text.split("______").map((part, i, arr) => (
                                    <span key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className="inline-block border-b-2 border-dashed border-sage-green min-w-[3rem] mx-1 font-sans font-bold text-sage-green">{guess || "?"}</span>
                                        )}
                                    </span>
                                ))}
                            </p>
                            <p className="text-xs text-warm-grey/60 mt-4 text-right font-medium">— {activeChallenge.verse.reference}</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Type the missing word..."
                                className="w-full p-4 rounded-xl border border-warm-grey/20 text-center font-medium focus:outline-none focus:ring-2 focus:ring-sage-green/50 bg-stone-50 transition-all"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                autoFocus
                            />
                            {error && <p className="text-sm text-red-400 font-medium animate-shake flex items-center justify-center gap-1"><X className="w-4 h-4" /> {error}</p>}

                            <Button
                                className="w-full rounded-xl h-12 text-lg font-bold bg-sage-green hover:bg-sage-green/90 text-white shadow-lg shadow-sage-green/20 transition-transform active:scale-95"
                                onClick={handleGuess}
                            >
                                Bloom Forever 🌸
                            </Button>
                        </div>

                        <button onClick={() => setActiveChallenge(null)} className="absolute top-4 right-4 text-warm-grey/40 hover:text-warm-grey transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
