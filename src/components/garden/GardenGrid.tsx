"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDistance, addMilliseconds } from "date-fns";
import { FlowerType, FLOWERS, getRandomVerse, GardenVerse } from "@/data/gardenVerses";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog"; // Assuming we have these or will use standard HTML dialog for now if not
import { Sprout, Check } from "lucide-react";
import confetti from "canvas-confetti";

// Note: Using simple divs for Dialog if shadcn/ui Dialog isn't fully set up or to avoid complex imports,
// but checking recent files usage it seems likely we can use custom modals or standard logic.
// I will build a custom modal inside here for simplicity and guaranteed "cute" styling.

type Plant = {
    id: string;
    flower_type: FlowerType;
    status: 'growing' | 'ready' | 'bloomed';
    planted_at: string;
    position_index: number;
};

export function GardenGrid() {
    const [plants, setPlants] = useState<(Plant | null)[]>(Array(9).fill(null));
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isPlantingModalOpen, setIsPlantingModalOpen] = useState(false);
    const [activeChallenge, setActiveChallenge] = useState<{ plant: Plant, verse: GardenVerse } | null>(null);
    const [guess, setGuess] = useState("");
    const [error, setError] = useState("");

    const supabase = createClient();

    // Fetch Plants
    const fetchPlants = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('garden_plants')
            .select('*')
            .eq('user_id', user.id);

        if (data) {
            const newPlants = Array(9).fill(null);
            data.forEach((p: Plant) => {
                newPlants[p.position_index] = p;
            });
            setPlants(newPlants);
        }
    };

    useEffect(() => {
        fetchPlants();
        const interval = setInterval(fetchPlants, 60000); // Poll every minute for status updates
        return () => clearInterval(interval);
    }, []);

    // Planting Logic
    const handleSlotClick = (index: number) => {
        const plant = plants[index];
        if (!plant) {
            setSelectedSlot(index);
            setIsPlantingModalOpen(true);
        } else if (plant.status === 'ready' || (plant.status === 'growing' && checkIsReady(plant))) {
            // Trigger Harvest
            const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
            const verse = getRandomVerse(flowerInfo.difficulty);
            setActiveChallenge({ plant, verse });
            setGuess("");
            setError("");
        }
    };

    const plantSeed = async (type: FlowerType) => {
        if (selectedSlot === null) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('garden_plants').insert({
            user_id: user.id,
            flower_type: type,
            status: 'growing',
            position_index: selectedSlot
        });

        if (!error) {
            setIsPlantingModalOpen(false);
            fetchPlants();
        }
    };

    // Challenge Logic
    const checkIsReady = (plant: Plant) => {
        const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
        const plantedDate = new Date(plant.planted_at);
        const readyDate = addMilliseconds(plantedDate, flowerInfo.growthTimeMs);
        return new Date() >= readyDate;
    };

    const handleGuess = async () => {
        if (!activeChallenge) return;

        if (guess.trim().toLowerCase() === activeChallenge.verse.missingWord.toLowerCase()) {
            // Success!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFE4E1', '#E6E6FA', '#F0FFF0'] // Pastel confetti
            });

            await supabase
                .from('garden_plants')
                .update({ status: 'bloomed' })
                .eq('id', activeChallenge.plant.id);

            setActiveChallenge(null);
            fetchPlants();
        } else {
            setError("Not quite! Try again.");
        }
    };

    // Rendering Helpers
    const getRenderedPlant = (plant: Plant) => {
        const isReady = checkIsReady(plant);
        const flowerInfo = FLOWERS[plant.flower_type];

        if (plant.status === 'bloomed') {
            // Calculate sprite position
            const spriteX = flowerInfo.imageIndex * 128; // Assuming 128px wide sprites? Actually I'll use CSS background position or object-fit
            // Since we generated a sheet, it's safer to rely on "img src" if we split them, 
            // OR use object-fit/position. 
            // Validating generated image: "bloomed_flowers.png" likely has them in a row. 
            // Let's assume equal width.
            return (
                <div className="w-full h-full flex items-center justify-center animate-bounce-slow">
                    <div className="w-20 h-20 overflow-hidden relative">
                        <img
                            src="/images/garden/flowers.png"
                            className="absolute max-w-none h-full object-cover"
                            style={{ left: `-${flowerInfo.imageIndex * 100}%`, width: '500%' }} // 5 flowers
                        />
                    </div>
                </div>
            );
        }

        // Growing Stages
        // Seed (0-33%), Sprout (33-66%), Bud (66-100% / Ready)
        // For simplicity: 
        // Ready -> Bud (Stage 3)
        // Growing -> Stage 1 or 2 based on time? Let's just do Stage 2 for growing, Stage 3 for Ready.
        let stageIndex = 1; // Sprout
        if (isReady) stageIndex = 2; // Bud

        return (
            <div className={`w-full h-full flex items-center justify-center ${isReady ? "animate-pulse cursor-pointer" : ""}`}>
                <div className="w-16 h-16 overflow-hidden relative">
                    <img
                        src="/images/garden/stages.png"
                        className="absolute max-w-none h-full object-cover"
                        style={{ left: `-${stageIndex * 100}%`, width: '300%' }} // 3 stages
                    />
                </div>
                {isReady && <div className="absolute -top-2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow text-sage-green">Ready!</div>}
            </div>
        );
    };

    return (
        <div className="relative w-full aspect-square max-w-md mx-auto">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center rounded-3xl shadow-inner border-4 border-white/50"
                style={{ backgroundImage: 'url(/images/garden/background.png)' }}
            />

            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-8 gap-4">
                {plants.map((plant, i) => (
                    <div
                        key={i}
                        className="relative flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleSlotClick(i)}
                    >
                        {plant ? getRenderedPlant(plant) : (
                            <div className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-all opacity-0 hover:opacity-100">
                                <span className="text-white font-bold text-xs">+</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Planting Modal */}
            {isPlantingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <h3 className="font-serif text-2xl text-warm-cocoa text-center">Plant a Seed</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(FLOWERS).map(([key, info]) => (
                                <button
                                    key={key}
                                    onClick={() => plantSeed(key as FlowerType)}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-warm-grey/10 transition-all text-left"
                                >
                                    <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                                        {/* Use bloomed sprite as preview icon */}
                                        <div className="w-8 h-8 overflow-hidden relative">
                                            <img
                                                src="/images/garden/flowers.png"
                                                className="absolute max-w-none h-full object-cover"
                                                style={{ left: `-${info.imageIndex * 100}%`, width: '500%' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-warm-grey">{info.name}</p>
                                        <p className="text-xs text-warm-grey/60 uppercase tracking-wider">{info.difficulty}</p>
                                    </div>
                                    <span className="text-xs font-mono text-warm-grey/40">
                                        {info.growthTimeMs / (1000 * 60 * 60)}h
                                    </span>
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full rounded-xl" onClick={() => setIsPlantingModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {activeChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 text-center">
                        <div className="w-20 h-20 mx-auto animate-bounce-slow">
                            {/* Bud Sprite */}
                            <div className="w-20 h-20 overflow-hidden relative mx-auto">
                                <img src="/images/garden/stages.png" className="absolute max-w-none h-full object-cover" style={{ left: '-200%', width: '300%' }} />
                            </div>
                        </div>

                        <div>
                            <h3 className="font-serif text-xl text-warm-cocoa mb-2">It's Ready to Bloom!</h3>
                            <p className="text-sm text-warm-grey">Complete the verse to harvest.</p>
                        </div>

                        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                            <p className="font-serif text-lg text-warm-grey leading-relaxed">
                                {activeChallenge.verse.text.split("______").map((part, i, arr) => (
                                    <span key={i}>
                                        {part}
                                        {i < arr.length - 1 && (
                                            <span className="inline-block border-b-2 border-dashed border-sage-green w-20 mx-1 text-transparent">word</span>
                                        )}
                                    </span>
                                ))}
                            </p>
                            <p className="text-xs text-warm-grey/40 mt-2 text-right">— {activeChallenge.verse.reference}</p>
                        </div>

                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Type the missing word..."
                                className="w-full p-3 rounded-xl border border-warm-grey/20 text-center font-medium focus:outline-none focus:ring-2 focus:ring-sage-green/50"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                            />
                            {error && <p className="text-xs text-red-400 font-medium animate-shake">{error}</p>}
                        </div>

                        <Button
                            className="w-full rounded-xl h-12 text-lg bg-sage-green hover:bg-sage-green/90 text-white shadow-lg shadow-sage-green/20"
                            onClick={handleGuess}
                        >
                            Bloom! 🌸
                        </Button>
                        <button onClick={() => setActiveChallenge(null)} className="text-xs text-warm-grey/40 hover:text-warm-grey underline">Wait, not yet</button>
                    </div>
                </div>
            )}
        </div>
    );
}
