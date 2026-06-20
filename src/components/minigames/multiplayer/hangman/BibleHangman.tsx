"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRandomTerm, type BibleTerm } from "./bibleTerms";
import { Trophy, Send, HelpCircle, User, Award, ArrowRight, Play, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface RoomMember {
  user_id: string;
  first_name: string;
  username: string;
  avatar_url: string;
  joined_at: string;
}

interface GameRoom {
  id: string;
  host_id: string;
  game_type: string;
  status: string;
  members: RoomMember[];
  max_players: number;
  created_at: string;
}

interface BibleHangmanProps {
  room: GameRoom;
  currentUserId: string;
  isHost: boolean;
  onGameEnd: () => void;
  onCloseRoom: () => void;
}

type Phase = "playing" | "round_over" | "ended";

const TOTAL_ROUNDS = 5;
const MAX_LIVES = 6; // 6 petals on the flower

// Soft avatar color helper
function getAvatarBg(id: string) {
  const colors = [
    "bg-pink-100 text-pink-700 border-pink-200/50",
    "bg-emerald-100 text-emerald-800 border-emerald-200/50",
    "bg-purple-100 text-purple-800 border-purple-200/50",
    "bg-amber-100 text-amber-800 border-amber-200/50",
    "bg-rose-100 text-rose-800 border-rose-200/50",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return colors[hash % colors.length];
}

export function BibleHangman({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: BibleHangmanProps) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ─── Host-Only Refs (Source of Truth) ────────────────────────
  const roundRef = useRef(1);
  const targetWordRef = useRef("");
  const hintRef = useRef("");
  const categoryRef = useRef("");
  const guessedLettersRef = useRef<string[]>([]);
  const wrongGuessesRef = useRef(0);
  const scoresRef = useRef<Record<string, number>>({});
  const usedWordsRef = useRef<string[]>([]);
  const phaseRef = useRef<Phase>("playing");
  const turnOrderRef = useRef<string[]>([]);
  const turnIndexRef = useRef(0);
  const wordPatternRef = useRef<string[]>([]);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Shared React States (Used by everyone for rendering) ──────
  const [phase, setPhase] = useState<Phase>("playing");
  const [round, setRound] = useState(1);
  const [hint, setHint] = useState("");
  const [category, setCategory] = useState("");
  const [wordPattern, setWordPattern] = useState<string[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState("");
  const [solveInput, setSolveInput] = useState("");
  const [lastActionText, setLastActionText] = useState("The game has started!");
  const [revealedWord, setRevealedWord] = useState(""); // Only set at round over
  const [timerText, setTimerText] = useState("");
  const [isNextRoundLoading, setIsNextRoundLoading] = useState(false);

  // ─── Send Broadcast Event ───────────────────────────────────
  const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  // Get active turn player name
  const getTurnPlayerName = () => {
    const player = room.members.find(m => m.user_id === currentTurnPlayerId);
    return player ? player.first_name : "Sister";
  };

  // ════════════════════════════════════════════════════════════
  // HOST-ONLY PROCESSING FUNCTIONS
  // ════════════════════════════════════════════════════════════

  const hostStartRound = useCallback(() => {
    if (!isHost) return;

    // Filter order to make sure we only include current room members
    const activeMembers = room.members.map(m => m.user_id);
    turnOrderRef.current = activeMembers;
    
    // Pick next word
    const nextTerm = getRandomTerm(usedWordsRef.current);
    usedWordsRef.current.push(nextTerm.word);
    
    targetWordRef.current = nextTerm.word.toUpperCase();
    hintRef.current = nextTerm.hint;
    categoryRef.current = nextTerm.category;
    guessedLettersRef.current = [];
    wrongGuessesRef.current = 0;
    phaseRef.current = "playing";

    // Build initial masked word pattern
    const pattern = targetWordRef.current.split("").map(char => {
      // Reveal spaces immediately
      return char === " " ? " " : "_";
    });
    wordPatternRef.current = pattern;

    // Determine current turn
    const turnPlayerId = turnOrderRef.current[turnIndexRef.current % turnOrderRef.current.length];

    const payload = {
      round: roundRef.current,
      hint: hintRef.current,
      category: categoryRef.current,
      wordPattern: pattern,
      guessedLetters: [],
      wrongGuesses: 0,
      currentTurnPlayerId: turnPlayerId,
      scores: scoresRef.current,
      lastActionText: `Round ${roundRef.current}: Guess the ${categoryRef.current.toLowerCase()}!`,
    };

    broadcast("hm_round_start", payload);

    // Host local update
    setPhase("playing");
    setRound(roundRef.current);
    setHint(hintRef.current);
    setCategory(categoryRef.current);
    setWordPattern(pattern);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setCurrentTurnPlayerId(turnPlayerId);
    setScores({ ...scoresRef.current });
    setLastActionText(payload.lastActionText);
    setRevealedWord("");
    setIsNextRoundLoading(false);

    // Start auto-turn timer (30s per turn)
    startTurnTimer();
  }, [isHost, room.members, broadcast]);

  const startTurnTimer = () => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    
    let secondsLeft = 30;
    setTimerText(`${secondsLeft}s`);
    broadcast("hm_timer", { text: `${secondsLeft}s` });

    roundTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      setTimerText(`${secondsLeft}s`);
      broadcast("hm_timer", { text: `${secondsLeft}s` });

      if (secondsLeft <= 0) {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
        // Timeout! Force pass turn to next player
        hostPassTurn("Time is up! Turn passed.");
      }
    }, 1000);
  };

  const hostPassTurn = (actionText: string) => {
    if (!isHost) return;

    turnIndexRef.current += 1;
    const nextPlayerId = turnOrderRef.current[turnIndexRef.current % turnOrderRef.current.length];

    const payload = {
      guessedLetters: guessedLettersRef.current,
      wordPattern: wordPatternRef.current,
      wrongGuesses: wrongGuessesRef.current,
      currentTurnPlayerId: nextPlayerId,
      scores: scoresRef.current,
      lastActionText: actionText,
    };

    broadcast("hm_round_update", payload);

    setGuessedLetters([...guessedLettersRef.current]);
    setWordPattern([...wordPatternRef.current]);
    setWrongGuesses(wrongGuessesRef.current);
    setCurrentTurnPlayerId(nextPlayerId);
    setLastActionText(actionText);

    startTurnTimer();
  };

  const hostProcessGuess = (playerId: string, letter: string) => {
    if (phaseRef.current !== "playing") return;

    const char = letter.toUpperCase();
    if (guessedLettersRef.current.includes(char)) return; // Already guessed

    guessedLettersRef.current.push(char);
    const targetWord = targetWordRef.current;
    const playerProfile = room.members.find(m => m.user_id === playerId);
    const playerName = playerProfile?.first_name || "Sister";

    if (targetWord.includes(char)) {
      // Correct Guess!
      let occurrences = 0;
      const updatedPattern = wordPatternRef.current.map((c, idx) => {
        if (targetWord[idx] === char) {
          occurrences += 1;
          return char;
        }
        return c;
      });
      wordPatternRef.current = updatedPattern;

      // Award points (+10 per letter found)
      const pointsEarned = occurrences * 10;
      scoresRef.current[playerId] = (scoresRef.current[playerId] || 0) + pointsEarned;

      const solved = !updatedPattern.includes("_");
      const actionText = `${playerName} guessed '${char}' and found ${occurrences} letter(s)! (+${pointsEarned} pts)`;

      if (solved) {
        hostEndRound(true, actionText + " The word has been solved! 🌸");
      } else {
        // Keep turn if correct guess!
        const payload = {
          guessedLetters: guessedLettersRef.current,
          wordPattern: updatedPattern,
          wrongGuesses: wrongGuessesRef.current,
          currentTurnPlayerId: playerId, // keep turn
          scores: scoresRef.current,
          lastActionText: actionText,
        };
        broadcast("hm_round_update", payload);

        setGuessedLetters([...guessedLettersRef.current]);
        setWordPattern(updatedPattern);
        setScores({ ...scoresRef.current });
        setLastActionText(actionText);
        startTurnTimer();
      }
    } else {
      // Incorrect Guess
      wrongGuessesRef.current += 1;
      const actionText = `${playerName} guessed '${char}' incorrectly. 🥀`;

      if (wrongGuessesRef.current >= MAX_LIVES) {
        hostEndRound(false, actionText + " The Faith Flower has withered. 😔");
      } else {
        // Pass turn
        hostPassTurn(actionText);
      }
    }
  };

  const hostProcessSolve = (playerId: string, solveGuess: string) => {
    if (phaseRef.current !== "playing") return;

    const cleanGuess = solveGuess.trim().toUpperCase();
    const targetWord = targetWordRef.current;
    const playerProfile = room.members.find(m => m.user_id === playerId);
    const playerName = playerProfile?.first_name || "Sister";

    // Strip spaces for match check
    const match = cleanGuess.replace(/\s+/g, "") === targetWord.replace(/\s+/g, "");

    if (match) {
      // Correct Solve! Reveal all letters
      wordPatternRef.current = targetWord.split("");
      // Award big solve bonus
      scoresRef.current[playerId] = (scoresRef.current[playerId] || 0) + 50;

      hostEndRound(true, `${playerName} solved the word: "${targetWord}"! (+50 pts) 🎉`);
    } else {
      // Incorrect Solve! Wither a petal and pass turn
      wrongGuessesRef.current += 1;
      const actionText = `${playerName} tried to solve but guessed "${cleanGuess}" incorrectly. 🥀`;

      if (wrongGuessesRef.current >= MAX_LIVES) {
        hostEndRound(false, actionText + " The Faith Flower has withered. 😔");
      } else {
        hostPassTurn(actionText);
      }
    }
  };

  const hostEndRound = (victory: boolean, actionText: string) => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    phaseRef.current = "round_over";

    const payload = {
      victory,
      fullWord: targetWordRef.current,
      scores: scoresRef.current,
      lastActionText: actionText,
    };

    broadcast("hm_round_over", payload);

    setPhase("round_over");
    setRevealedWord(targetWordRef.current);
    setScores({ ...scoresRef.current });
    setLastActionText(actionText);
    setTimerText("");

    if (victory) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
    }
  };

  const hostNextRound = () => {
    if (!isHost) return;
    setIsNextRoundLoading(true);

    if (roundRef.current >= TOTAL_ROUNDS) {
      // Game completely over! Determine final winner
      const finalScores = { ...scoresRef.current };
      const maxScore = Math.max(...Object.values(finalScores), 0);
      const winners = Object.keys(finalScores).filter(id => finalScores[id] === maxScore);

      let winnerText = "A beautiful game!";
      if (winners.length > 0) {
        const winnerNames = winners.map(id => room.members.find(m => m.user_id === id)?.first_name || "Sister");
        winnerText = `Winner: ${winnerNames.join(" & ")} with ${maxScore} points! 🏆`;
      }

      broadcast("hm_game_over", { scores: finalScores, winnerText });

      setPhase("ended");
      setScores(finalScores);
      setLastActionText(winnerText);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else {
      roundRef.current += 1;
      hostStartRound();
    }
  };

  // ════════════════════════════════════════════════════════════
  // BROADCAST NETWORK EVENT SUBSCRIPTIONS
  // ════════════════════════════════════════════════════════════

  useEffect(() => {
    const channel = supabase.channel(`hangman_game:${room.id}`);

    channel
      .on("broadcast", { event: "hm_round_start" }, ({ payload }) => {
        setPhase("playing");
        setRound(payload.round);
        setHint(payload.hint);
        setCategory(payload.category);
        setWordPattern(payload.wordPattern);
        setGuessedLetters(payload.guessedLetters);
        setWrongGuesses(payload.wrongGuesses);
        setCurrentTurnPlayerId(payload.currentTurnPlayerId);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);
        setRevealedWord("");
        setSolveInput("");
        setIsNextRoundLoading(false);
      })
      .on("broadcast", { event: "hm_timer" }, ({ payload }) => {
        setTimerText(payload.text);
      })
      .on("broadcast", { event: "hm_round_update" }, ({ payload }) => {
        setGuessedLetters(payload.guessedLetters);
        setWordPattern(payload.wordPattern);
        setWrongGuesses(payload.wrongGuesses);
        setCurrentTurnPlayerId(payload.currentTurnPlayerId);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);
        setSolveInput("");
      })
      .on("broadcast", { event: "hm_round_over" }, ({ payload }) => {
        setPhase("round_over");
        setRevealedWord(payload.fullWord);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);
        setTimerText("");

        if (payload.victory) {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
        }
      })
      .on("broadcast", { event: "hm_game_over" }, ({ payload }) => {
        setPhase("ended");
        setScores(payload.scores);
        setLastActionText(payload.winnerText);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      })

      // Host listeners
      .on("broadcast", { event: "hm_guess_letter_req" }, ({ payload }) => {
        if (!isHost) return;
        hostProcessGuess(payload.playerId, payload.letter);
      })
      .on("broadcast", { event: "hm_solve_word_req" }, ({ payload }) => {
        if (!isHost) return;
        hostProcessSolve(payload.playerId, payload.guess);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [room.id, currentUserId, isHost, hostStartRound, supabase]);

  // Host initializer
  useEffect(() => {
    if (!isHost) return;

    // Delay slightly to ensure everyone's subscribed
    const initTimer = setTimeout(() => {
      const initScores: Record<string, number> = {};
      room.members.forEach(m => {
        initScores[m.user_id] = 0;
      });
      scoresRef.current = initScores;
      roundRef.current = 1;
      usedWordsRef.current = [];
      turnIndexRef.current = 0;

      hostStartRound();
    }, 1200);

    return () => clearTimeout(initTimer);
  }, [isHost]);

  // ─── Player Actions ──────────────────────────────────────────
  const handleKeyClick = (letter: string) => {
    if (currentTurnPlayerId !== currentUserId || phase !== "playing") return;

    if (isHost) {
      hostProcessGuess(currentUserId, letter);
    } else {
      broadcast("hm_guess_letter_req", { playerId: currentUserId, letter });
    }
  };

  const handleSolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solveInput.trim() || currentTurnPlayerId !== currentUserId || phase !== "playing") return;

    const guess = solveInput.trim();
    if (isHost) {
      hostProcessSolve(currentUserId, guess);
    } else {
      broadcast("hm_solve_word_req", { playerId: currentUserId, guess });
    }
    setSolveInput("");
  };

  const isMyTurn = currentTurnPlayerId === currentUserId && phase === "playing";

  // Render Petal Helpers
  const renderPetal = (index: number, cx: number, cy: number, rx: number, ry: number, rotate: string) => {
    const isWithered = wrongGuesses > index;
    return (
      <motion.ellipse
        key={index}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        transform={`rotate(${rotate} ${cx} ${cy})`}
        className={`origin-center ${
          isWithered
            ? "fill-stone-300 stroke-stone-400 opacity-40 shadow-inner"
            : "fill-rose-300 stroke-rose-400 drop-shadow-sm"
        }`}
        strokeWidth={1.5}
        animate={isWithered ? { y: 25, rotate: 15, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.2, type: "spring" }}
      />
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full select-none pb-8 animate-fade-in">
      {/* Round & Timer Header */}
      <div className="bg-white/60 backdrop-blur-sm border border-stone-100 p-4 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] font-bold text-warm-cocoa/40 uppercase tracking-widest">Bible Hangman</span>
          <h2 className="font-serif text-base font-bold text-warm-cocoa">
            Round {round} of {TOTAL_ROUNDS}
          </h2>
        </div>

        {phase === "playing" && (
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isMyTurn ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-stone-100 text-stone-600"}`}>
              {isMyTurn ? "Your Turn" : `${getTurnPlayerName()}'s Turn`}
            </span>
            {timerText && (
              <span className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-3 py-1 rounded-xl shadow-sm min-w-[48px] text-center">
                {timerText}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Game Screen */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT: Faith Flower Drawing Board */}
        <div className="md:col-span-5 bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center min-h-[220px]">
          <span className="text-[10px] font-bold text-warm-cocoa/30 uppercase tracking-wider mb-2">
            Faith Flower
          </span>

          <svg width="100%" height="160" viewBox="0 0 200 160" className="max-w-[200px]">
            {/* The Soil */}
            <path d="M 40 140 Q 100 135 160 140" fill="none" stroke="#D4A574" strokeWidth={3} strokeLinecap="round" />
            
            {/* Pot */}
            <path d="M 75 140 L 80 155 Q 100 158 120 155 L 125 140 Z" fill="#b5838d" stroke="#8c5862" strokeWidth={1.5} />
            
            {/* Stem */}
            <path d="M 100 140 C 98 120, 102 95, 100 75" fill="none" stroke="#60a5fa" strokeWidth={3.5} strokeLinecap="round" className="stroke-emerald-400" />
            
            {/* Leaves */}
            {wrongGuesses < 5 && (
              <path d="M 99 115 Q 80 110, 85 100 Q 95 105, 99 112" fill="#34d399" stroke="#10b981" strokeWidth={1} />
            )}
            {wrongGuesses < 6 && (
              <path d="M 101 105 Q 120 100, 115 90 Q 105 95, 101 102" fill="#34d399" stroke="#10b981" strokeWidth={1} />
            )}

            {/* Petals (arranged radially around center 100, 75) */}
            {/* Petal 0: 12 o'clock */}
            {renderPetal(0, 100, 56, 12, 16, "0")}
            {/* Petal 1: 2 o'clock */}
            {renderPetal(1, 116, 65, 12, 16, "60")}
            {/* Petal 2: 4 o'clock */}
            {renderPetal(2, 116, 85, 12, 16, "120")}
            {/* Petal 3: 6 o'clock */}
            {renderPetal(3, 100, 94, 12, 16, "180")}
            {/* Petal 4: 8 o'clock */}
            {renderPetal(4, 84, 85, 12, 16, "240")}
            {/* Petal 5: 10 o'clock */}
            {renderPetal(5, 84, 65, 12, 16, "300")}

            {/* Flower Center */}
            <circle cx={100} cy={75} r={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.5} className="drop-shadow-sm" />
          </svg>

          {/* Lives Indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            {Array.from({ length: MAX_LIVES }).map((_, i) => {
              const active = i >= wrongGuesses;
              return (
                <span key={i} className={`text-xs transition-all ${active ? "opacity-100 scale-100" : "opacity-30 scale-75 filter grayscale"}`}>
                  🌸
                </span>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Game Board Word Display & Hint */}
        <div className="md:col-span-7 bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/30 uppercase">
                {category}
              </span>
              <span className="text-[9px] font-semibold text-warm-grey/50">
                Category
              </span>
            </div>

            {/* Hint Message Bubble */}
            <div className="bg-stone-50 border border-stone-100/50 p-3 rounded-2xl mb-5 flex items-start gap-2 text-left">
              <HelpCircle className="w-4 h-4 text-warm-cocoa/40 mt-0.5 shrink-0" />
              <p className="text-xs text-warm-cocoa/80 leading-relaxed font-serif italic">
                &ldquo;{hint}&rdquo;
              </p>
            </div>
          </div>

          {/* Letter Slots */}
          <div className="flex flex-wrap justify-center gap-1.5 py-4">
            {wordPattern.map((char, index) => {
              if (char === " ") {
                return (
                  <div key={index} className="w-5" /> // Spacer for spaces
                );
              }
              return (
                <div
                  key={index}
                  className="w-8 h-10 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center font-serif text-lg font-bold text-warm-cocoa shadow-sm"
                >
                  {char !== "_" ? char : ""}
                  {char === "_" && (
                    <span className="absolute bottom-1 w-3 h-0.5 bg-stone-300 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logged actions banner */}
      <div className="bg-stone-100/60 border border-stone-200/10 p-2.5 rounded-2xl text-center">
        <p className="text-[10.5px] font-bold text-warm-cocoa/70 italic flex items-center justify-center gap-1">
          <span>🔔</span> {lastActionText}
        </p>
      </div>

      {/* Keyboard & Solver Drawers */}
      <AnimatePresence mode="wait">
        {phase === "playing" ? (
          <motion.div
            key="keyboard-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {/* Solver input */}
            {isMyTurn ? (
              <form onSubmit={handleSolveSubmit} className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={solveInput}
                  onChange={(e) => setSolveInput(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                  placeholder="Know the word? Type full solve here..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-stone-200 text-xs text-warm-cocoa focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all font-serif"
                  maxLength={30}
                />
                <button
                  type="submit"
                  disabled={!solveInput.trim()}
                  className="px-4 py-3 rounded-2xl bg-warm-cocoa text-white text-xs font-bold font-serif flex items-center gap-1 hover:bg-warm-cocoa/90 active:scale-95 transition-all shadow-md shadow-warm-cocoa/10 disabled:opacity-40 disabled:scale-100"
                >
                  <Send className="w-3.5 h-3.5" />
                  Solve
                </button>
              </form>
            ) : (
              <div className="p-3 bg-stone-50 border border-dashed border-stone-200/80 rounded-2xl text-center">
                <p className="text-xs text-warm-grey/50 italic">
                  Waiting for your turn to suggest letters or solve... 🌸
                </p>
              </div>
            )}

            {/* Virtual Keyboard */}
            <div className="bg-white/40 border border-stone-100 p-4 rounded-3xl flex flex-col gap-2">
              {[
                ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
                ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
                ["Z", "X", "C", "V", "B", "N", "M"]
              ].map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1.5">
                  {row.map(letter => {
                    const isGuessed = guessedLetters.includes(letter);
                    const isCorrect = isGuessed && targetWordRef.current.includes(letter);
                    
                    let keyColor = "bg-white text-warm-cocoa hover:bg-stone-50 hover:border-stone-300 border-stone-200";
                    if (isGuessed) {
                      keyColor = isCorrect
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed opacity-60";
                    }

                    return (
                      <button
                        key={letter}
                        onClick={() => handleKeyClick(letter)}
                        disabled={isGuessed || !isMyTurn}
                        className={`w-7 h-10 md:w-9 md:h-11 rounded-xl border flex items-center justify-center font-bold text-xs md:text-sm shadow-sm transition-all select-none ${keyColor} ${
                          isMyTurn && !isGuessed ? "cursor-pointer active:scale-90" : "cursor-default"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="overlay-section"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-stone-150 p-6 rounded-3xl shadow-xl text-center flex flex-col items-center gap-4 relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/20 rounded-bl-full pointer-events-none" />

            {phase === "round_over" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-50 to-stone-50 flex items-center justify-center text-3xl shadow border">
                  {revealedWord ? "🌸" : "🥀"}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-serif text-lg font-bold text-warm-cocoa">
                    {revealedWord ? `Word Revealed: ${revealedWord}` : "Round Over"}
                  </h3>
                  <p className="text-xs text-warm-grey/50 italic font-serif">
                    &ldquo;{hint}&rdquo;
                  </p>
                </div>

                {isHost ? (
                  <button
                    onClick={hostNextRound}
                    disabled={isNextRoundLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-warm-cocoa hover:bg-warm-cocoa/90 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-warm-cocoa/15 disabled:opacity-50"
                  >
                    {isNextRoundLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Next Round <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-[10px] text-warm-grey/40 italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for host to start next round...
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center text-4xl shadow border border-amber-100">
                  🏆
                </div>

                <h3 className="font-serif text-xl font-bold text-warm-cocoa">
                  Game Ended!
                </h3>
                <p className="text-xs text-warm-grey/60 max-w-xs">{lastActionText}</p>

                {isHost ? (
                  <button
                    onClick={onGameEnd}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-warm-cocoa hover:bg-warm-cocoa/90 text-white text-xs font-bold transition-all active:scale-95 shadow-md"
                  >
                    <Play className="w-4 h-4" /> Back to Lobby
                  </button>
                ) : (
                  <p className="text-[10px] text-warm-grey/40 italic flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for host to return to lobby...
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoreboard */}
      <div className="bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm">
        <h3 className="font-serif text-xs font-bold text-warm-cocoa/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Scoreboard
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {room.members.map((member) => {
            const score = scores[member.user_id] || 0;
            const isMe = member.user_id === currentUserId;
            
            return (
              <div
                key={member.user_id}
                className={`flex items-center gap-2.5 p-2 rounded-2xl border ${
                  isMe
                    ? "bg-amber-50/40 border-amber-200/50 shadow-sm"
                    : "bg-white border-stone-100"
                }`}
              >
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.first_name} className="w-7 h-7 rounded-full object-cover border" />
                ) : (
                  <div className={`w-7 h-7 rounded-full ${getAvatarBg(member.user_id)} flex items-center justify-center text-[10px] font-bold border`}>
                    {member.first_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className="text-[10.5px] font-bold text-warm-cocoa truncate leading-tight">
                    {member.first_name}
                  </span>
                  <span className="text-[9.5px] font-bold text-warm-grey/40 flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 text-amber-500" /> {score} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
