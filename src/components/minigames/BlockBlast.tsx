"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Star, Info } from "lucide-react";

// Pastel colors for blocks
const BLOCK_COLORS = [
    "bg-rose-200/90 border-rose-300",
    "bg-lavender-200/90 border-lavender-300",
    "bg-sky-200/90 border-sky-300",
    "bg-mint-200/90 border-mint-300",
    "bg-apricot-200/90 border-apricot-300",
];

// Encasing words for clears
const CHRISTIAN_WORDS = ["Grace!", "Faith!", "Mercy!", "Peace!", "Love!", "Joy!", "Hope!", "Amen!", "Glory!", "Praise!"];

// Define puzzle shapes. Coordinates are relative to the top-left of the shape.
const SHAPE_TEMPLATES = [
    { name: "1x1", coords: [[0, 0]] },
    { name: "1x2 H", coords: [[0, 0], [0, 1]] },
    { name: "1x2 V", coords: [[0, 0], [1, 0]] },
    { name: "1x3 H", coords: [[0, 0], [0, 1], [0, 2]] },
    { name: "1x3 V", coords: [[0, 0], [1, 0], [2, 0]] },
    { name: "2x2 Sq", coords: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    { name: "L-Right", coords: [[0, 0], [1, 0], [2, 0], [2, 1]] },
    { name: "L-Left", coords: [[0, 0], [1, 0], [2, 0], [2, -1]] },
    { name: "Corner", coords: [[0, 0], [0, 1], [1, 0]] },
];

export function BlockBlast() {
    const [grid, setGrid] = useState<(number | null)[][]>(
        Array(8).fill(null).map(() => Array(8).fill(null))
    );
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [availableShapes, setAvailableShapes] = useState<any[]>([]);
    const [selectedShapeIdx, setSelectedShapeIdx] = useState<number | null>(null);
    const [hoverPos, setHoverPos] = useState<{ r: number; c: number } | null>(null);
    const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; r: number; c: number }[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const textIdCounter = useRef(0);

    // Load High Score
    useEffect(() => {
        const saved = localStorage.getItem("blockblast_highscore");
        if (saved) {
            setHighScore(parseInt(saved, 10));
        }
        spawnShapes();
    }, []);

    // Save High Score
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("blockblast_highscore", score.toString());
        }
    }, [score, highScore]);

    // Spawn 3 random shapes
    const spawnShapes = () => {
        const spawned = Array(3).fill(null).map(() => {
            const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
            const colorIdx = Math.floor(Math.random() * BLOCK_COLORS.length);
            return {
                ...template,
                colorIdx,
                placed: false,
            };
        });
        setAvailableShapes(spawned);
        setSelectedShapeIdx(null);
    };

    // Reset Game
    const resetGame = () => {
        setGrid(Array(8).fill(null).map(() => Array(8).fill(null)));
        setScore(0);
        setGameOver(false);
        spawnShapes();
    };

    // Helper to check if a shape fits at grid coordinates (r, c)
    const canPlaceShape = (shapeCoords: number[][], r: number, c: number, currentGrid: (number | null)[][]) => {
        for (const [dr, dc] of shapeCoords) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) return false;
            if (currentGrid[nr][nc] !== null) return false;
        }
        return true;
    };

    // Check if any available shapes can still be placed in the current grid
    const checkGameOverState = (shapes: any[], currentGrid: (number | null)[][]) => {
        const activeShapes = shapes.filter(s => !s.placed);
        if (activeShapes.length === 0) return false; // Will spawn new ones

        for (const shape of activeShapes) {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (canPlaceShape(shape.coords, r, c, currentGrid)) {
                        return false; // Fits somewhere!
                    }
                }
            }
        }
        return true; // No active shapes can fit anywhere!
    };

    // Handle grid square click
    const handleGridCellClick = (r: number, c: number) => {
        if (selectedShapeIdx === null || gameOver) return;
        const shape = availableShapes[selectedShapeIdx];
        if (!shape || shape.placed) return;

        if (canPlaceShape(shape.coords, r, c, grid)) {
            // Place blocks
            const newGrid = grid.map(row => [...row]);
            for (const [dr, dc] of shape.coords) {
                newGrid[r + dr][c + dc] = shape.colorIdx;
            }

            // Mark shape as placed
            const newShapes = [...availableShapes];
            newShapes[selectedShapeIdx] = { ...shape, placed: true };
            setAvailableShapes(newShapes);
            setSelectedShapeIdx(null);
            setHoverPos(null);

            // Calculate score for blocks placed
            let turnScore = shape.coords.length;

            // Check for completed rows and columns
            const rowsToClear: number[] = [];
            const colsToClear: number[] = [];

            // Check rows
            for (let i = 0; i < 8; i++) {
                if (newGrid[i].every(cell => cell !== null)) {
                    rowsToClear.push(i);
                }
            }

            // Check columns
            for (let j = 0; j < 8; j++) {
                let colFull = true;
                for (let i = 0; i < 8; i++) {
                    if (newGrid[i][j] === null) {
                        colFull = false;
                        break;
                    }
                }
                if (colFull) {
                    colsToClear.push(j);
                }
            }

            // Clear rows and columns
            if (rowsToClear.length > 0 || colsToClear.length > 0) {
                const clearCount = rowsToClear.length + colsToClear.length;
                turnScore += clearCount * 10;

                // Clear cells
                rowsToClear.forEach(rowIdx => {
                    newGrid[rowIdx] = Array(8).fill(null);
                });
                colsToClear.forEach(colIdx => {
                    for (let i = 0; i < 8; i++) {
                        newGrid[i][colIdx] = null;
                    }
                });

                // Trigger floating texts for completed lines
                const randomWord = CHRISTIAN_WORDS[Math.floor(Math.random() * CHRISTIAN_WORDS.length)];
                textIdCounter.current += 1;
                const newText = {
                    id: textIdCounter.current,
                    text: randomWord,
                    r: rowsToClear.length > 0 ? rowsToClear[0] : 3,
                    c: colsToClear.length > 0 ? colsToClear[0] : 3,
                };
                setFloatingTexts(prev => [...prev, newText]);

                // Cleanup floating text after 1.2s
                setTimeout(() => {
                    setFloatingTexts(prev => prev.filter(t => t.id !== newText.id));
                }, 1200);
            }

            setGrid(newGrid);
            setScore(prev => prev + turnScore);

            // Determine if all shapes placed. If yes, spawn next set.
            const allPlaced = newShapes.every(s => s.placed);
            if (allPlaced) {
                const nextShapes = Array(3).fill(null).map(() => {
                    const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
                    const colorIdx = Math.floor(Math.random() * BLOCK_COLORS.length);
                    return {
                        ...template,
                        colorIdx,
                        placed: false,
                    };
                });
                setAvailableShapes(nextShapes);
                if (checkGameOverState(nextShapes, newGrid)) {
                    setGameOver(true);
                }
            } else {
                if (checkGameOverState(newShapes, newGrid)) {
                    setGameOver(true);
                }
            }
        }
    };

    // Calculate cells that should light up for placement preview
    const getPreviewCells = () => {
        if (selectedShapeIdx === null || hoverPos === null) return [];
        const shape = availableShapes[selectedShapeIdx];
        if (!shape || shape.placed) return [];

        const cells = [];
        const { r, c } = hoverPos;
        const fits = canPlaceShape(shape.coords, r, c, grid);

        for (const [dr, dc] of shape.coords) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                cells.push({ r: nr, c: nc, fits });
            }
        }
        return cells;
    };

    const previewCells = getPreviewCells();

    return (
        <div className="flex flex-col items-center max-w-lg mx-auto w-full select-none">
            {/* Header / Scores */}
            <div className="w-full flex items-center justify-between bg-white/40 border border-warm-grey/5 p-4 rounded-2xl mb-6 shadow-sm">
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/40">Score</span>
                    <span className="text-2xl font-serif text-warm-cocoa font-bold">{score}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xl font-serif font-bold text-muted-rose">౨ৎ Block Blast ౨ৎ</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/40 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Best
                        </span>
                        <span className="text-lg font-serif text-warm-grey/80 font-bold">{highScore}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetGame} className="w-9 h-9 p-0 rounded-full bg-white/60 hover:bg-white shadow-sm flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-warm-grey" />
                    </Button>
                </div>
            </div>

            {/* Instruction Banner */}
            <div className="flex items-center gap-2 text-[10px] text-warm-grey/50 bg-stone-100/40 px-3 py-1.5 rounded-full mb-4 border border-stone-200/20 shadow-inner">
                <Info className="w-3.5 h-3.5" />
                <span>Select a shape below, then click a grid square to place it! Clear lines to earn points.</span>
            </div>

            {/* Grid Container */}
            <div className="relative w-full aspect-square bg-stone-100/60 rounded-3xl p-3 border border-stone-200/30 shadow-inner mb-6">
                <div className="w-full h-full grid grid-cols-8 gap-1.5">
                    {grid.map((row, r) =>
                        row.map((cellColorIdx, c) => {
                            // Determine if this cell is highlighted in preview
                            const preview = previewCells.find(pc => pc.r === r && pc.c === c);
                            const isFilled = cellColorIdx !== null;
                            
                            let cellClass = "bg-white/50 border border-stone-200/20";
                            if (isFilled) {
                                cellClass = BLOCK_COLORS[cellColorIdx!];
                            } else if (preview) {
                                cellClass = preview.fits
                                    ? "bg-sage-green/40 border border-sage-green/60 animate-pulse"
                                    : "bg-red-200/40 border border-red-300";
                            }

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => handleGridCellClick(r, c)}
                                    onMouseEnter={() => setHoverPos({ r, c })}
                                    onMouseLeave={() => setHoverPos(null)}
                                    className={`w-full h-full rounded-lg border-b-2 shadow-sm transition-all duration-150 cursor-pointer ${cellClass}`}
                                />
                            );
                        })
                    )}
                </div>

                {/* Floating Clear Texts */}
                {floatingTexts.map(t => (
                    <div
                        key={t.id}
                        style={{
                            left: `${(t.c / 8) * 100 + 5}%`,
                            top: `${(t.r / 8) * 100 - 5}%`,
                        }}
                        className="absolute text-sm font-serif font-bold text-muted-rose bg-white/90 border border-pink-100 px-2.5 py-1 rounded-full shadow-md pointer-events-none animate-float-fade-out z-10"
                    >
                        ✨ {t.text} ✨
                    </div>
                ))}

                {/* Game Over Screen */}
                {gameOver && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                        <div className="w-16 h-16 rounded-full bg-soft-blush flex items-center justify-center text-2xl shadow-md">🕊️</div>
                        <h4 className="font-serif text-xl font-bold text-warm-cocoa">Joyful Effort!</h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                            No more moves fit. Keep a cheerful heart and try again!
                        </p>
                        <div className="text-sm font-serif font-bold text-warm-grey mb-2">Final Score: {score}</div>
                        <Button onClick={resetGame} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] active:scale-95 transition-all">
                            Play Again 🌸
                        </Button>
                    </div>
                )}
            </div>

            {/* Available Shapes Drawer */}
            <div className="w-full grid grid-cols-3 gap-4 bg-white/40 p-4 border border-warm-grey/5 rounded-3xl shadow-sm">
                {availableShapes.map((shape, idx) => {
                    if (shape.placed) {
                        return (
                            <div key={idx} className="aspect-square flex items-center justify-center bg-stone-50/40 rounded-2xl border border-dashed border-stone-200/30">
                                <span className="text-xl">🕊️</span>
                            </div>
                        );
                    }

                    const isSelected = selectedShapeIdx === idx;

                    // Calculate grid bounds to center the preview of the shape
                    const rs = shape.coords.map(([r, _]: any) => r);
                    const cs = shape.coords.map(([_, c]: any) => c);
                    const minR = Math.min(...rs);
                    const maxR = Math.max(...rs);
                    const minC = Math.min(...cs);
                    const maxC = Math.max(...cs);

                    const rows = maxR - minR + 1;
                    const cols = maxC - minC + 1;

                    return (
                        <div
                            key={idx}
                            onClick={() => setSelectedShapeIdx(isSelected ? null : idx)}
                            className={`aspect-square flex items-center justify-center p-3 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none active-press-shrink ${
                                isSelected
                                    ? "bg-soft-blush/40 border-muted-rose shadow-md scale-105"
                                    : "bg-white/60 hover:bg-white border-transparent hover:border-warm-grey/10 shadow-sm"
                            }`}
                        >
                            {/* Render shape grid representation */}
                            <div 
                                className="grid gap-1"
                                style={{
                                    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                    width: `${cols * 18}px`,
                                    height: `${rows * 18}px`,
                                }}
                            >
                                {Array(rows).fill(null).map((_, rIdx) =>
                                    Array(cols).fill(null).map((_, cIdx) => {
                                        const rOffset = minR + rIdx;
                                        const cOffset = minC + cIdx;
                                        const isPart = shape.coords.some(([r, c]: any) => r === rOffset && c === cOffset);
                                        
                                        return (
                                            <div
                                                key={`${rIdx}-${cIdx}`}
                                                className={`w-full h-full rounded-md ${
                                                    isPart 
                                                        ? `${BLOCK_COLORS[shape.colorIdx]} border border-white/50 shadow-inner` 
                                                        : "bg-transparent border border-transparent"
                                                }`}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
