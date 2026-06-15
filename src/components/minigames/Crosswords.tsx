"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Check, HelpCircle, RefreshCw } from "lucide-react";

// Crossword Grid Data
// 8x8 Grid
const GRID_SIZE = 8;

const CROSSWORD_CELLS = [
    // 1 Across: FAITH (Row 2, Cols 2 to 6)
    { r: 2, c: 2, letter: "F", num: 1, acrossId: 1, downId: null },
    { r: 2, c: 3, letter: "A", num: null, acrossId: 1, downId: 2 }, // Intersects ANGEL
    { r: 2, c: 4, letter: "I", num: null, acrossId: 1, downId: null },
    { r: 2, c: 5, letter: "T", num: null, acrossId: 1, downId: null },
    { r: 2, c: 6, letter: "H", num: null, acrossId: 1, downId: 3 }, // Intersects HEAVEN

    // 2 Down: ANGEL (Col 3, Rows 1 to 5)
    { r: 1, c: 3, letter: "N", num: 2, acrossId: null, downId: 2 },
    // (2,3) is 'A' (defined above)
    { r: 3, c: 3, letter: "G", num: null, acrossId: null, downId: 2 },
    { r: 4, c: 3, letter: "E", num: null, acrossId: null, downId: 2 },
    { r: 5, c: 3, letter: "L", num: null, acrossId: 4, downId: 2 }, // Intersects BIBLE (starts 4 Across)

    // 3 Down: HEAVEN (Col 6, Rows 2 to 7)
    // (2,6) is 'H' (defined above)
    { r: 3, c: 6, letter: "E", num: null, acrossId: null, downId: 3 },
    { r: 4, c: 6, letter: "A", num: null, acrossId: null, downId: 3 },
    { r: 5, c: 6, letter: "V", num: null, acrossId: null, downId: 3 },
    { r: 6, c: 6, letter: "E", num: null, acrossId: null, downId: 3 },
    { r: 7, c: 6, letter: "N", num: null, acrossId: null, downId: 3 },

    // 4 Across: BIBLE (Row 5, Cols 0 to 4)
    { r: 5, c: 0, letter: "B", num: 4, acrossId: 4, downId: null },
    { r: 5, c: 1, letter: "I", num: null, acrossId: 4, downId: null },
    { r: 5, c: 2, letter: "B", num: null, acrossId: 4, downId: null },
    // (5,3) is 'L' (defined above)
    { r: 5, c: 4, letter: "E", num: null, acrossId: 4, downId: null }
];

const CLUES = {
    across: [
        { id: 1, num: 1, text: "Complete trust or confidence in God.", answer: "FAITH" },
        { id: 4, num: 4, text: "The holy scriptures of Christianity.", answer: "BIBLE" }
    ],
    down: [
        { id: 2, num: 2, text: "A spiritual messenger of God.", answer: "ANGEL" },
        { id: 3, num: 3, text: "The dwelling place of God and angels.", answer: "HEAVEN" }
    ]
};

export function Crosswords() {
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [checked, setChecked] = useState(false);
    const [revealCount, setRevealCount] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [direction, setDirection] = useState<"across" | "down">("across");

    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Reset grid
    const handleReset = () => {
        setUserAnswers({});
        setChecked(false);
        setRevealCount(0);
        setSelectedCell(null);
    };

    // Cell key index helper
    const getCellKey = (r: number, c: number) => `${r}-${c}`;

    // Handle letter inputs
    const handleInputChange = (r: number, c: number, val: string) => {
        const char = val.slice(-1).toUpperCase();
        const key = getCellKey(r, c);
        
        setUserAnswers(prev => ({
            ...prev,
            [key]: char
        }));

        if (char !== "") {
            // Find next cell in the active direction
            moveToNextCell(r, c);
        }
    };

    // Auto-advance focus
    const moveToNextCell = (r: number, c: number) => {
        const activeCell = CROSSWORD_CELLS.find(cell => cell.r === r && cell.c === c);
        if (!activeCell) return;

        let nextCell;
        if (direction === "across") {
            const rowCells = CROSSWORD_CELLS.filter(cell => cell.r === r && cell.acrossId === activeCell.acrossId).sort((a, b) => a.c - b.c);
            const curIdx = rowCells.findIndex(cell => cell.c === c);
            nextCell = rowCells[curIdx + 1];
        } else {
            const colCells = CROSSWORD_CELLS.filter(cell => cell.c === c && cell.downId === activeCell.downId).sort((a, b) => a.r - b.r);
            const curIdx = colCells.findIndex(cell => cell.r === r);
            nextCell = colCells[curIdx + 1];
        }

        if (nextCell) {
            const nextKey = getCellKey(nextCell.r, nextCell.c);
            inputRefs.current[nextKey]?.focus();
            setSelectedCell({ r: nextCell.r, c: nextCell.c });
        }
    };

    // Handle backspace navigation
    const handleKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            const key = getCellKey(r, c);
            if (!userAnswers[key]) {
                // Navigate backwards
                moveToPrevCell(r, c);
            }
        }
    };

    const moveToPrevCell = (r: number, c: number) => {
        const activeCell = CROSSWORD_CELLS.find(cell => cell.r === r && cell.c === c);
        if (!activeCell) return;

        let prevCell;
        if (direction === "across") {
            const rowCells = CROSSWORD_CELLS.filter(cell => cell.r === r && cell.acrossId === activeCell.acrossId).sort((a, b) => a.c - b.c);
            const curIdx = rowCells.findIndex(cell => cell.c === c);
            prevCell = rowCells[curIdx - 1];
        } else {
            const colCells = CROSSWORD_CELLS.filter(cell => cell.c === c && cell.downId === activeCell.downId).sort((a, b) => a.r - b.r);
            const curIdx = colCells.findIndex(cell => cell.r === r);
            prevCell = colCells[curIdx - 1];
        }

        if (prevCell) {
            const prevKey = getCellKey(prevCell.r, prevCell.c);
            inputRefs.current[prevKey]?.focus();
            setSelectedCell({ r: prevCell.r, c: prevCell.c });
        }
    };

    // Toggle direction when clicking an already selected cell
    const handleCellClick = (r: number, c: number) => {
        if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
            setDirection(prev => (prev === "across" ? "down" : "across"));
        } else {
            setSelectedCell({ r, c });
            // Default direction based on what clues this cell belongs to
            const cell = CROSSWORD_CELLS.find(cc => cc.r === r && cc.c === c);
            if (cell) {
                if (direction === "across" && cell.acrossId === null && cell.downId !== null) {
                    setDirection("down");
                } else if (direction === "down" && cell.downId === null && cell.acrossId !== null) {
                    setDirection("across");
                }
            }
        }
    };

    // Check Answers
    const handleCheck = () => {
        setChecked(true);
    };

    // Reveal Letter
    const handleRevealLetter = () => {
        if (!selectedCell) return;
        const cell = CROSSWORD_CELLS.find(c => c.r === selectedCell.r && c.c === selectedCell.c);
        if (!cell) return;

        const key = getCellKey(selectedCell.r, selectedCell.c);
        setUserAnswers(prev => ({
            ...prev,
            [key]: cell.letter
        }));
        setRevealCount(prev => prev + 1);
    };

    // Check if the current cell is part of the highlighted clue line
    const isCellHighlighted = (r: number, c: number) => {
        if (!selectedCell) return false;
        const activeCell = CROSSWORD_CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c);
        if (!activeCell) return false;

        const currentCell = CROSSWORD_CELLS.find(cc => cc.r === r && cc.c === c);
        if (!currentCell) return false;

        if (direction === "across" && activeCell.acrossId !== null) {
            return currentCell.acrossId === activeCell.acrossId;
        } else if (direction === "down" && activeCell.downId !== null) {
            return currentCell.downId === activeCell.downId;
        }
        return false;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto w-full select-none">
            {/* Grid Area */}
            <div className="flex-1 flex flex-col items-center bg-white/40 p-6 border border-warm-grey/5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between w-full mb-6">
                    <h4 className="font-serif text-lg font-bold text-warm-cocoa">Bible Crossword</h4>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="w-8 h-8 p-0 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-warm-grey" />
                        </Button>
                    </div>
                </div>

                {/* 8x8 Grid board */}
                <div className="w-full max-w-[340px] aspect-square bg-stone-100/50 border border-stone-200/30 p-2.5 rounded-2xl grid grid-cols-8 grid-rows-8 gap-1 shadow-inner relative">
                    {Array(GRID_SIZE).fill(null).map((_, r) =>
                        Array(GRID_SIZE).fill(null).map((_, c) => {
                            const cell = CROSSWORD_CELLS.find(cc => cc.r === r && cc.c === c);
                            const key = getCellKey(r, c);

                            if (!cell) {
                                return (
                                    <div 
                                        key={`empty-${r}-${c}`} 
                                        className="w-full h-full bg-stone-200/40 rounded-md border border-transparent" 
                                    />
                                );
                            }

                            const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                            const isHighlighted = isCellHighlighted(r, c);
                            const val = userAnswers[key] || "";
                            const isCorrect = val === cell.letter;

                            let bgClass = "bg-white border-stone-200";
                            if (isSelected) {
                                bgClass = "bg-soft-blush border-muted-rose ring-2 ring-muted-rose/20 z-10 scale-105";
                            } else if (isHighlighted) {
                                bgClass = "bg-rose-50/70 border-rose-200";
                            }

                            let textClass = "text-warm-grey";
                            if (checked && val !== "") {
                                bgClass = isCorrect ? "bg-green-100/80 border-green-300" : "bg-red-100/80 border-red-300";
                                textClass = isCorrect ? "text-green-700 font-bold" : "text-red-700 font-bold";
                            }

                            return (
                                <div 
                                    key={key} 
                                    onClick={() => handleCellClick(r, c)}
                                    className={`w-full h-full relative rounded-md border transition-all duration-200 shadow-sm flex items-center justify-center ${bgClass}`}
                                >
                                    {/* Number label */}
                                    {cell.num && (
                                        <span className="absolute top-0.5 left-1 text-[8px] font-bold text-warm-grey/40 leading-none">
                                            {cell.num}
                                        </span>
                                    )}
                                    <input
                                        ref={el => { inputRefs.current[key] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={val}
                                        onChange={(e) => handleInputChange(r, c, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(r, c, e)}
                                        className={`w-full h-full bg-transparent text-center text-sm font-bold uppercase outline-none ${textClass}`}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Helper buttons */}
                <div className="flex gap-3 mt-6 w-full max-w-[340px]">
                    <Button 
                        onClick={handleRevealLetter} 
                        disabled={!selectedCell}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-warm-cocoa font-bold text-xs py-2 rounded-xl border border-stone-200/50 flex items-center justify-center gap-1.5 active-press-shrink"
                    >
                        <HelpCircle className="w-4 h-4 text-warm-grey/60" /> Reveal Letter
                    </Button>
                    <Button 
                        onClick={handleCheck}
                        className="flex-1 bg-warm-cocoa hover:bg-warm-cocoa/90 text-white font-bold text-xs py-2 rounded-xl shadow-md flex items-center justify-center gap-1.5 active-press-shrink"
                    >
                        <Check className="w-4 h-4" /> Check Answers
                    </Button>
                </div>
            </div>

            {/* Clues Area */}
            <div className="w-full lg:w-80 bg-white/40 border border-warm-grey/5 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left">
                {/* Across Clues */}
                <div>
                    <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 mb-3 flex items-center gap-1.5">
                        <span className="text-muted-rose">👉</span> Across
                    </h5>
                    <div className="space-y-3">
                        {CLUES.across.map(clue => {
                            const isAct = selectedCell && direction === "across" && 
                                          CROSSWORD_CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c)?.acrossId === clue.id;
                            
                            return (
                                <div 
                                    key={clue.id}
                                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                                        isAct ? "bg-rose-50 border border-rose-100 shadow-sm" : "hover:bg-stone-50/40 border border-transparent"
                                    }`}
                                >
                                    <div className="text-xs font-bold text-warm-grey/80">
                                        {clue.num}. <span className="font-normal text-warm-grey">{clue.text}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Down Clues */}
                <div>
                    <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 mb-3 flex items-center gap-1.5">
                        <span className="text-muted-rose">👇</span> Down
                    </h5>
                    <div className="space-y-3">
                        {CLUES.down.map(clue => {
                            const isAct = selectedCell && direction === "down" && 
                                          CROSSWORD_CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c)?.downId === clue.id;
                            
                            return (
                                <div 
                                    key={clue.id}
                                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                                        isAct ? "bg-rose-50 border border-rose-100 shadow-sm" : "hover:bg-stone-50/40 border border-transparent"
                                    }`}
                                >
                                    <div className="text-xs font-bold text-warm-grey/80">
                                        {clue.num}. <span className="font-normal text-warm-grey">{clue.text}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
