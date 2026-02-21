"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addMilliseconds } from "date-fns";
import { FlowerType, FLOWERS, getRandomVerse, GardenVerse } from "@/data/gardenVerses";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Plus, X, Sprout, Star } from "lucide-react";
import confetti from "canvas-confetti";

type Plant = {
    id: string;
    flower_type: FlowerType;
    status: 'planted' | 'growing' | 'ready' | 'bloomed';
    planted_at: string;
    position_index: number;
};

type SeedsInventory = Record<FlowerType, number>;

// Emoji mapping for premium feel
const FLOWER_EMOJIS: Record<FlowerType, string> = {
    'daisy': '🌼',
    'rose': '🌹',
    'lily': '🪷',
    'sunflower': '🌻',
    'tulip': '🌷',
};

const SEED_EMOJI = '🌰';
const SPROUT_EMOJI = '🌱';
const BUD_EMOJI = '🌿';

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
        const interval = setInterval(fetchData, 10000); // Check more frequently
        return () => clearInterval(interval);
    }, []);

    // Mechanics
    const handleSlotClick = (index: number) => {
        const plant = plants[index];
        if (!plant) {
            setSelectedSlot(index);
            setIsShopOpen(true);
        } else if (checkIsReady(plant) && plant.status !== 'bloomed') {
            // Harvest Challenge
            const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
            const verse = getRandomVerse(flowerInfo.difficulty);
            setActiveChallenge({ plant, verse });
            setGuess("");
            setError("");
        } else if (plant.status === 'bloomed') {
            // Collect bloomed flower
            collectFlower(plant);
        }
    };

    const collectFlower = async (plant: Plant) => {
        const flowerInfo = FLOWERS[plant.flower_type as FlowerType];

        // Reward user
        const rewardPoints = flowerInfo.cost * 2; // Return double the cost as reward
        const newPoints = points + rewardPoints;

        setPoints(newPoints); // Optimistic UI

        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#FFE4E1', '#FFD700', '#E6E6FA']
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update Points
        await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);

        // Remove Plant
        await supabase.from('garden_plants').delete().eq('id', plant.id);

        fetchData();
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
            status: 'planted',
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
                <div className="w-full h-full flex flex-col items-center justify-center animate-bounce-slow cursor-pointer" title="Click to collect!">
                    <div className="text-5xl lg:text-6xl drop-shadow-xl z-20 hover:scale-110 transition-transform">
                        {FLOWER_EMOJIS[plant.flower_type]}
                    </div>
                    <div className="absolute -bottom-2 bg-yellow-100/90 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm z-30 flex items-center gap-1 border border-yellow-200">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> Collect
                    </div>
                </div>
            );
        }

        // Logic for stages
        const plantedDate = new Date(plant.planted_at);
        const now = new Date();
        const elapsed = now.getTime() - plantedDate.getTime();
        const progress = Math.min(1, elapsed / flowerInfo.growthTimeMs);

        let currentEmoji = SEED_EMOJI;
        let animationClass = "animate-pulse-slow object-center";

        if (isReady) {
            currentEmoji = BUD_EMOJI;
            animationClass = "animate-pulse shadow-[0_0_15px_rgba(152,251,152,0.6)] rounded-full";
        } else if (progress > 0.5) {
            currentEmoji = SPROUT_EMOJI;
            animationClass = "";
        }

        return (
            <div className={`w-full h-full flex flex-col items-center justify-center ${isReady ? "cursor-pointer" : ""}`}>
                <div className={`text-4xl lg:text-5xl drop-shadow-md z-10 transition-all ${animationClass}`}>
                    {currentEmoji}
                </div>
                {isReady && (
                    <div className="absolute -top-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold shadow-md border border-stone-100 text-sage-green z-30 animate-bounce">
                        Ready!
                    </div>
                )}
                {!isReady && (
                    <div className="absolute bottom-1 right-1 w-full flex justify-center z-30 opacity-60">
                        <div className="w-1/2 bg-black/20 rounded-full h-1 overflow-hidden">
                            <div className="bg-white h-full" style={{ width: `${progress * 100}%` }} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-6 px-4">
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <span className="text-xl">✨</span>
                    <span className="font-serif font-bold text-warm-cocoa tracking-wide">{points} pts</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedSlot(null); setIsShopOpen(true); }} className="gap-2 rounded-2xl border-warm-grey/20 bg-white/70 backdrop-blur-md hover:bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <ShoppingBag className="w-4 h-4" /> Seed Shop
                </Button>
            </div>

            <div className="relative w-full aspect-square max-w-[400px] mx-auto">
                {/* Premium CSS-based Background Instead of Image */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] shadow-inner overflow-hidden border-8 border-white/40 backdrop-blur-sm">
                    {/* Decorative grass patterns */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#81c784 2px, transparent 2px)', backgroundSize: '20px 20px' }} />
                </div>

                {/* Plants Grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-[10%] gap-4 z-10">
                    {plants.map((plant, i) => (
                        <div
                            key={i}
                            className="relative flex items-center justify-center cursor-pointer group rounded-full max-w-[100px] max-h-[100px] mx-auto w-full h-full"
                            onClick={() => handleSlotClick(i)}
                        >
                            {/* The "Dirt" plot */}
                            <div className="absolute inset-2 bg-[#8d6e63] rounded-full shadow-inner opacity-60 group-hover:opacity-80 transition-opacity border-b-4 border-black/10" />

                            {plant ? getRenderedPlant(plant) : (
                                <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-sm z-20">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Shop & Inventory Modal */}
            {isShopOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-warm-cocoa/20 backdrop-blur-md sm:p-4 animate-in fade-in">
                    <div className="bg-white/95 hover:bg-white/95 backdrop-blur-xl rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-md shadow-2xl h-[80vh] sm:h-auto flex flex-col border border-white">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div>
                                <h3 className="font-serif text-3xl text-warm-cocoa">Garden Shed</h3>
                                <p className="text-sm text-warm-grey/80">Buy and plant seeds.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsShopOpen(false)} className="rounded-full bg-stone-100/50 hover:bg-stone-200"><X className="w-5 h-5" /></Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 px-2 pb-4 scrollbar-hide">
                            {Object.entries(FLOWERS).map(([key, info]) => {
                                const count = seeds[key as FlowerType] || 0;
                                return (
                                    <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-stone-200/50 text-2xl relative">
                                                {/* Packet Icon with flower emoji hinting what it is */}
                                                <span className="absolute text-xs -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5">{FLOWER_EMOJIS[key as FlowerType]}</span>
                                                🌱
                                            </div>
                                            <div>
                                                <p className="font-bold text-warm-cocoa flex items-center gap-2 text-lg">
                                                    {info.name}
                                                    {count > 0 && <span className="bg-sage-green/10 text-sage-green font-bold text-[10px] px-2 py-0.5 rounded-full ring-1 ring-sage-green/20">x{count}</span>}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-warm-grey font-medium mt-0.5">
                                                    <span className="bg-stone-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{info.difficulty}</span>
                                                    <span>•</span>
                                                    <span className="text-amber-600 font-bold">{info.cost} pts</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {/* Plant Button (if slot selected and has seeds) */}
                                            {selectedSlot !== null && count > 0 && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => plantSeed(key as FlowerType)}
                                                    className="rounded-xl bg-sage-green hover:bg-sage-green/90 text-white w-full shadow-md shadow-sage-green/20"
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
                                                className={`rounded-xl border-warm-grey/20 w-full ${points < info.cost ? "opacity-50" : "hover:bg-amber-50"}`}
                                            >
                                                Buy Seed
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
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl text-center relative overflow-hidden border border-white">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sage-green via-[#a8e6cf] to-sage-green" />

                        <div className="w-24 h-24 mx-auto mb-6 animate-bounce-slow drop-shadow-xl relative z-10">
                            <div className="w-24 h-24 flex items-center justify-center mx-auto rounded-full bg-gradient-to-b from-stone-50 to-stone-100 border-4 border-white shadow-inner text-5xl">
                                {BUD_EMOJI}
                            </div>
                        </div>

                        <h3 className="font-serif text-3xl text-warm-cocoa mb-2">Harvest Time!</h3>
                        <p className="text-sm text-warm-grey mb-8 font-medium">Complete the scripture to bloom your flower.</p>

                        <div className="bg-white/80 p-6 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] border border-warm-grey/10 mb-8 relative">
                            <span className="absolute -top-3 left-4 text-4xl text-warm-grey/10 font-serif">"</span>
                            <p className="font-serif text-xl text-warm-cocoa leading-relaxed relative z-10">
                                {activeChallenge.verse.text.split("______").map((part, i, arr) => (
                                    <span key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className="inline-block border-b-2 border-dashed border-sage-green min-w-[4rem] mx-1 font-sans font-bold text-sage-green">{guess || "?"}</span>
                                        )}
                                    </span>
                                ))}
                            </p>
                            <p className="text-xs text-warm-grey/60 mt-5 text-right font-medium tracking-wide uppercase">— {activeChallenge.verse.reference}</p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Type the missing word..."
                                className="w-full p-4 rounded-2xl border border-warm-grey/20 text-center font-bold text-lg focus:outline-none focus:ring-4 focus:ring-sage-green/20 bg-stone-50 transition-all"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                autoFocus
                            />
                            {error && <p className="text-sm text-red-500 font-bold animate-shake flex items-center justify-center gap-1.5 bg-red-50 py-2 rounded-xl"><X className="w-4 h-4" /> {error}</p>}

                            <Button
                                className="w-full rounded-2xl h-14 text-xl font-bold bg-sage-green hover:bg-sage-green/90 text-white shadow-xl shadow-sage-green/30 transition-transform active:scale-95"
                                onClick={handleGuess}
                            >
                                Bloom Forever {FLOWER_EMOJIS[activeChallenge.plant.flower_type]}
                            </Button>
                        </div>

                        <button onClick={() => setActiveChallenge(null)} className="absolute top-6 right-6 text-warm-grey/40 hover:text-warm-grey bg-white rounded-full p-1 shadow-sm transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
