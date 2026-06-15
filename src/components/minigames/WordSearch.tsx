"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, CheckCircle } from "lucide-react";

// Themes & Words
const WORD_THEMES = [
    {
        name: "Fruit of the Spirit 🍎",
        words: ["LOVE", "JOY", "PEACE", "PATIENCE", "KINDNESS", "GENTLENESS"]
    },
    {
        name: "Bible Books 📖",
        words: ["GENESIS", "EXODUS", "PSALMS", "MATTHEW", "ROMANS", "HEBREWS"]
    },
    {
        name: "Grace & Faith ✨",
        words: ["GRACE", "FAITH", "PRAYER", "BLESSING", "HEAVEN", "SAVIOR"]
    }
];

const GRID_SIZE = 10;

// Directions: [dRow, dCol]
const DIRECTIONS = [
    [0, 1],   // Horizontal Right
    [1, 0],   // Vertical Down
    [1, 1],   // Diagonal Down-Right
    [0, -1],  // Horizontal Left (Backwards)
    [-1, 0],  // Vertical Up (Backwards)
];

export function WordSearch() {
    const [themeIdx, setThemeIdx] = useState(0);
    const [grid, setGrid] = useState<string[][]>([]);
    const [targetWords, setTargetWords] = useState<string[]>([]);
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [startCell, setStartCell] = useState<{ r: number; c: number } | null>(null);
    const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
    const [placedWordPaths, setPlacedWordPaths] = useState<{ [word: string]: { r: number; c: number }[] }>({});
    const [permanentHighlights, setPermanentHighlights] = useState<{ r: number; c: number; colorIdx: number }[]>([]);

    useEffect(() => {
        generateGame();
    }, [themeIdx]);

    // Generate Grid and place words
    const generateGame = () => {
        const theme = WORD_THEMES[themeIdx];
        const words = theme.words;
        setTargetWords(words);
        setFoundWords([]);
        setStartCell(null);
        setHoverCell(null);
        setPermanentHighlights([]);

        // Initialize empty grid
        let tempGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""));
        const wordPaths: { [word: string]: { r: number; c: number }[] } = {};

        // Helper to check if a word fits
        const canPlaceWord = (word: string, r: number, c: number, dr: number, dc: number) => {
            for (let i = 0; i < word.length; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
                if (tempGrid[nr][nc] !== "" && tempGrid[nr][nc] !== word[i]) return false;
            }
            return true;
        };

        // Place each word
        words.forEach(word => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 200) {
                attempts++;
                const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
                const [dr, dc] = dir;
                
                const r = Math.floor(Math.random() * GRID_SIZE);
                const c = Math.floor(Math.random() * GRID_SIZE);

                if (canPlaceWord(word, r, c, dr, dc)) {
                    const path = [];
                    for (let i = 0; i < word.length; i++) {
                        const nr = r + dr * i;
                        const nc = c + dc * i;
                        tempGrid[nr][nc] = word[i];
                        path.push({ r: nr, c: nc });
                    }
                    wordPaths[word] = path;
                    placed = true;
                }
            }
        });

        // Fill remaining empty cells with random letters
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (tempGrid[r][c] === "") {
                    tempGrid[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }

        setGrid(tempGrid);
        setPlacedWordPaths(wordPaths);
    };

    // Helper to check if cells form a straight line (H, V, or D)
    const getSelectionLine = (start: { r: number; c: number }, end: { r: number; c: number }) => {
        const dr = end.r - start.r;
        const dc = end.c - start.c;

        if (dr === 0 && dc === 0) return [start];

        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        
        // Check if diagonal is 45 degrees
        const isDiag = Math.abs(dr) === Math.abs(dc);
        const isHoriz = dr === 0;
        const isVert = dc === 0;

        if (!isDiag && !isHoriz && !isVert) return [];

        const stepR = dr === 0 ? 0 : dr / dist;
        const stepC = dc === 0 ? 0 : dc / dist;

        const cells = [];
        for (let i = 0; i <= dist; i++) {
            cells.push({
                r: start.r + Math.round(stepR * i),
                c: start.c + Math.round(stepC * i)
            });
        }
        return cells;
    };

    // Handle grid cell click
    const handleCellClick = (r: number, c: number) => {
        if (startCell === null) {
            // First cell clicked
            setStartCell({ r, c });
            setHoverCell({ r, c });
        } else {
            // Second cell clicked - finalize selection
            const selection = getSelectionLine(startCell, { r, c });
            if (selection.length > 0) {
                // Form word string from selection
                const selectedWord = selection.map(cell => grid[cell.r][cell.c]).join("");
                const selectedWordRev = [...selectedWord].reverse().join("");

                let matchedWord = "";
                if (targetWords.includes(selectedWord) && !foundWords.includes(selectedWord)) {
                    matchedWord = selectedWord;
                } else if (targetWords.includes(selectedWordRev) && !foundWords.includes(selectedWordRev)) {
                    matchedWord = selectedWordRev;
                }

                if (matchedWord !== "") {
                    // Match found!
                    setFoundWords(prev => [...prev, matchedWord]);
                    
                    // Add permanent highlight cells
                    const colorIdx = foundWords.length % 5;
                    const highlightsToAdd = selection.map(cell => ({
                        r: cell.r,
                        c: cell.c,
                        colorIdx
                    }));
                    setPermanentHighlights(prev => [...prev, ...highlightsToAdd]);
                }
            }
            
            // Clear selection states
            setStartCell(null);
            setHoverCell(null);
        }
    };

    // Calculate active selection coordinates
    const getActiveSelection = () => {
        if (!startCell || !hoverCell) return [];
        return getSelectionLine(startCell, hoverCell);
    };

    const activeSelection = getActiveSelection();

    // Pastel background colors for permanent highlights
    const HIGHLIGHT_BG_COLORS = [
        "bg-rose-200/60 border-rose-300/40 text-rose-800",
        "bg-lavender-200/60 border-lavender-300/40 text-lavender-800",
        "bg-sky-200/60 border-sky-300/40 text-sky-800",
        "bg-mint-200/60 border-mint-300/40 text-mint-800",
        "bg-apricot-200/60 border-apricot-300/40 text-apricot-800"
    ];

    const isWordSearchCompleted = targetWords.length > 0 && foundWords.length === targetWords.length;

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto w-full select-none">
            {/* Grid Area */}
            <div className="flex-1 flex flex-col items-center bg-white/40 p-6 border border-warm-grey/5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between w-full mb-6">
                    <h4 className="font-serif text-lg font-bold text-warm-cocoa">Bible Word Search</h4>
                    <Button variant="ghost" size="sm" onClick={generateGame} className="w-8 h-8 p-0 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-warm-grey" />
                    </Button>
                </div>

                {/* 10x10 Grid Board */}
                <div className="w-full max-w-[340px] aspect-square bg-stone-100/50 border border-stone-200/30 p-2.5 rounded-2xl grid grid-cols-10 grid-rows-10 gap-1 shadow-inner relative">
                    {grid.map((row, r) =>
                        row.map((letter, c) => {
                            const isStart = startCell && startCell.r === r && startCell.c === c;
                            const isSelected = activeSelection.some(cell => cell.r === r && cell.c === c);
                            
                            // Find permanent highlights
                            const permanent = permanentHighlights.find(ph => ph.r === r && ph.c === c);

                            let cellClass = "bg-white hover:bg-stone-50 border-stone-200";
                            
                            if (permanent) {
                                cellClass = HIGHLIGHT_BG_COLORS[permanent.colorIdx];
                            } else if (isStart) {
                                cellClass = "bg-soft-blush border-muted-rose ring-2 ring-muted-rose/20 z-10 scale-105";
                            } else if (isSelected) {
                                cellClass = "bg-rose-100/70 border-rose-200";
                            }

                            return (
                                <div
                                    key={`${r}-${c}`}
                                    onClick={() => handleGridCellClick(r, c)}
                                    onMouseEnter={() => startCell && setHoverCell({ r, c })}
                                    className={`w-full h-full rounded-md border flex items-center justify-center text-xs font-bold font-sans cursor-pointer transition-all duration-150 shadow-sm ${cellClass}`}
                                >
                                    {letter}
                                </div>
                            );
                        })
                    )}

                    {/* Game Complete Modal Overlay */}
                    {isWordSearchCompleted && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                            <div className="w-16 h-16 rounded-full bg-sage-green/20 flex items-center justify-center text-2xl shadow-md">🌸</div>
                            <h4 className="font-serif text-xl font-bold text-warm-cocoa">Joyfully Completed!</h4>
                            <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                                You found all the words! Choose a different theme below to continue playing.
                            </p>
                            <Button onClick={generateGame} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] active:scale-95 transition-all">
                                Refresh Grid 🔄
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Checklist Panel */}
            <div className="w-full lg:w-80 bg-white/40 border border-warm-grey/5 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left">
                {/* Theme Selector */}
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-warm-grey/40 block mb-2">Select Theme</label>
                    <div className="flex flex-col gap-1.5">
                        {WORD_THEMES.map((theme, idx) => (
                            <button
                                key={idx}
                                onClick={() => setThemeIdx(idx)}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                                    themeIdx === idx
                                        ? "bg-rose-50 border-rose-200 text-muted-rose"
                                        : "bg-white/60 hover:bg-white border-transparent text-warm-grey/70"
                                }`}
                            >
                                <span>{theme.name}</span>
                                {themeIdx === idx && <span className="text-[10px]">✨</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Word List Checklist */}
                <div>
                    <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 mb-3">
                        Words to Find ({foundWords.length}/{targetWords.length})
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                        {targetWords.map(word => {
                            const isFound = foundWords.includes(word);
                            return (
                                <div
                                    key={word}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all duration-200 ${
                                        isFound
                                            ? "bg-green-50 border-green-200 text-green-700 line-through opacity-60"
                                            : "bg-white/60 border-stone-200/40 text-warm-grey/80"
                                    }`}
                                >
                                    {isFound ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                    ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />
                                    )}
                                    <span className="truncate">{word}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
