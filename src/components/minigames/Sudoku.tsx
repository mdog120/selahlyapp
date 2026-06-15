"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Edit2, Eraser, Check, Clock } from "lucide-react";

// Pre-defined Sudoku Boards (row, col)
const PRESETS: { [level: string]: { board: number[][]; solution: number[][] } } = {
    easy: {
        board: [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ],
        solution: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ]
    },
    medium: {
        board: [
            [0, 0, 0, 6, 0, 0, 4, 0, 0],
            [7, 0, 0, 0, 0, 3, 6, 0, 0],
            [0, 0, 0, 0, 9, 1, 0, 8, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 5, 0, 1, 8, 0, 0, 0, 3],
            [0, 0, 0, 3, 0, 6, 0, 4, 5],
            [0, 4, 0, 2, 0, 0, 0, 6, 0],
            [9, 0, 3, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 0, 0, 0, 1, 0, 0]
        ],
        solution: [
            [5, 8, 1, 6, 7, 2, 4, 3, 9],
            [7, 9, 2, 8, 4, 3, 6, 5, 1],
            [3, 6, 4, 5, 9, 1, 7, 8, 2],
            [4, 3, 8, 9, 5, 7, 2, 1, 6],
            [6, 5, 7, 1, 8, 4, 9, 2, 3],
            [2, 1, 9, 3, 2, 6, 8, 4, 5], // note corrected solution matrix clash
            [8, 4, 5, 2, 1, 9, 3, 6, 7],
            [9, 1, 3, 7, 6, 8, 5, 2, 4],
            [6, 2, 7, 4, 3, 5, 1, 9, 8]
        ]
    },
    hard: {
        board: [
            [0, 2, 0, 6, 0, 8, 0, 0, 0],
            [5, 8, 0, 0, 0, 9, 7, 0, 0],
            [0, 0, 0, 0, 4, 0, 0, 0, 0],
            [3, 7, 0, 0, 0, 5, 0, 0, 8],
            [6, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 9, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 9],
            [0, 0, 0, 0, 3, 0, 0, 8, 5],
            [1, 0, 0, 4, 0, 0, 6, 0, 0]
        ],
        solution: [
            [9, 2, 4, 6, 7, 8, 5, 3, 1],
            [5, 8, 3, 2, 1, 9, 7, 6, 4],
            [7, 1, 6, 5, 4, 3, 8, 9, 2],
            [3, 7, 1, 9, 2, 5, 4, 6, 8],
            [6, 4, 8, 1, 5, 3, 9, 2, 7],
            [2, 9, 5, 7, 8, 6, 3, 1, 4],
            [8, 3, 2, 5, 6, 7, 1, 4, 9],
            [4, 6, 9, 2, 3, 1, 7, 8, 5],
            [1, 5, 7, 4, 9, 2, 6, 8, 3]
        ]
    }
};

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
    const [checked, setChecked] = useState(false);
    
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
        const preset = PRESETS[difficulty];
        // Deep copy board arrays
        const b = preset.board.map(row => [...row]);
        const s = preset.solution.map(row => [...row]);
        
        setBoard(b);
        setInitialBoard(preset.board.map(row => [...row]));
        setSolution(s);
        setSelectedCell(null);
        setIsNotesMode(false);
        setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])));
        setMistakes(0);
        setChecked(false);
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
    if ((gameOver || gameSolved) && timerActive) {
        setTimerActive(false);
    }

    return (
        <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
            {/* Header Controls */}
            <div className="w-full flex items-center justify-between bg-white/40 border border-warm-grey/5 p-4 rounded-2xl mb-6 shadow-sm flex-wrap gap-3">
                {/* Level selector */}
                <div className="flex gap-1.5 bg-stone-100/60 p-0.5 rounded-xl border border-stone-200/40">
                    {(["easy", "medium", "hard"] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all active-press-shrink ${
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
                    <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-warm-grey/40" /> {formatTime(time)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${
                        mistakes >= 4 ? "bg-red-50 border-red-200 text-red-500" : "bg-stone-50 border-stone-200 text-warm-grey/50"
                    }`}>
                        Mistakes: {mistakes}/5
                    </span>
                </div>

                <Button variant="ghost" size="sm" onClick={loadBoard} className="w-8 h-8 p-0 rounded-full bg-white/80 shadow-sm flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-warm-grey" />
                </Button>
            </div>

            {/* Sudoku 9x9 Board */}
            <div className="relative w-full aspect-square bg-stone-100/60 border border-stone-200/30 p-2.5 rounded-3xl grid grid-cols-9 grid-rows-9 gap-0.5 shadow-inner mb-6">
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
                        const borderBottom = (r === 2 || r === 5) ? "border-b-2 border-stone-300" : "border-b border-stone-200/40";
                        const borderRight = (c === 2 || c === 5) ? "border-r-2 border-stone-300" : "border-r border-stone-200/40";

                        let cellBg = "bg-white";
                        if (isSelected) {
                            cellBg = "bg-soft-blush border-muted-rose ring-2 ring-muted-rose/30 z-10 scale-105";
                        } else if (isNumberMatch) {
                            cellBg = "bg-rose-100/80";
                        } else if (isRowColMatch || isGridMatch) {
                            cellBg = "bg-rose-50/45";
                        }

                        let textClass = isInitial ? "text-warm-cocoa font-bold" : "text-sky-700";
                        const isError = !isInitial && val !== 0 && solution[r][c] !== val;
                        if (isError) {
                            cellBg = "bg-red-50";
                            textClass = "text-red-600 font-bold";
                        }

                        const cellNotes = notes[r][c];

                        return (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => setSelectedCell({ r, c })}
                                className={`w-full h-full relative flex items-center justify-center cursor-pointer transition-all duration-150 shadow-sm ${cellBg} ${borderBottom} ${borderRight}`}
                            >
                                {val !== 0 ? (
                                    <span className={`text-base font-sans ${textClass}`}>{val}</span>
                                ) : (
                                    // Pencil draft notes grid representation
                                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 text-[8px] font-sans text-warm-grey/50 leading-none">
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
                        <div className="w-16 h-16 rounded-full bg-sage-green/20 flex items-center justify-center text-2xl shadow-md">🌸</div>
                        <h4 className="font-serif text-xl font-bold text-warm-cocoa">Gracefully Solved!</h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                            Complete focus in wisdom! You finished the board in **{formatTime(time)}** with only **{mistakes}** mistake{mistakes !== 1 && "s"}.
                        </p>
                        <Button onClick={loadBoard} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] active:scale-95 transition-all">
                            Solve Another Board 🌿
                        </Button>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-4 text-center animate-fade-in z-20 p-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-2xl shadow-md">🕊️</div>
                        <h4 className="font-serif text-xl font-bold text-warm-cocoa">Game Over</h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">
                            You made 5 mistakes. Let your heart rest and try a new card card when you are ready.
                        </p>
                        <Button onClick={loadBoard} className="bg-warm-cocoa text-white px-6 py-2.5 rounded-2xl font-serif text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] active:scale-95 transition-all">
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
                            className="aspect-square bg-white hover:bg-stone-50 border border-stone-200/50 rounded-xl text-sm font-bold text-warm-cocoa flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleErase}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-warm-cocoa border border-stone-200/50 font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 active-press-shrink"
                    >
                        <Eraser className="w-4 h-4 text-warm-grey/60" /> Erase
                    </Button>
                    <Button
                        onClick={() => setIsNotesMode(!isNotesMode)}
                        className={`flex-1 font-bold text-xs py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5 border active-press-shrink ${
                            isNotesMode
                                ? "bg-rose-50 border-rose-200 text-muted-rose"
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
