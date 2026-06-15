"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, RefreshCw, Trash2, HelpCircle, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

type ElementId = string;

interface Element {
    name: string;
    emoji: string;
    category: "core" | "divine" | "virtues" | "history" | "concepts";
    description: string;
}

interface CanvasItem {
    id: string;
    elementId: ElementId;
    x: number;
    y: number;
}

interface NewDiscovery {
    id: ElementId;
    name: string;
    emoji: string;
    recipe: string;
    description: string;
}

export const ELEMENTS: Record<ElementId, Element> = {
    creation: { name: "Creation", emoji: "🌎", category: "core", description: "The vast universe made by God's speaking voice." },
    word: { name: "Word", emoji: "📖", category: "core", description: "The powerful voice of God and basis of all scripture." },
    grace: { name: "Grace", emoji: "🌸", category: "core", description: "God's unmerited, beautiful favor showered upon us." },
    faith: { name: "Faith", emoji: "🌿", category: "core", description: "The assurance of things hoped for, the conviction of things unseen." },
    
    light: { name: "Light", emoji: "☀️", category: "core", description: "In the beginning, God spoke: 'Let there be light.' (Genesis 1:3)" },
    eden: { name: "Eden", emoji: "🏡", category: "core", description: "The original sanctuary garden of perfect harmony and peace." },
    life: { name: "Life", emoji: "🌱", category: "core", description: "The breath of God animating physical structure." },
    humanity: { name: "Humanity", emoji: "👤", category: "core", description: "Made in the image and likeness of the loving Creator." },
    water: { name: "Water", emoji: "💧", category: "core", description: "Clean rivers of physical and spiritual refreshment." },
    choice: { name: "Choice", emoji: "🧭", category: "core", description: "The crossroad of path and human conscience." },
    freewill: { name: "Free Will", emoji: "🕊️", category: "core", description: "The moral agency to choose love, covenant, and fellowship." },
    thefall: { name: "The Fall", emoji: "🍎", category: "core", description: "The departure from Eden, setting the stage for redemption." },
    
    spirit: { name: "Spirit", emoji: "🔥", category: "divine", description: "The living fire and unseen breath of divine inspiration." },
    scripture: { name: "Scripture", emoji: "📜", category: "concepts", description: "The written testimony of God's word and history." },
    truth: { name: "Truth", emoji: "⚖️", category: "divine", description: "The unchanging, solid foundation of God's character." },
    holyspirit: { name: "Holy Spirit", emoji: "🕊️", category: "divine", description: "The Counselor and Comforter who guides us into all truth." },
    heaven: { name: "Heaven", emoji: "☁️", category: "divine", description: "The eternal dwelling place of joy and fellowship with God." },
    salvation: { name: "Salvation", emoji: "🕊️", category: "divine", description: "Deliverance from the fall and eternal restoration through faith." },
    redemption: { name: "Redemption", emoji: "👑", category: "divine", description: "Bought back and restored at a great price." },
    forgiveness: { name: "Forgiveness", emoji: "🤍", category: "divine", description: "The wiping away of transgressions and restoring of peace." },
    jesus: { name: "Jesus", emoji: "✝️", category: "divine", description: "The Word made flesh, the Savior of the world." },
    
    adam: { name: "Adam", emoji: "👨", category: "history", description: "The first man, formed from clay in the Garden of Eden." },
    eve: { name: "Eve", emoji: "👩", category: "history", description: "The mother of all living, formed to walk beside Adam." },
    noah: { name: "Noah", emoji: "🚢", category: "history", description: "A righteous man who walked with God and built the ark." },
    rainbow: { name: "Rainbow", emoji: "🌈", category: "history", description: "The physical sign of God's covenant never to flood the earth again." },
    abraham: { name: "Abraham", emoji: "👴", category: "history", description: "The father of many nations, who believed God and was counted righteous." },
    isaac: { name: "Isaac", emoji: "👦", category: "history", description: "The child of promise and covenant, born to Abraham and Sarah." },
    moses: { name: "Moses", emoji: "🧔", category: "history", description: "The prophet who led Israel out of Egypt and received the law." },
    redsea: { name: "Red Sea", emoji: "🌊", category: "history", description: "The waters parted by God to make a dry pathway for His people." },
    david: { name: "David", emoji: "👑", category: "history", description: "A shepherd boy who became king and wrote songs of praise." },
    solomon: { name: "Solomon", emoji: "👑", category: "history", description: "The wise king of Israel who built the first temple." },
    mary: { name: "Mary", emoji: "👩", category: "history", description: "A humble virgin chosen by grace to bear the Savior." },
    paul: { name: "Paul", emoji: "✉️", category: "history", description: "The apostle of grace who wrote letters of hope to the churches." },
    
    prayer: { name: "Prayer", emoji: "🙏", category: "virtues", description: "The sweet conversation of faith and devotion to God." },
    repentance: { name: "Repentance", emoji: "🙏", category: "virtues", description: "Turning away from the fall and turning toward grace." },
    love: { name: "Love", emoji: "❤️", category: "virtues", description: "The greatest virtue, choosing grace and goodwill for others." },
    peace: { name: "Peace", emoji: "🕊️", category: "virtues", description: "The tranquil rest of a heart secure in God's covenant." },
    sacrifice: { name: "Sacrifice", emoji: "🪵", category: "virtues", description: "The supreme expression of faith and love laying down its life." },
    joy: { name: "Joy", emoji: "✨", category: "virtues", description: "Deep, bubbling strength given by the Holy Spirit." },
    wisdom: { name: "Wisdom", emoji: "🦉", category: "virtues", description: "Applying scriptural truth to daily life." },
    hope: { name: "Hope", emoji: "⚓", category: "virtues", description: "An anchor for the soul, firm and secure." },
    
    worship: { name: "Worship", emoji: "🎵", category: "concepts", description: "Singing and expressing gratitude to God." },
    fellowship: { name: "Fellowship", emoji: "🤝", category: "concepts", description: "The cozy gathering of sisters in unified love." },
    covenant: { name: "Covenant", emoji: "🤝", category: "concepts", description: "God's solemn promise of grace and relationship." },
    law: { name: "Law", emoji: "📜", category: "concepts", description: "The rules of righteousness given to guide the covenant people." },
    selah: { name: "Selah", emoji: "⚓", category: "concepts", description: "A peaceful pause to reflect and praise." },
    sanctuary: { name: "Sanctuary", emoji: "⛪", category: "concepts", description: "A holy place of rest, fellowship, and divine presence." }
};

export const RECIPES: Record<string, ElementId> = {
    "creation+word": "light",
    "creation+grace": "eden",
    "eden+word": "life",
    "creation+life": "humanity",
    "creation+eden": "water",
    "grace+life": "choice",
    "choice+eden": "freewill",
    "freewill+humanity": "thefall",
    "light+word": "spirit",
    "faith+word": "scripture",
    "grace+word": "truth",
    "grace+spirit": "holyspirit",
    "light+redemption": "heaven",
    "faith+redemption": "salvation",
    "jesus+sacrifice": "redemption",
    "jesus+repentance": "forgiveness",
    "eden+humanity": "adam",
    "adam+eden": "eve",
    "humanity+water": "noah",
    "covenant+noah": "rainbow",
    "covenant+humanity": "abraham",
    "abraham+faith": "isaac",
    "humanity+law": "moses",
    "moses+water": "redsea",
    "humanity+worship": "david",
    "david+wisdom": "solomon",
    "grace+humanity": "mary",
    "mary+spirit": "jesus",
    "forgiveness+humanity": "paul",
    "faith+humanity": "prayer",
    "grace+thefall": "repentance",
    "choice+grace": "love",
    "faith+grace": "peace",
    "faith+love": "sacrifice",
    "faith+holyspirit": "joy",
    "scripture+truth": "wisdom",
    "faith+light": "hope",
    "joy+prayer": "worship",
    "humanity+love": "fellowship",
    "grace+scripture": "covenant",
    "scripture+word": "law",
    "peace+prayer": "selah",
    "fellowship+selah": "sanctuary"
};

const STARTER_ELEMENTS: ElementId[] = ["creation", "word", "grace", "faith"];

export function GraceAlchemy() {
    const [discovered, setDiscovered] = useState<ElementId[]>(STARTER_ELEMENTS);
    const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
    const [selectedTab, setSelectedTab] = useState<"all" | "core" | "divine" | "virtues" | "history" | "concepts">("all");
    const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
    const [wobbleIds, setWobbleIds] = useState<string[]>([]);
    
    // Celebrations Overlay State
    const [showCelebration, setShowCelebration] = useState(false);
    const [newDiscovery, setNewDiscovery] = useState<NewDiscovery | null>(null);
    
    // Modals
    const [showHelp, setShowHelp] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);

    // Load saved discovered elements from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("discovered_grace_elements");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length >= 4) {
                    setDiscovered(parsed);
                }
            } catch (e) {
                console.error("Error parsing saved elements", e);
            }
        }
    }, []);

    const spawnElement = (elementId: ElementId) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        // Spawn items closer to the center of the workspace
        const x = rect.width / 2 - 45 + (Math.random() - 0.5) * 40;
        const y = rect.height / 2 - 25 + (Math.random() - 0.5) * 40;

        setCanvasItems(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                elementId,
                x,
                y
            }
        ]);
    };

    const triggerConfetti = () => {
        const duration = 1500;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#E6B8B8", "#C3B091", "#8A9A5B", "#FBBF24"]
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#E6B8B8", "#C3B091", "#8A9A5B", "#FBBF24"]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const attemptMerge = (id1: string, id2: string, elId1: ElementId, elId2: ElementId) => {
        const key = [elId1, elId2].sort().join("+");
        const resultElementId = RECIPES[key];

        if (resultElementId) {
            const result = ELEMENTS[resultElementId];
            
            // Get position of average location to spawn new element
            const el1Dom = document.querySelector(`[data-id="${id1}"]`);
            const el2Dom = document.querySelector(`[data-id="${id2}"]`);
            let newX = 150;
            let newY = 150;

            if (el1Dom && el2Dom && canvasRef.current) {
                const rect1 = el1Dom.getBoundingClientRect();
                const rect2 = el2Dom.getBoundingClientRect();
                const canvasRect = canvasRef.current.getBoundingClientRect();
                newX = ((rect1.left + rect2.left) / 2) - canvasRect.left;
                newY = ((rect1.top + rect2.top) / 2) - canvasRect.top;
            }

            // Remove merged items and spawn new item
            setCanvasItems(prev => {
                const filtered = prev.filter(item => item.id !== id1 && item.id !== id2);
                return [
                    ...filtered,
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        elementId: resultElementId,
                        x: newX,
                        y: newY
                    }
                ];
            });

            setSelectedCanvasId(null);

            // Add to discovered if new
            if (!discovered.includes(resultElementId)) {
                const updatedDiscovered = [...discovered, resultElementId];
                setDiscovered(updatedDiscovered);
                localStorage.setItem("discovered_grace_elements", JSON.stringify(updatedDiscovered));
                
                // Set discovery info and open celebration card
                setNewDiscovery({
                    id: resultElementId,
                    name: result.name,
                    emoji: result.emoji,
                    recipe: `${ELEMENTS[elId1].emoji} ${ELEMENTS[elId1].name} + ${ELEMENTS[elId2].emoji} ${ELEMENTS[elId2].name}`,
                    description: result.description
                });
                setShowCelebration(true);
                triggerConfetti();
            }
        } else {
            // Failed combination - shake items
            setWobbleIds([id1, id2]);
            setSelectedCanvasId(null);
            setTimeout(() => setWobbleIds([]), 600);
        }
    };

    // Handle Framer Motion Drag End
    const handleDragEnd = (draggedId: string) => {
        const draggedDom = document.querySelector(`[data-id="${draggedId}"]`);
        if (!draggedDom) return;
        const draggedRect = draggedDom.getBoundingClientRect();

        const canvasItemsDoms = document.querySelectorAll(".canvas-item");
        let merged = false;

        canvasItemsDoms.forEach(el => {
            const otherId = el.getAttribute("data-id");
            if (otherId === draggedId || merged) return;

            const otherRect = el.getBoundingClientRect();
            
            // Check distance between centers of elements
            const center1 = {
                x: draggedRect.left + draggedRect.width / 2,
                y: draggedRect.top + draggedRect.height / 2
            };
            const center2 = {
                x: otherRect.left + otherRect.width / 2,
                y: otherRect.top + otherRect.height / 2
            };

            const distance = Math.hypot(center1.x - center2.x, center1.y - center2.y);
            if (distance < 50) {
                const elId1 = draggedDom.getAttribute("data-element-id")!;
                const elId2 = el.getAttribute("data-element-id")!;
                attemptMerge(draggedId, otherId!, elId1, elId2);
                merged = true;
            }
        });
    };

    // Tap-to-select and merge canvas items
    const handleCanvasItemClick = (id: string, elementId: ElementId) => {
        if (!selectedCanvasId) {
            setSelectedCanvasId(id);
        } else if (selectedCanvasId === id) {
            setSelectedCanvasId(null);
        } else {
            // Merge tap selection
            const otherItem = canvasItems.find(item => item.id === selectedCanvasId);
            if (otherItem) {
                attemptMerge(selectedCanvasId, id, otherItem.elementId, elementId);
            }
        }
    };

    const clearCanvas = () => {
        setCanvasItems([]);
        setSelectedCanvasId(null);
    };

    const resetGame = () => {
        setDiscovered(STARTER_ELEMENTS);
        localStorage.setItem("discovered_grace_elements", JSON.stringify(STARTER_ELEMENTS));
        setCanvasItems([]);
        setSelectedCanvasId(null);
        setShowResetConfirm(false);
    };

    // Filter elements list by selected tab
    const filteredDiscovered = discovered.filter(id => {
        const el = ELEMENTS[id];
        if (!el) return false;
        if (selectedTab === "all") return true;
        return el.category === selectedTab;
    });

    return (
        <div className="flex flex-col md:flex-row gap-6 w-full max-h-[calc(100vh-12rem)] md:h-[580px] bg-white/40 border border-warm-grey/5 p-4 rounded-3xl shadow-sm relative overflow-hidden select-none">
            
            {/* 1. ELEMENTS LIST SIDEBAR (Left / Top) */}
            <div className="w-full md:w-72 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-stone-200/50 pb-4 md:pb-0 md:pr-4 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm font-bold text-warm-cocoa flex items-center gap-1.5">
                        🏺 Grace Elements
                    </h3>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                        {discovered.length} / 47 Found
                    </span>
                </div>

                {/* Category tabs */}
                <div className="flex md:flex-wrap gap-1 overflow-x-auto pb-1 scrollbar-none text-[9px] font-semibold text-warm-grey">
                    {(["all", "core", "divine", "virtues", "history", "concepts"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-2 py-1 rounded-lg border transition-all shrink-0 capitalize ${selectedTab === tab ? "bg-amber-100 text-amber-900 border-amber-250/30" : "bg-white/60 border-stone-200/40 hover:bg-white"}`}
                        >
                            {tab === "history" ? "Bible Figures" : tab}
                        </button>
                    ))}
                </div>

                {/* Scrollable list of items */}
                <div className="flex-1 overflow-y-auto grid grid-cols-3 md:grid-cols-2 gap-2 pr-1 max-h-[140px] md:max-h-none">
                    {filteredDiscovered.map(id => {
                        const el = ELEMENTS[id];
                        return (
                            <button
                                key={id}
                                onClick={() => spawnElement(id)}
                                className="flex items-center gap-1.5 p-2 rounded-xl bg-white/95 border border-stone-100 shadow-sm transition-all hover:scale-[1.03] active:scale-95 duration-200 text-left cursor-pointer group"
                            >
                                <span className="text-base group-hover:animate-bounce">{el.emoji}</span>
                                <span className="text-[10px] font-bold text-warm-cocoa truncate">{el.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. CANVAS WORKSPACE (Right / Bottom) */}
            <div className="flex-1 flex flex-col gap-3 min-w-0 h-[280px] md:h-full relative">
                {/* Canvas Toolbar */}
                <div className="flex items-center justify-between border-b border-stone-200/20 pb-2 z-10">
                    <span className="text-[9px] text-warm-grey/50 italic">
                        Tap elements in list to spawn. Drag or tap them together to combine!
                    </span>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHelp(true)}
                            title="Help Guide"
                            className="p-1.5 rounded-lg bg-white/70 hover:bg-white border border-stone-200/40 text-warm-grey/60 hover:text-warm-grey transition-all shadow-sm"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={clearCanvas}
                            title="Clear Canvas"
                            className="p-1.5 rounded-lg bg-white/70 hover:bg-white border border-stone-200/40 text-warm-grey/60 hover:text-rose-700 transition-all shadow-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            title="Reset Progress"
                            className="p-1.5 rounded-lg bg-white/70 hover:bg-white border border-stone-200/40 text-warm-grey/60 hover:text-amber-800 transition-all shadow-sm"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Actual canvas box */}
                <div
                    ref={canvasRef}
                    id="canvas-workspace"
                    className="flex-1 bg-white/40 rounded-2xl border border-stone-200/40 relative overflow-hidden bg-[radial-gradient(#e2e2e2_1px,transparent_1px)] bg-[size:16px_16px]"
                >
                    {canvasItems.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-warm-grey/40 pointer-events-none">
                            <span className="text-2xl mb-1.5">🏺</span>
                            <h5 className="text-xs font-bold font-serif">Alchemist's Desk</h5>
                            <p className="text-[9px] max-w-xs mt-1 leading-relaxed">
                                Canvas is clean. Sprout your starting seeds from the sidebar and begin merging physical and spiritual truths.
                            </p>
                        </div>
                    )}

                    <AnimatePresence>
                        {canvasItems.map(item => {
                            const el = ELEMENTS[item.elementId];
                            const isSelected = selectedCanvasId === item.id;
                            const isWobbling = wobbleIds.includes(item.id);

                            return (
                                <motion.div
                                    key={item.id}
                                    drag
                                    dragMomentum={false}
                                    dragElastic={0}
                                    onDragEnd={() => handleDragEnd(item.id)}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                        scale: 1, 
                                        opacity: 1,
                                        x: item.x,
                                        y: item.y
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    onClick={() => handleCanvasItemClick(item.id, item.elementId)}
                                    data-id={item.id}
                                    data-element-id={item.elementId}
                                    className={`canvas-item absolute z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border cursor-grab active:cursor-grabbing shadow-sm select-none ${isSelected ? "border-amber-400 ring-2 ring-amber-100" : "border-stone-200/60"} ${isWobbling ? "animate-wobble" : ""}`}
                                    style={{ left: 0, top: 0 }}
                                >
                                    <span className="text-base pointer-events-none">{el.emoji}</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa pointer-events-none">{el.name}</span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* 3. DISCOVERY CELEBRATION MODAL OVERLAY */}
            <AnimatePresence>
                {showCelebration && newDiscovery && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-warm-cocoa/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-amber-250/20 text-center flex flex-col items-center"
                        >
                            {/* Rotating Gold Aura Ring */}
                            <div className="mb-6 relative h-28 flex items-center justify-center w-full">
                                <div className="absolute inset-0 bg-amber-100 rounded-full blur-2xl opacity-40 animate-pulse" />
                                <div className="absolute w-24 h-24 rounded-full border border-dashed border-amber-400/30 animate-spin [animation-duration:15s]" />
                                
                                <div className="w-20 h-20 bg-gradient-to-br from-white to-stone-50 rounded-full shadow-md border border-amber-100 flex items-center justify-center relative z-10 text-4xl">
                                    {newDiscovery.emoji}
                                </div>
                                <div className="absolute -top-1 -right-1 bg-sage-green text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm rotate-12 z-20 flex items-center gap-0.5">
                                    <Sparkles className="w-2 h-2" /> REVEALED
                                </div>
                            </div>

                            <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-1">New Revelation!</h2>
                            <p className="text-[10px] font-bold text-sage-green uppercase tracking-widest mb-4">
                                {newDiscovery.recipe}
                            </p>

                            <div className="bg-stone-50 rounded-2xl p-4 w-full mb-6 border border-stone-100 text-left">
                                <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-1">{newDiscovery.name}</h3>
                                <p className="text-[10px] text-warm-grey/70 leading-relaxed italic">{newDiscovery.description}</p>
                            </div>

                            <button
                                onClick={() => setShowCelebration(false)}
                                className="w-full bg-warm-cocoa text-white py-3 rounded-xl font-serif text-xs hover:bg-warm-cocoa/90 transition-transform active:scale-95 shadow-lg shadow-warm-cocoa/20"
                            >
                                Receive ౨ৎ
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 4. HELP INSTRUCTIONS MODAL */}
            <AnimatePresence>
                {showHelp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-warm-cocoa/40 backdrop-blur-sm">
                        <div
                            className="absolute inset-0"
                            onClick={() => setShowHelp(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-150 text-left"
                        >
                            <button
                                onClick={() => setShowHelp(false)}
                                className="absolute top-4 right-4 p-1.5 text-warm-grey/40 hover:text-warm-grey hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <h3 className="font-serif text-base font-bold text-warm-cocoa mb-3">Grace Alchemy Guide</h3>
                            <div className="text-[10px] text-warm-grey/70 space-y-2.5 leading-relaxed">
                                <p>
                                    Welcome to **Grace Alchemy**! Starting with only four core elements (Creation, Word, Grace, Faith), you can combine them to discover **47 elements** including virtues, covenants, and key figures of scripture.
                                </p>
                                <h5 className="font-bold text-warm-cocoa uppercase tracking-wide text-[9px]">How to play:</h5>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Click elements in the sidebar to spawn them in the workspace.</li>
                                    <li>Drag elements together to merge.</li>
                                    <li>Alternatively, tap element A then tap element B on the canvas to combine them instantly.</li>
                                    <li>Discovering a new element unlocks its theological and scriptural definition.</li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 5. RESET CONFIRMATION MODAL */}
            <AnimatePresence>
                {showResetConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden bg-warm-cocoa/40 backdrop-blur-sm">
                        <div
                            className="absolute inset-0"
                            onClick={() => setShowResetConfirm(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-150 text-center"
                        >
                            <AlertCircle className="w-8 h-8 text-rose-750 mx-auto mb-3" />
                            <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Reset your progress?</h3>
                            <p className="text-[10px] text-warm-grey/60 mb-5 leading-normal">
                                This will erase all discovered grace elements and return you back to the four starters. This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-bold text-warm-grey/80 hover:bg-stone-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-750"
                                >
                                    Yes, Reset
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
