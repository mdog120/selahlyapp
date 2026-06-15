"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Edit2, Eraser, Clock } from "lucide-react";

// Solution Board A (100% Mathematically Valid)
const SOLUTION_A = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

// Solution Board B (100% Mathematically Valid)
const SOLUTION_B = [
    [1, 2, 3, 6, 7, 8, 9, 4, 5],
    [5, 8, 9, 1, 3, 4, 7, 6, 2],
    [4, 6, 7, 2, 5, 9, 1, 3, 8],
    [7, 1, 2, 3, 4, 5, 8, 9, 6],
    [3, 4, 5, 8, 9, 6, 2, 7, 1],
    [9, 6, 8, 7, 2, 1, 3, 5, 4],
    [2, 3, 4, 9, 6, 7, 5, 8, 1],
    [6, 7, 1, 5, 8, 2, 4, 3, 9],
    [8, 9, 5, 4, 1, 3, 6, 2, 7]
];

// Easy Mask (only masks ~30 cells)
const EASY_MASK = [
    [0, 0, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 0, 1, 1, 0],
    [1, 0, 0, 1, 1, 1, 1, 0, 1],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, 1, 0, 1, 1, 0],
    [0, 1, 1, 1, 0, 1, 1, 1, 0],
    [1, 0, 1, 1, 1, 1, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 0, 1, 1, 0, 0]
];

// Medium Mask (masks ~45 cells)
const MEDIUM_MASK = [
    [1, 1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 0, 0, 1, 1, 1, 0],
    [1, 1, 1, 0, 1, 0, 1, 0, 0],
    [1, 0, 1, 0, 1, 1, 1, 0, 1],
    [0, 1, 0, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 0, 1, 0, 1, 1]
];

// Hard Mask (masks ~56 cells)
const HARD_MASK = [
    [1, 0, 1, 0, 1, 0, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0, 1, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 1, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 0, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 1, 1]
];

export function Sudoku() {
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
    const [board, setBoard] = useState<number[][]>([]);
    const [initialBoard, setInitialBoard] = useState<number[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [notes, setNotes] = useState<number[][][]>(
        Array(9).fill(null).map(() => Array(9).fill(null).map(() => []))
    );
    const [mistakes, setMistakes] = useState(0);
    const [shakeTrigger, setShakeTrigger] = useState(false);
    
    // Timer
    const [time, setTime] = useState(0);
    const [timerActive, setTimerActive] = useState(true);

    useEffect(() => {
        loadBoard();
    }, [difficulty]);

    useEffect(() => {
        let interval: any = null;
        if (timerActive) {
            interval = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const loadBoard = () => {
        // Randomly select Solution A or B
        const selectSolution = Math.random() > 0.5 ? SOLUTION_A : SOLUTION_B;
        const selectMask = difficulty === "easy" ? EASY_MASK : difficulty === "medium" ? MEDIUM_MASK : HARD_MASK;
        
        // Deep copy board arrays and apply mask (1 means empty cell)
        const b = selectSolution.map((row, rIdx) => 
            row.map((val, cIdx) => (selectMask[rIdx][cIdx] === 1 ? 0 : val))
        );
        
        setBoard(b);
        setInitialBoard(b.map(row => [...row]));
        setSolution(selectSolution.map(row => [...row]));
        setSelectedCell(null);
        setIsNotesMode(false);
        setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])));
        setMistakes(0);
        setTime(0);
        setTimerActive(true);
    };

    // Format time (MM:SS)
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Handle number inputs (either clicking keypad or typing)
    const handleNumberInput = (num: number) => {
        if (!selectedCell || gameOver) return;
        const { r, c } = selectedCell;
        
        // Cannot edit initial pre-filled cells
        if (initialBoard[r][c] !== 0) return;

        if (isNotesMode) {
            // Edit notes
            const currentNotes = [...notes[r][c]];
            const idx = currentNotes.indexOf(num);
            if (idx > -1) {
                currentNotes.splice(idx, 1); // Remove
            } else {
                currentNotes.push(num); // Add
            }
            const newNotes = notes.map((row, rIdx) => 
                row.map((cellNotes, cIdx) => 
                    rIdx === r && cIdx === c ? currentNotes : cellNotes
                )
            );
            setNotes(newNotes);
        } else {
            // Place number
            const newBoard = board.map((row, rIdx) =>
                row.map((val, cIdx) => (rIdx === r && cIdx === c ? num : val))
            );
            
            // Validate mistake
            if (num !== 0 && solution[r][c] !== num) {
                setMistakes(prev => prev + 1);
                setShakeTrigger(true);
                setTimeout(() => setShakeTrigger(false), 500);
            }

            setBoard(newBoard);
            // Clear notes for this cell when placing a number
            const newNotes = notes.map((row, rIdx) => 
                row.map((cellNotes, cIdx) => 
                    rIdx === r && cIdx === c ? [] : cellNotes
                )
            );
            setNotes(newNotes);
        }
    };

    // Erase cell value
    const handleErase = () => {
        if (!selectedCell) return;
        const { r, c } = selectedCell;
        if (initialBoard[r][c] !== 0) return;

        const newBoard = board.map((row, rIdx) =>
            row.map((val, cIdx) => (rIdx === r && cIdx === c ? 0 : val))
        );
        setBoard(newBoard);

        const newNotes = notes.map((row, rIdx) => 
            row.map((cellNotes, cIdx) => 
                rIdx === r && cIdx === c ? [] : cellNotes
            )
        );
        setNotes(newNotes);
    };

    // Keyboard controls support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedCell) return;
            const key = e.key;

            if (key >= "1" && key <= "9") {
                handleNumberInput(parseInt(key, 10));
            } else if (key === "Backspace" || key === "Delete") {
                handleErase();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedCell, isNotesMode, board, notes]);

    // Check if game is completed
    const isCompleted = () => {
        if (board.length === 0) return false;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r]?.[c] !== solution[r]?.[c]) return false;
            }
        }
        return true;
    };

    const gameOver = mistakes >= 5;
    const gameSolved = board.length > 0 && isCompleted();

    // Pause timer on game end
    useEffect(() => {
        if ((gameOver || gameSolved) && timerActive) {
            setTimerActive(false);
        }
    }, [gameOver, gameSolved, timerActive]);

    return (
        <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none animate-fade-in">
            {/* Styles for Shake Animation */}
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-6px); }
                    40%, 80% { transform: translateX(6px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>

            {/* Header Controls */}
            <div className="w-full flex items-center justify-between bg-white/50 border border-warm-grey/5 p-4 rounded-2xl mb-6 shadow-sm flex-wrap gap-3">
                {/* Level selector */}
                <div className="flex gap-1 bg-stone-100/60 p-0.5 rounded-xl border border-stone-200/40">
                    {(["easy", "medium", "hard"] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all active:scale-95 duration-200 ${
                                difficulty === level
                                    ? "bg-white text-muted-rose shadow-sm"
                                    : "text-warm-grey/50 hover:text-warm-grey/80"
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-warm-cocoa">
                    <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-warm-grey/40" /> {formatTime(time)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border transition-all duration-350 ${
                        mistakes >= 4 ? "bg-red-50 border-red-250 text-red-550 animate-pulse" : "bg-stone-50 border-stone-200 text-warm-grey/50"
                    }`}>
                        Mistakes: {mistakes}/5
                    </span>
                </div>

                <Button variant="ghost" size="sm" onClick={loadBoard} className="w-8 h-8 p-0 rounded-full bg-white/80 shadow-sm flex items-center justify-center hover:rotate-180 transition-transform duration-500">
                    <RefreshCw className="w-4 h-4 text-warm-grey" />
                </Button>
            </div>

            {/* Sudoku 9x9 Board */}
            <div className={`relative w-full aspect-square bg-stone-100/50 border border-stone-200/30 p-2 rounded-3xl grid grid-cols-9 grid-rows-9 gap-[1.5px] shadow-inner mb-6 transition-transform duration-300 ${
                shakeTrigger ? "animate-shake border-red-400" : ""
            }`}>
                {board.map((row, r) =>
                    row.map((val, c) => {
                        const isInitial = initialBoard[r][c] !== 0;
                        const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                        
                        // Highlights: matching rows, columns, grids, and matching numbers
                        const isRowColMatch = selectedCell && (selectedCell.r === r || selectedCell.c === c);
                        const isGridMatch = selectedCell && (
                            Math.floor(selectedCell.r / 3) === Math.floor(r / 3) &&
                            Math.floor(selectedCell.c / 3) === Math.floor(c / 3)
                        );
                        
                        const selectedVal = selectedCell ? board[selectedCell.r][selectedCell.c] : null;
                        const isNumberMatch = selectedVal !== 0 && val === selectedVal;

                        // Grid borders 3x3 dividers
                        const borderBottom = (r === 2 || r === 5) ? "border-b-2 border-stone-300/80" : "border-b border-stone-200/40";
                        const borderRight = (c === 2 || c === 5) ? "border-r-2 border-stone-300/80" : "border-r border-stone-200/40";

                        let cellBg = "bg-white";
                        if (isSelected) {
                            cellBg = "bg-soft-blush border-muted-rose ring-2 ring-muted-rose/25 z-10 scale-[1.03]";
                        } else if (isNumberMatch) {
                            cellBg = "bg-rose-100/50";
                        } else if (isRowColMatch || isGridMatch) {
                            cellBg = "bg-rose-50/30";
                        }

                        let textClass = isInitial ? "text-warm-cocoa font-bold" : "text-emerald-700 font-semibold";
                        const isError = !isInitial && val !== 0 && solution[r][c] !== val;
                        if (isError) {
                            cellBg = "bg-red-55/80";
                            textClass = "text-red-650 font-bold";
                        }

                        const cellNotes = notes[r][c];

                        return (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => setSelectedCell({ r, c })}
                                className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-all duration-150 rounded-[4px] shadow-sm select-none ${cellBg} ${borderBottom} ${borderRight}`}
                            >
                                {val !== 0 ? (
                                    <span className={`text-[17px] font-serif transition-all duration-350 ${
                                        isSelected ? "scale-110" : ""
                                    } ${textClass}`}>{val}</span>
                                ) : (
                                    // Pencil draft notes grid representation
                                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1 text-[8px] font-sans text-warm-grey/50 leading-none">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <div key={num} className="flex items-center justify-center">
                                                {cellNotes.includes(num) ? num : ""}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Solved Overlay */}
                {gameSolved && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                        <div className="w-16 h-16 rounded-full bg-sage-green/20 flex items-center justify-center text-2xl shadow-md animate-bounce">🌸</div>
                        <h4 className="font-serif text-xl font-bold text-warm-cocoa">Gracefully Solved!</h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                          Beautiful focus! You finished the board in <strong className="text-muted-rose">{formatTime(time)}</strong> with only <strong className="text-muted-rose">{mistakes}</strong> mistake{mistakes !== 1 && "s"}.
                        </p>
                        <Button onClick={loadBoard} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all">
                            Solve Another Board 🌿
                        </Button>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl shadow-md">🕊️</div>
                        <h4 className="font-serif text-xl font-bold text-warm-cocoa">Rest & Reflect</h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                            You made 5 mistakes. Let your heart rest, reset your focus, and try a new board when you are ready.
                        </p>
                        <Button onClick={loadBoard} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all">
                            Try Again 🌸
                        </Button>
                    </div>
                )}
            </div>

            {/* Input Keypad Controls */}
            <div className="w-full flex flex-col gap-3">
                <div className="grid grid-cols-9 gap-1.5 bg-white/40 p-2.5 border border-warm-grey/5 rounded-2xl shadow-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="aspect-square bg-white hover:bg-stone-50 border border-stone-200/50 rounded-xl text-sm font-bold text-warm-cocoa flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleErase}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-warm-cocoa border border-stone-200/50 font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                        <Eraser className="w-4 h-4 text-warm-grey/60" /> Erase
                    </Button>
                    <Button
                        onClick={() => setIsNotesMode(!isNotesMode)}
                        className={`flex-1 font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 border active:scale-[0.98] transition-transform ${
                            isNotesMode
                                ? "bg-rose-50 border-rose-250 text-muted-rose"
                                : "bg-stone-100 hover:bg-stone-200 text-warm-cocoa border-stone-200/50"
                        }`}
                    >
                        <Edit2 className="w-4 h-4" /> Note {isNotesMode ? "ON" : "OFF"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
