"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Play, Music, Volume2, VolumeX, Save, RotateCcw } from "lucide-react";
import Link from "next/link";

// --- Types ---
type GameState = "MENU" | "CUSTOMIZE" | "GAME_LOBBY" | "GAME_KITCHEN" | "GAME_SEATING" | "GAME_OVER";
type Customer = {
    id: number;
    type: number; // Index in sprite sheet
    order: string;
    patience: number; // 100 to 0
    state: "WAITING" | "SEATED" | "EATING" | "LEAVING";
};
type Avatar = {
    skin: number;
    hair: number;
    hairColor: string;
    outfit: number;
};

// --- Constants ---
const DRINKS = ["Latte", "Matcha", "Boba", "Cocoa"];
const PASTRIES = ["Croissant", "Donut", "Cake", "Macaron"];
const PRICES: Record<string, number> = {
    "Latte": 5, "Matcha": 6, "Boba": 7, "Cocoa": 4,
    "Croissant": 3, "Donut": 2, "Cake": 4, "Macaron": 3
};

export function CafeGame() {
    // Top Level State
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [money, setMoney] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [avatar, setAvatar] = useState<Avatar>({ skin: 0, hair: 0, hairColor: "#4A3B2A", outfit: 0 });

    // Game State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [activeOrder, setActiveOrder] = useState<Customer | null>(null);
    const [kitchenQueue, setKitchenQueue] = useState<string[]>([]); // Items being prepared
    const [soundEnabled, setSoundEnabled] = useState(true);

    const supabase = createClient();

    // Load Data
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('cafe_high_score, cafe_avatar').eq('id', user.id).single();
                if (data) {
                    setHighScore(data.cafe_high_score || 0);
                    if (data.cafe_avatar) setAvatar(data.cafe_avatar);
                }
            }
        };
        load();
    }, []);

    // Save Data
    const saveProgress = async (newMoney: number) => {
        if (newMoney > highScore) {
            setHighScore(newMoney);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    cafe_high_score: newMoney,
                    cafe_avatar: avatar // Save avatar casually too
                }).eq('id', user.id);
            }
        }
    };

    // --- Components ---

    const MenuScreen = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-sky-100">
            {/* Background Image Layer */}
            <div className="absolute inset-0 opacity-50" style={{
                backgroundImage: 'url(/images/cafe/backgrounds.png)',
                backgroundSize: '100% 300%', // 3 stacked backgrounds
                backgroundPosition: '0 0' // Lobby
            }} />

            <div className="z-10 text-center animate-fade-in-up">
                <h1 className="font-serif text-6xl text-warm-cocoa mb-2 drop-shadow-md">Selah Cafe</h1>
                <p className="text-warm-grey mb-8 text-xl font-medium">Brew, Serve, & Relax!</p>

                <div className="flex flex-col gap-4 w-64 mx-auto">
                    <Button
                        onClick={() => setGameState("CUSTOMIZE")}
                        className="w-full h-14 text-xl bg-sage-green hover:bg-sage-green/90 text-white shadow-lg border-2 border-white rounded-2xl"
                    >
                        New Game
                    </Button>
                    {highScore > 0 && (
                        <div className="bg-white/80 p-2 rounded-xl text-warm-grey text-sm font-bold">
                            High Score: ${highScore}
                        </div>
                    )}
                </div>
            </div>

            {/* Character Preview */}
            <div className="absolute bottom-10 left-10">
                <div className="w-32 h-32 relative">
                    {/* Placeholder for 8-bit character */}
                    <img src="/images/cafe/characters.png" className="w-[300%] max-w-none pixelated" style={{ clipPath: 'inset(0 66% 66% 0)' }} />
                </div>
            </div>
        </div>
    );

    const CustomizeScreen = () => {
        // Need to implement swapping sprites
        // For now using simple placeholders interacting with the sprite sheet logic conceptually
        return (
            <div className="absolute inset-0 bg-orange-50 flex flex-col items-center justify-center p-8">
                <h2 className="font-serif text-3xl text-warm-cocoa mb-8">Customize Your Barista</h2>

                <div className="flex gap-12 items-center mb-12">
                    {/* Preview Box */}
                    <div className="w-64 h-64 bg-white rounded-3xl border-4 border-sage-green shadow-xl flex items-center justify-center relative overflow-hidden">
                        {/* We would use a canvas or stacked divs with background-position for sprite sheet composition */}
                        <div className="text-warm-grey/40 text-center">
                            <p className="text-xs mb-2">(Character Preview)</p>
                            <img
                                src="/images/cafe/characters.png"
                                className="w-[192px] h-[192px] object-none" // Zoomed in
                                style={{
                                    imageRendering: 'pixelated',
                                    objectPosition: `-${avatar.skin * 32}px 0` // Example logic
                                }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="bg-white p-6 rounded-3xl shadow-md space-y-6 w-80">
                        <div>
                            <label className="text-xs font-bold text-warm-grey uppercase mb-2 block">Hair Style</label>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setAvatar(prev => ({ ...prev, hair: (prev.hair + 1) % 5 }))}>Next</Button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-warm-grey uppercase mb-2 block">Outfit</label>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setAvatar(prev => ({ ...prev, outfit: (prev.outfit + 1) % 4 }))}>Next</Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => {
                        setMoney(0);
                        setGameState("GAME_LOBBY");
                    }}
                    className="h-12 px-8 text-lg bg-indigo-400 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
                >
                    Open Cafe! <Play className="w-5 h-5 ml-2" />
                </Button>
            </div>
        );
    };

    const GameHUD = () => (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur border-2 border-sage-green rounded-xl p-3 shadow-lg flex items-center gap-3 pointer-events-auto">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center border border-yellow-300 transform -rotate-12">
                    <span className="text-xl">💰</span>
                </div>
                <div>
                    <p className="text-xs text-warm-grey font-bold uppercase">Earnings</p>
                    <p className="font-serif text-2xl text-sage-green">${money}</p>
                </div>
            </div>

            <div className="flex gap-2 pointer-events-auto">
                <Button size="sm" variant="ghost" className="bg-white/50 hover:bg-white w-10 h-10 p-0" onClick={() => setSoundEnabled(!soundEnabled)}>
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-warm-grey" /> : <VolumeX className="w-5 h-5 text-warm-grey/50" />}
                </Button>
                <Button size="sm" variant="ghost" className="bg-white/50 hover:bg-white text-red-400 w-10 h-10 p-0" onClick={() => setGameState("MENU")}>
                    <RotateCcw className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );

    const SceneBackground = ({ scene }: { scene: string }) => {
        // bg-position logic for split backgrounds
        let pos = '0 0'; // Lobby
        if (scene === 'GAME_KITCHEN') pos = '0 33.33%';
        if (scene === 'GAME_SEATING') pos = '0 66.66%';

        return (
            <div className="absolute inset-0 bg-sky-50 transition-all duration-500">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-500"
                    style={{
                        backgroundImage: 'url(/images/cafe/backgrounds.png)',
                        backgroundSize: '100% 300%',
                        backgroundPosition: pos,
                        filter: 'contrast(1.05) brightness(1.02)'
                    }}
                />
            </div>
        );
    };

    // --- Render Logic ---

    // Simple Render for now - verify logic first
    if (gameState === "MENU") return (
        <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-stone-100">
            <MenuScreen />
        </div>
    );

    if (gameState === "CUSTOMIZE") return (
        <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-stone-100">
            <CustomizeScreen />
        </div>
    );

    return (
        <div className="w-full h-screen relative overflow-hidden font-sans select-none bg-stone-800">
            <SceneBackground scene={gameState} />
            <GameHUD />

            {/* Navigation Areas */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-40">
                <Button
                    onClick={() => setGameState("GAME_LOBBY")}
                    className={`rounded-full shadow-lg border-2 ${gameState === "GAME_LOBBY" ? 'bg-sage-green text-white border-white' : 'bg-white text-warm-grey border-transparent'}`}
                >
                    Lobby
                </Button>
                <Button
                    onClick={() => setGameState("GAME_KITCHEN")}
                    className={`rounded-full shadow-lg border-2 ${gameState === "GAME_KITCHEN" ? 'bg-sage-green text-white border-white' : 'bg-white text-warm-grey border-transparent'}`}
                >
                    Kitchen
                </Button>
                <Button
                    onClick={() => setGameState("GAME_SEATING")}
                    className={`rounded-full shadow-lg border-2 ${gameState === "GAME_SEATING" ? 'bg-sage-green text-white border-white' : 'bg-white text-warm-grey border-transparent'}`}
                >
                    Seating
                </Button>
            </div>

            {/* Scene Content */}
            {gameState === "GAME_LOBBY" && (
                <div className="absolute inset-0 flex items-center justify-center p-20">
                    {/* Counter */}
                    <div className="absolute bottom-0 w-full h-32 bg-transparent" />

                    {/* Pending Customer Logic would go here */}
                    <div className="bg-white/80 p-4 rounded-xl backdrop-blur-sm animate-bounce cursor-pointer" onClick={() => {
                        setMoney(m => m + 5);
                        // Simulating work
                    }}>
                        <p className="text-center font-bold text-warm-grey">New Customer! (+ $5)</p>
                        <img src="/images/cafe/customers.png" className="h-16 w-16 object-cover object-top mx-auto mt-2 pixelated" />
                    </div>
                </div>
            )}
            {gameState === "GAME_KITCHEN" && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4">
                        {DRINKS.map(d => (
                            <Button key={d} className="bg-white/90 h-20 w-20 flex flex-col items-center justify-center hover:bg-white shadow">
                                {/* Placeholders for sprites */}
                                <span className="text-xs font-bold text-warm-grey">{d}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

// Add pixelated utility class to global CSS if needed, or inline style
const pixelStyle = { imageRendering: 'pixelated' } as const;
