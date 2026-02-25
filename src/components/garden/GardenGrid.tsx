"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { addMilliseconds, differenceInSeconds, differenceInMinutes, differenceInHours } from "date-fns";
import { FlowerType, FLOWERS, getRandomVerse, GardenVerse } from "@/data/gardenVerses";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Plus, X, Star, Clock, Gift, Users, GiftIcon } from "lucide-react";
import confetti from "canvas-confetti";

type Plant = {
    id: string;
    flower_type: FlowerType;
    status: 'planted' | 'growing' | 'ready' | 'bloomed';
    planted_at: string;
    position_index: number;
};

type SeedsInventory = Record<FlowerType, number>;
type CollectedFlowers = Record<FlowerType, number>;

type GiftItem = {
    id: string;
    sender: { username: string, full_name: string, avatar_url: string | null };
    flower_type: FlowerType;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
};

// Emoji mapping for premium feel
const FLOWER_EMOJIS: Record<FlowerType, string> = {
    'daisy': '🌼',
    'rose': '🌹',
    'lily': '🪷',
    'sunflower': '🌻',
    'tulip': '🌷',
    'orchid': '🌸',
    'peony': '🌺',
    'lavender': '🪻',
    'daffodil': '🏵️',
    'hibiscus': '🌸',
    'cherry_blossom': '💮',
    'iris': '🌸',
    'violet': '🪻',
    'marigold': '🏵️',
    'lily_of_valley': '🌿',
};

const SEED_EMOJI = '🌰';
const SPROUT_EMOJI = '🌱';
const BUD_EMOJI = '🌿';

export function GardenGrid() {
    const [userId, setUserId] = useState<string | null>(null);
    const [plants, setPlants] = useState<(Plant | null)[]>(Array(9).fill(null));
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [activeChallenge, setActiveChallenge] = useState<{ plant: Plant, verse: GardenVerse } | null>(null);
    const [guess, setGuess] = useState("");
    const [error, setError] = useState("");

    // Details Modal
    const [viewingPlant, setViewingPlant] = useState<Plant | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    // Stats & Inventory
    const [points, setPoints] = useState(0);
    const [seeds, setSeeds] = useState<SeedsInventory>({} as SeedsInventory);
    const [collected, setCollected] = useState<CollectedFlowers>({} as CollectedFlowers);

    // Gifting
    const [isGiftingOpen, setIsGiftingOpen] = useState(false);
    const [friends, setFriends] = useState<{ id: string, username: string, full_name: string, avatar_url: string }[]>([]);
    const [gifts, setGifts] = useState<GiftItem[]>([]);
    const [flowerToGift, setFlowerToGift] = useState<FlowerType | null>(null);

    const supabase = createClient();

    // Fetch Data
    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

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
            .select('points, seeds, collected_flowers')
            .eq('id', user.id)
            .single();

        if (profile) {
            setPoints(profile.points || 0);
            setSeeds(profile.seeds || {});
            setCollected(profile.collected_flowers || {});
        }

        // Fetch pending gifts
        const { data: giftData } = await supabase
            .from('flower_gifts')
            .select('id, flower_type, status, created_at, sender:profiles!flower_gifts_sender_id_fkey(username, full_name, avatar_url)')
            .eq('receiver_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (giftData) setGifts(giftData as any[]);
    };

    const fetchFriends = async () => {
        if (!userId) return;

        const { data } = await supabase
            .from("friendships")
            .select(`
                user_id_1,
                user_id_2,
                user1:profiles!friendships_user_id_1_fkey(id, username, full_name, avatar_url),
                user2:profiles!friendships_user_id_2_fkey(id, username, full_name, avatar_url)
            `)
            .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
            .eq("status", "accepted");

        if (data) {
            const friendList = data.map((f: any) => {
                const friendRecord = f.user_id_1 === userId ? f.user2 : f.user1;
                return {
                    id: friendRecord.id,
                    username: friendRecord.username,
                    full_name: friendRecord.full_name,
                    avatar_url: friendRecord.avatar_url
                };
            });
            setFriends(friendList);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Time remaining tick
        if (!viewingPlant) return;
        const tick = () => {
            const flowerInfo = FLOWERS[viewingPlant.flower_type as FlowerType];
            const plantedDate = new Date(viewingPlant.planted_at);
            const readyDate = addMilliseconds(plantedDate, flowerInfo.growthTimeMs);
            const now = new Date();

            if (now >= readyDate) {
                setTimeRemaining("Ready!");
            } else {
                const diffSecs = differenceInSeconds(readyDate, now);
                const h = Math.floor(diffSecs / 3600);
                const m = Math.floor((diffSecs % 3600) / 60);
                const s = diffSecs % 60;

                if (h > 0) setTimeRemaining(`${h}h ${m}m remaining`);
                else if (m > 0) setTimeRemaining(`${m}m ${s}s remaining`);
                else setTimeRemaining(`${s}s remaining`);
            }
        };
        tick();
        const int = setInterval(tick, 1000);
        return () => clearInterval(int);
    }, [viewingPlant]);


    // Mechanics
    const handleSlotClick = (index: number) => {
        const plant = plants[index];
        if (!plant) {
            setSelectedSlot(index);
            setIsShopOpen(true);
        } else if (plant.status === 'bloomed') {
            collectFlower(plant);
        } else if (checkIsReady(plant)) {
            // Harvest Challenge
            const flowerInfo = FLOWERS[plant.flower_type as FlowerType];
            const verse = getRandomVerse(flowerInfo.difficulty);
            setActiveChallenge({ plant, verse });
            setGuess("");
            setError("");
        } else {
            // Viewing active plant
            setViewingPlant(plant);
        }
    };

    const collectFlower = async (plant: Plant) => {
        const flowerInfo = FLOWERS[plant.flower_type as FlowerType];

        // Reward user
        const rewardPoints = flowerInfo.cost * 2;
        const newPoints = points + rewardPoints;
        const newCollected = { ...collected, [plant.flower_type]: (collected[plant.flower_type] || 0) + 1 };

        setPoints(newPoints); // Optimistic UI
        setCollected(newCollected); // Optimistic UI

        confetti({
            particleCount: 80,
            spread: 80,
            origin: { y: 0.8 },
            colors: ['#FFE4E1', '#FFD700', '#E6E6FA']
        });

        if (!userId) return;

        // Update Points and Collected
        await supabase.from('profiles').update({
            points: newPoints,
            collected_flowers: newCollected
        }).eq('id', userId);

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

        setPoints(newPoints);
        setSeeds(newSeeds);

        if (!userId) return;

        await supabase.from('profiles').update({
            points: newPoints,
            seeds: newSeeds
        }).eq('id', userId);
    };

    const plantSeed = async (type: FlowerType) => {
        if (selectedSlot === null) return;
        if ((seeds[type] || 0) <= 0) return;

        const newSeeds = { ...seeds, [type]: seeds[type] - 1 };
        setSeeds(newSeeds);

        if (!userId) return;

        await supabase.from('profiles').update({ seeds: newSeeds }).eq('id', userId);

        const { error } = await supabase.from('garden_plants').insert({
            user_id: userId,
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
        if (plant.status === 'bloomed') return true; // bloomed is effectively ready to collect
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

    const sendGift = async (receiverId: string) => {
        if (!flowerToGift || !userId) return;

        // deduct from collected
        if ((collected[flowerToGift] || 0) <= 0) return;
        const newCollected = { ...collected, [flowerToGift]: collected[flowerToGift] - 1 };
        setCollected(newCollected);

        await supabase.from('profiles').update({ collected_flowers: newCollected }).eq('id', userId);

        await supabase.from('flower_gifts').insert({
            sender_id: userId,
            receiver_id: receiverId,
            flower_type: flowerToGift,
            status: 'pending'
        });

        setFlowerToGift(null);
        alert("Gift sent successfully! 🌸");
    };

    const handleGiftDecision = async (giftId: string, flowerType: FlowerType, accept: boolean) => {
        if (!userId) return;

        // Optimistically remove from inbox
        setGifts(gifts.filter(g => g.id !== giftId));

        if (accept) {
            // Add to collected
            const newCollected = { ...collected, [flowerType]: (collected[flowerType] || 0) + 1 };
            setCollected(newCollected);
            await supabase.from('profiles').update({ collected_flowers: newCollected }).eq('id', userId);
        }

        await supabase.from('flower_gifts').update({
            status: accept ? 'accepted' : 'rejected'
        }).eq('id', giftId);
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
                </div>
            );
        }

        const plantedDate = new Date(plant.planted_at);
        const now = new Date();
        const elapsed = now.getTime() - plantedDate.getTime();
        const progress = Math.min(1, elapsed / flowerInfo.growthTimeMs);

        let currentEmoji = SEED_EMOJI;
        let animationClass = "animate-pulse-slow object-center";

        if (isReady) {
            currentEmoji = BUD_EMOJI;
            animationClass = "animate-pulse shadow-[0_0_15px_rgba(152,251,152,0.6)] rounded-full text-5xl bg-white/20";
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
        <div className="w-full max-w-lg mx-auto pb-24">
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-6 px-4">
                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                    <span className="text-xl">✨</span>
                    <span className="font-serif font-bold text-warm-cocoa tracking-wide">{points} pts</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { fetchFriends(); setIsGiftingOpen(true); }} className="relative gap-2 rounded-2xl border-warm-grey/20 bg-white/70 backdrop-blur-md hover:bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                        <Gift className="w-4 h-4 text-warm-cocoa" /> Collection
                        {gifts.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">{gifts.length}</span>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedSlot(null); setIsShopOpen(true); }} className="gap-2 rounded-2xl border-warm-grey/20 bg-white/70 backdrop-blur-md hover:bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                        <ShoppingBag className="w-4 h-4 text-sage-green" /> Shop
                    </Button>
                </div>
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

            {/* Time Remaining Popover */}
            {viewingPlant && viewingPlant.status !== 'bloomed' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setViewingPlant(null)}>
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 w-[200px] shadow-2xl text-center relative border border-white" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sage-green to-[#a8e6cf]" />
                        <Clock className="w-8 h-8 text-sage-green mx-auto mb-3" />
                        <h4 className="font-serif text-lg text-warm-cocoa mb-1">{FLOWERS[viewingPlant.flower_type].name}</h4>
                        <p className="text-xs text-warm-grey/80 mb-4 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-100 font-medium">{timeRemaining}</p>
                        <Button variant="outline" size="sm" onClick={() => setViewingPlant(null)} className="w-full rounded-xl text-xs">Close</Button>
                    </div>
                </div>
            )}

            {/* Collection & Gifting Modal */}
            {isGiftingOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-warm-cocoa/20 backdrop-blur-md sm:p-4 animate-in fade-in">
                    <div className="bg-white/95 hover:bg-white/95 backdrop-blur-xl rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-md shadow-2xl h-[85vh] sm:h-[600px] flex flex-col border border-white">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div>
                                <h3 className="font-serif text-3xl text-warm-cocoa">My Collection</h3>
                                <p className="text-sm text-warm-grey/80">Flowers you've bloomed and gifts.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setIsGiftingOpen(false)} className="rounded-full bg-stone-100/50 hover:bg-stone-200"><X className="w-5 h-5" /></Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-6 px-2 pb-4 scrollbar-hide">

                            {/* Inbox / Gifts */}
                            {gifts.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-warm-grey">Gifts Inbox</h4>
                                    {gifts.map(gift => (
                                        <div key={gift.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden shrink-0">
                                                    {gift.sender.avatar_url ? <img src={gift.sender.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-muted-rose text-white">{(gift.sender.full_name || gift.sender.username).charAt(0)}</div>}
                                                </div>
                                                <p className="text-sm text-warm-cocoa font-medium">
                                                    <span className="font-bold">{gift.sender.full_name || gift.sender.username}</span> sent you a <strong className="text-amber-600">{FLOWERS[gift.flower_type].name}</strong>! {FLOWER_EMOJIS[gift.flower_type]}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={() => handleGiftDecision(gift.id, gift.flower_type, true)} className="flex-1 bg-sage-green hover:bg-sage-green/90 rounded-xl">Accept</Button>
                                                <Button size="sm" variant="outline" onClick={() => handleGiftDecision(gift.id, gift.flower_type, false)} className="flex-1 rounded-xl">Decline</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Collection Grid */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-warm-grey">Collected Flowers</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(FLOWERS).map(([key, info]) => {
                                        const count = collected[key as FlowerType] || 0;
                                        if (count === 0 && !flowerToGift) return null; // hide 0 counts unless gifting

                                        return (
                                            <div key={key} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-100 relative group text-center">
                                                <div className="text-4xl mb-2 drop-shadow-sm">{FLOWER_EMOJIS[key as FlowerType]}</div>
                                                <p className="text-[10px] font-bold text-warm-grey leading-tight">{info.name}</p>
                                                <div className="absolute -top-2 -right-2 bg-white text-sage-green font-bold text-[10px] w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-stone-100">
                                                    x{count}
                                                </div>

                                                {count > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setFlowerToGift(key as FlowerType)}
                                                        className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-2xl flex items-center justify-center transition-opacity text-xs gap-1 backdrop-blur-sm"
                                                    >
                                                        <GiftIcon className="w-3 h-3" /> Gift
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {Object.values(collected).reduce((a, b) => a + b, 0) === 0 && (
                                        <div className="col-span-3 py-8 text-center text-warm-grey text-sm">
                                            You haven't collected any flowers yet. Plant seeds and bloom them to build your collection! 🌸
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Send Gift Selector Modal inside the Collection sheet */}
                            {flowerToGift && (
                                <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md rounded-[2rem] p-6 flex flex-col">
                                    <h4 className="font-serif text-2xl text-warm-cocoa mb-1">Gift a Flower</h4>
                                    <p className="text-sm text-warm-grey mb-6">Select a friend to send your {FLOWER_EMOJIS[flowerToGift]} {FLOWERS[flowerToGift].name} to.</p>

                                    <div className="flex-1 overflow-y-auto space-y-2">
                                        {friends.map(friend => (
                                            <div key={friend.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden shrink-0">
                                                        {friend.avatar_url ? <img src={friend.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-muted-rose text-white">{(friend.full_name || friend.username).charAt(0)}</div>}
                                                    </div>
                                                    <p className="text-sm font-bold text-warm-cocoa">{friend.full_name || friend.username}</p>
                                                </div>
                                                <Button size="sm" onClick={() => sendGift(friend.id)} className="rounded-xl bg-sage-green hover:bg-sage-green/90">Send</Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setFlowerToGift(null)}>Cancel</Button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}


            {/* Shop Modal */}
            {isShopOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-warm-cocoa/20 backdrop-blur-md sm:p-4 animate-in fade-in">
                    <div className="bg-white/95 hover:bg-white/95 backdrop-blur-xl rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full max-w-md shadow-2xl h-[85vh] sm:h-[600px] flex flex-col border border-white">
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
                                            <div className="w-14 h-14 bg-gradient-to-br from-stone-50 to-stone-100 rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-stone-200/50 text-3xl relative">
                                                <span className="absolute text-[10px] -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5 border border-stone-100 z-10">{FLOWER_EMOJIS[key as FlowerType]}</span>
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
                                            {selectedSlot !== null && count > 0 && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => plantSeed(key as FlowerType)}
                                                    className="rounded-xl bg-sage-green hover:bg-sage-green/90 text-white w-full shadow-md shadow-sage-green/20"
                                                >
                                                    Plant
                                                </Button>
                                            )}
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
