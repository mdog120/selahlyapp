"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Check, HelpCircle, RefreshCw } from "lucide-react";

// Crossword Levels Configurations
const CROSSWORD_LEVELS = {
    easy: {
        gridSize: 8,
        cells: [
            // 1 Across: HOPE (Row 1, Cols 1 to 4)
            { r: 1, c: 1, letter: "H", num: 1, acrossId: 1, downId: 1 }, // Intersects HEAVEN
            { r: 1, c: 2, letter: "O", num: null, acrossId: 1, downId: null },
            { r: 1, c: 3, letter: "P", num: null, acrossId: 1, downId: null },
            { r: 1, c: 4, letter: "E", num: null, acrossId: 1, downId: null },

            // 1 Down: HEAVEN (Col 1, Rows 1 to 6)
            // (1,1) is 'H'
            { r: 2, c: 1, letter: "E", num: null, acrossId: null, downId: 1 },
            { r: 3, c: 1, letter: "A", num: 2, acrossId: 2, downId: 1 }, // Intersects ANGEL
            { r: 4, c: 1, letter: "V", num: null, acrossId: null, downId: 1 },
            { r: 5, c: 1, letter: "E", num: null, acrossId: null, downId: 1 },
            { r: 6, c: 1, letter: "N", num: null, acrossId: null, downId: 1 },

            // 2 Across: ANGEL (Row 3, Cols 1 to 5)
            // (3,1) is 'A'
            { r: 3, c: 2, letter: "N", num: null, acrossId: 2, downId: null },
            { r: 3, c: 3, letter: "G", num: 3, acrossId: 2, downId: 2 }, // Intersects GRACE
            { r: 3, c: 4, letter: "E", num: null, acrossId: 2, downId: null },
            { r: 3, c: 5, letter: "L", num: null, acrossId: 2, downId: null },

            // 2 Down: GRACE (Col 3, Rows 3 to 7)
            // (3,3) is 'G'
            { r: 4, c: 3, letter: "R", num: null, acrossId: null, downId: 2 },
            { r: 5, c: 3, letter: "A", num: null, acrossId: null, downId: 2 },
            { r: 6, c: 3, letter: "C", num: null, acrossId: null, downId: 2 },
            { r: 7, c: 3, letter: "E", num: null, acrossId: null, downId: 2 }
        ],
        clues: {
            across: [
                { id: 1, num: 1, text: "A joyful expectation of eternal salvation.", answer: "HOPE" },
                { id: 2, num: 2, text: "A spiritual messenger of God.", answer: "ANGEL" }
            ],
            down: [
                { id: 1, num: 1, text: "The dwelling place of God and angels.", answer: "HEAVEN" },
                { id: 2, num: 3, text: "God's unmerited favor toward us.", answer: "GRACE" }
            ]
        }
    },
    medium: {
        gridSize: 8,
        cells: [
            // 1 Across: FAITH (Row 2, Cols 2 to 6)
            { r: 2, c: 2, letter: "F", num: 1, acrossId: 1, downId: null },
            { r: 2, c: 3, letter: "A", num: null, acrossId: 1, downId: 2 }, // Intersects ANGEL
            { r: 2, c: 4, letter: "I", num: null, acrossId: 1, downId: null },
            { r: 2, c: 5, letter: "T", num: null, acrossId: 1, downId: null },
            { r: 2, c: 6, letter: "H", num: null, acrossId: 1, downId: 3 }, // Intersects HEAVEN

            // 2 Down: ANGEL (Col 3, Rows 1 to 5)
            { r: 1, c: 3, letter: "N", num: 2, acrossId: null, downId: 2 },
            // (2,3) is 'A'
            { r: 3, c: 3, letter: "G", num: null, acrossId: null, downId: 2 },
            { r: 4, c: 3, letter: "E", num: null, acrossId: null, downId: 2 },
            { r: 5, c: 3, letter: "L", num: null, acrossId: 4, downId: 2 }, // Intersects BIBLE

            // 3 Down: HEAVEN (Col 6, Rows 2 to 7)
            // (2,6) is 'H'
            { r: 3, c: 6, letter: "E", num: 3, acrossId: null, downId: 3 },
            { r: 4, c: 6, letter: "A", num: null, acrossId: null, downId: 3 },
            { r: 5, c: 6, letter: "V", num: null, acrossId: null, downId: 3 },
            { r: 6, c: 6, letter: "E", num: null, acrossId: null, downId: 3 },
            { r: 7, c: 6, letter: "N", num: null, acrossId: null, downId: 3 },

            // 4 Across: BIBLE (Row 5, Cols 0 to 4)
            { r: 5, c: 0, letter: "B", num: 4, acrossId: 4, downId: null },
            { r: 5, c: 1, letter: "I", num: null, acrossId: 4, downId: null },
            { r: 5, c: 2, letter: "B", num: null, acrossId: 4, downId: null },
            // (5,3) is 'L'
            { r: 5, c: 4, letter: "E", num: null, acrossId: 4, downId: null }
        ],
        clues: {
            across: [
                { id: 1, num: 1, text: "Complete trust or confidence in God.", answer: "FAITH" },
                { id: 4, num: 4, text: "The holy scriptures of Christianity.", answer: "BIBLE" }
            ],
            down: [
                { id: 2, num: 2, text: "A spiritual messenger of God.", answer: "ANGEL" },
                { id: 3, num: 3, text: "The dwelling place of God and angels.", answer: "HEAVEN" }
            ]
        }
    },
    hard: {
        gridSize: 10,
        cells: [
            // 1 Down: SACRIFICE (Col 1, Rows 1 to 9)
            { r: 1, c: 1, letter: "S", num: 1, acrossId: null, downId: 1 },
            { r: 2, c: 1, letter: "A", num: 2, acrossId: 1, downId: 1 }, // Intersects SALVATION
            { r: 3, c: 1, letter: "C", num: null, acrossId: null, downId: 1 },
            { r: 4, c: 1, letter: "R", num: null, acrossId: null, downId: 1 },
            { r: 5, c: 1, letter: "I", num: null, acrossId: 2, downId: 1 }, // Intersects BIBLICAL
            { r: 6, c: 1, letter: "F", num: null, acrossId: null, downId: 1 },
            { r: 7, c: 1, letter: "I", num: null, acrossId: null, downId: 1 },
            { r: 8, c: 1, letter: "C", num: null, acrossId: null, downId: 1 },
            { r: 9, c: 1, letter: "E", num: null, acrossId: null, downId: 1 },

            // 2 Across: SALVATION (Row 2, Cols 0 to 8)
            { r: 2, c: 0, letter: "S", num: 2, acrossId: 1, downId: null },
            // (2,1) is 'A' (SACRIFICE)
            { r: 2, c: 2, letter: "L", num: null, acrossId: 1, downId: null },
            { r: 2, c: 3, letter: "V", num: null, acrossId: 1, downId: null },
            { r: 2, c: 4, letter: "A", num: 3, acrossId: 1, downId: 2 }, // Intersects PRACTICE
            { r: 2, c: 5, letter: "T", num: null, acrossId: 1, downId: null },
            { r: 2, c: 6, letter: "I", num: null, acrossId: 1, downId: null },
            { r: 2, c: 7, letter: "O", num: null, acrossId: 1, downId: null },
            { r: 2, c: 8, letter: "N", num: null, acrossId: 1, downId: null },

            // 3 Down: PRACTICE (Col 4, Rows 0 to 7)
            { r: 0, c: 4, letter: "P", num: 3, acrossId: null, downId: 2 },
            { r: 1, c: 4, letter: "R", num: null, acrossId: null, downId: 2 },
            // (2,4) is 'A' (SALVATION)
            { r: 3, c: 4, letter: "C", num: null, acrossId: null, downId: 2 },
            { r: 4, c: 4, letter: "T", num: null, acrossId: null, downId: 2 },
            { r: 5, c: 4, letter: "I", num: null, acrossId: 2, downId: 2 }, // Intersects BIBLICAL
            { r: 6, c: 4, letter: "C", num: null, acrossId: null, downId: 2 },
            { r: 7, c: 4, letter: "E", num: null, acrossId: null, downId: 2 },

            // 4 Across: BIBLICAL (Row 5, Cols 0 to 7)
            { r: 5, c: 0, letter: "B", num: 4, acrossId: 2, downId: null },
            // (5,1) is 'I' (SACRIFICE)
            { r: 5, c: 2, letter: "B", num: null, acrossId: 2, downId: null },
            { r: 5, c: 3, letter: "L", num: null, acrossId: 2, downId: null },
            // (5,4) is 'I' (PRACTICE)
            { r: 5, c: 5, letter: "C", num: null, acrossId: 2, downId: null },
            { r: 5, c: 6, letter: "A", num: null, acrossId: 2, downId: null },
            { r: 5, c: 7, letter: "L", num: null, acrossId: 2, downId: null }
        ],
        clues: {
            across: [
                { id: 1, num: 2, text: "Deliverance from sin and its consequences, believed by Christians to be brought about by faith in Christ.", answer: "SALVATION" },
                { id: 2, num: 4, text: "Strictly according to the scriptures; e.g. a warm ___ truth.", answer: "BIBLICAL" }
            ],
            down: [
                { id: 1, num: 1, text: "An offering to God; Jesus' ultimate act on the cross.", answer: "SACRIFICE" },
                { id: 2, num: 3, text: "The actual application or use of an idea, belief, or method.", answer: "PRACTICE" }
            ]
        }
    }
};

export function Crosswords() {
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [checked, setChecked] = useState(false);
    const [revealCount, setRevealCount] = useState(0);
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [direction, setDirection] = useState<"across" | "down">("across");

    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const activeLevel = CROSSWORD_LEVELS[difficulty];
    const GRID_SIZE = activeLevel.gridSize;
    const CELLS = activeLevel.cells;
    const CLUES = activeLevel.clues;

    // Reset grid when difficulty changes or manually reset
    useEffect(() => {
        handleReset();
    }, [difficulty]);

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
        const activeCell = CELLS.find(cell => cell.r === r && cell.c === c);
        if (!activeCell) return;

        let nextCell;
        if (direction === "across") {
            const rowCells = CELLS.filter(cell => cell.r === r && cell.acrossId === activeCell.acrossId).sort((a, b) => a.c - b.c);
            const curIdx = rowCells.findIndex(cell => cell.c === c);
            nextCell = rowCells[curIdx + 1];
        } else {
            const colCells = CELLS.filter(cell => cell.c === c && cell.downId === activeCell.downId).sort((a, b) => a.r - b.r);
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
            if (!e.currentTarget.value) {
                // Navigate backwards
                moveToPrevCell(r, c);
            }
        }
    };

    const moveToPrevCell = (r: number, c: number) => {
        const activeCell = CELLS.find(cell => cell.r === r && cell.c === c);
        if (!activeCell) return;

        let prevCell;
        if (direction === "across") {
            const rowCells = CELLS.filter(cell => cell.r === r && cell.acrossId === activeCell.acrossId).sort((a, b) => a.c - b.c);
            const curIdx = rowCells.findIndex(cell => cell.c === c);
            prevCell = rowCells[curIdx - 1];
        } else {
            const colCells = CELLS.filter(cell => cell.c === c && cell.downId === activeCell.downId).sort((a, b) => a.r - b.r);
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
            const cell = CELLS.find(cc => cc.r === r && cc.c === c);
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
        const cell = CELLS.find(c => c.r === selectedCell.r && c.c === selectedCell.c);
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
        const activeCell = CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c);
        if (!activeCell) return false;

        const currentCell = CELLS.find(cc => cc.r === r && cc.c === c);
        if (!currentCell) return false;

        if (direction === "across" && activeCell.acrossId !== null) {
            return currentCell.acrossId === activeCell.acrossId;
        } else if (direction === "down" && activeCell.downId !== null) {
            return currentCell.downId === activeCell.downId;
        }
        return false;
    };

    // Verify if crossword is completed correctly
    const isCompleted = () => {
        if (CELLS.length === 0) return false;
        for (const cell of CELLS) {
            const key = getCellKey(cell.r, cell.c);
            if ((userAnswers[key] || "") !== cell.letter) return false;
        }
        return true;
    };

    const gameSolved = isCompleted();

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto w-full select-none animate-fade-in">
            {/* Grid Area */}
            <div className="flex-1 flex flex-col items-center bg-white/50 p-6 border border-warm-grey/5 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa">Crossword</h4>
                        <div className="flex gap-1 bg-stone-100/60 p-0.5 rounded-xl border border-stone-200/40">
                            {(["easy", "medium", "hard"] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold capitalize transition-all duration-200 ${
                                        difficulty === level
                                            ? "bg-white text-muted-rose shadow-sm"
                                            : "text-warm-grey/50 hover:text-warm-grey/80"
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleReset} className="w-8 h-8 p-0 rounded-full bg-white/80 shadow-sm flex items-center justify-center hover:rotate-180 transition-transform duration-500">
                            <RefreshCw className="w-4 h-4 text-warm-grey" />
                        </Button>
                    </div>
                </div>

                {/* Grid Board */}
                <div 
                    className="w-full max-w-[360px] aspect-square bg-stone-100/50 border border-stone-200/30 p-2 rounded-2xl grid gap-1 shadow-inner relative"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
                    }}
                >
                    {Array(GRID_SIZE).fill(null).map((_, r) =>
                        Array(GRID_SIZE).fill(null).map((_, c) => {
                            const cell = CELLS.find(cc => cc.r === r && cc.c === c);
                            const key = getCellKey(r, c);

                            if (!cell) {
                                return (
                                    <div 
                                        key={`empty-${r}-${c}`} 
                                        className="w-full h-full bg-stone-200/20 rounded-md border border-transparent" 
                                    />
                                );
                            }

                            const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                            const isHighlighted = isCellHighlighted(r, c);
                            const val = userAnswers[key] || "";
                            const isCorrect = val === cell.letter;

                            let bgClass = "bg-white border-stone-200/80";
                            if (isSelected) {
                                bgClass = "bg-soft-blush border-muted-rose ring-2 ring-muted-rose/25 z-10 scale-[1.05]";
                            } else if (isHighlighted) {
                                bgClass = "bg-rose-100/40 border-rose-200";
                            }

                            let textClass = "text-warm-grey";
                            if (checked && val !== "") {
                                bgClass = isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
                                textClass = isCorrect ? "text-green-700 font-bold" : "text-red-750 font-bold";
                            }

                            return (
                                <div 
                                    key={key} 
                                    onClick={() => handleCellClick(r, c)}
                                    className={`w-full h-full relative rounded-md border transition-all duration-200 shadow-sm flex items-center justify-center cursor-pointer ${bgClass}`}
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
                                        className={`w-full h-full bg-transparent text-center text-sm font-serif font-bold uppercase outline-none ${textClass}`}
                                    />
                                </div>
                            );
                        })
                    )}

                    {/* Solved Overlay */}
                    {gameSolved && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                            <div className="w-16 h-16 rounded-full bg-sage-green/20 flex items-center justify-center text-2xl shadow-md animate-bounce">🌸</div>
                            <h4 className="font-serif text-xl font-bold text-warm-cocoa">Joyfully Solved!</h4>
                            <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                                Beautiful! You completed the crossword. Switch difficulty levels to challenge yourself further!
                            </p>
                            <Button onClick={handleReset} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-[1.02] active:scale-95 transition-all">
                                Refresh Grid 🔄
                            </Button>
                        </div>
                    )}
                </div>

                {/* Helper buttons */}
                <div className="flex gap-3 mt-6 w-full max-w-[340px]">
                    <Button 
                        onClick={handleRevealLetter} 
                        disabled={!selectedCell}
                        className="flex-1 bg-stone-150 hover:bg-stone-200 text-warm-cocoa font-bold text-xs py-2.5 rounded-xl border border-stone-250/20 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                        <HelpCircle className="w-4 h-4 text-warm-grey/60" /> Reveal Letter
                    </Button>
                    <Button 
                        onClick={handleCheck}
                        className="flex-1 bg-warm-cocoa hover:bg-warm-cocoa/90 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                        <Check className="w-4 h-4" /> Check Answers
                    </Button>
                </div>
            </div>

            {/* Clues Area */}
            <div className="w-full lg:w-80 bg-white/50 border border-warm-grey/5 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left">
                {/* Across Clues */}
                <div>
                    <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 mb-3 flex items-center gap-1.5">
                        <span className="text-muted-rose">👉</span> Across
                    </h5>
                    <div className="space-y-3">
                        {CLUES.across.map(clue => {
                            const isAct = selectedCell && direction === "across" && 
                                          CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c)?.acrossId === clue.id;
                            
                            return (
                                <div 
                                    key={clue.id}
                                    className={`p-2.5 rounded-xl transition-all duration-200 border ${
                                        isAct ? "bg-rose-50 border-rose-150 shadow-sm" : "hover:bg-stone-50/40 border-transparent"
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
                                          CELLS.find(cc => cc.r === selectedCell.r && cc.c === selectedCell.c)?.downId === clue.id;
                            
                            return (
                                <div 
                                    key={clue.id}
                                    className={`p-2.5 rounded-xl transition-all duration-200 border ${
                                        isAct ? "bg-rose-50 border-rose-150 shadow-sm" : "hover:bg-stone-50/40 border-transparent"
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
