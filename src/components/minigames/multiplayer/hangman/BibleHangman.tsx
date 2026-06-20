"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { BIBLE_TERMS } from "./bibleTerms";
import { Trophy, Send, User, Award, ArrowRight, Play, Loader2, Search } from "lucide-react";
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

type Phase = "choosing" | "playing" | "round_over" | "ended";

const TOTAL_ROUNDS = 5;
const MAX_LIVES = 6; // 6 petals on the flower

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
  const guessedLettersRef = useRef<string[]>([]);
  const wrongGuessesRef = useRef(0);
  const scoresRef = useRef<Record<string, number>>({});
  const phaseRef = useRef<Phase>("choosing");
  const turnOrderRef = useRef<string[]>([]);
  const wordPatternRef = useRef<string[]>([]);
  const chooserIdRef = useRef("");

  // ─── Shared React States (Used by everyone for rendering) ──────
  const [phase, setPhase] = useState<Phase>("choosing");
  const [round, setRound] = useState(1);
  const [wordPattern, setWordPattern] = useState<string[]>([]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [chooserId, setChooserId] = useState("");
  const [solveInput, setSolveInput] = useState("");
  const [lastActionText, setLastActionText] = useState("Waiting for the host to initialize...");
  const [revealedWord, setRevealedWord] = useState("");
  const [isNextRoundLoading, setIsNextRoundLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Send Broadcast Event ───────────────────────────────────
  const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const getChooserName = () => {
    const player = room.members.find(m => m.user_id === chooserId);
    return player ? player.first_name : "Sister";
  };

  const isChooser = chooserId === currentUserId;

  // ════════════════════════════════════════════════════════════
  // HOST-ONLY PROCESSING FUNCTIONS
  // ════════════════════════════════════════════════════════════

  const hostStartRound = useCallback(() => {
    if (!isHost) return;

    const activeMembers = room.members.map(m => m.user_id);
    turnOrderRef.current = activeMembers;
    
    // Choose rotating chooser
    const currentChooserId = activeMembers[(roundRef.current - 1) % activeMembers.length];
    chooserIdRef.current = currentChooserId;

    targetWordRef.current = "";
    guessedLettersRef.current = [];
    wrongGuessesRef.current = 0;
    phaseRef.current = "choosing";
    wordPatternRef.current = [];

    const payload = {
      round: roundRef.current,
      chooserId: currentChooserId,
      scores: scoresRef.current,
      lastActionText: `Round ${roundRef.current}: Waiting for ${
        room.members.find(m => m.user_id === currentChooserId)?.first_name || "Sister"
      } to choose a Bible term!`,
    };

    broadcast("hm_round_init", payload);

    // Host local update
    setPhase("choosing");
    setRound(roundRef.current);
    setChooserId(currentChooserId);
    setScores({ ...scoresRef.current });
    setLastActionText(payload.lastActionText);
    setGuessedLetters([]);
    setWrongGuesses(0);
    setWordPattern([]);
    setRevealedWord("");
    setIsNextRoundLoading(false);
  }, [isHost, room.members, broadcast]);

  const hostSetupWord = (word: string) => {
    if (!isHost) return;

    const cleanWord = word.trim().toUpperCase();
    targetWordRef.current = cleanWord;
    phaseRef.current = "playing";

    // Build initial masked pattern
    const pattern = cleanWord.split("").map(char => {
      return char === " " ? " " : "_";
    });
    wordPatternRef.current = pattern;

    const chooserName = room.members.find(m => m.user_id === chooserIdRef.current)?.first_name || "Sister";

    const payload = {
      wordPattern: pattern,
      lastActionText: `${chooserName} chose a word! The sisters are now guessing. 🌸`,
    };

    broadcast("hm_word_set", payload);

    setPhase("playing");
    setWordPattern(pattern);
    setLastActionText(payload.lastActionText);
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
      const actionText = `${playerName} guessed '${char}' (+${pointsEarned} pts)`;

      if (solved) {
        hostEndRound(true, actionText + " The word has been solved! 🎉");
      } else {
        const payload = {
          guessedLetters: guessedLettersRef.current,
          wordPattern: updatedPattern,
          wrongGuesses: wrongGuessesRef.current,
          scores: scoresRef.current,
          lastActionText: actionText,
        };
        broadcast("hm_round_update", payload);

        setGuessedLetters([...guessedLettersRef.current]);
        setWordPattern(updatedPattern);
        setScores({ ...scoresRef.current });
        setLastActionText(actionText);
      }
    } else {
      // Incorrect Guess
      wrongGuessesRef.current += 1;
      const actionText = `${playerName} guessed '${char}' incorrectly. 🥀`;

      if (wrongGuessesRef.current >= MAX_LIVES) {
        hostEndRound(false, actionText + ` The word was "${targetWord}". 🥀`);
      } else {
        const payload = {
          guessedLetters: guessedLettersRef.current,
          wordPattern: wordPatternRef.current,
          wrongGuesses: wrongGuessesRef.current,
          scores: scoresRef.current,
          lastActionText: actionText,
        };
        broadcast("hm_round_update", payload);

        setGuessedLetters([...guessedLettersRef.current]);
        setWrongGuesses(wrongGuessesRef.current);
        setLastActionText(actionText);
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
      scoresRef.current[playerId] = (scoresRef.current[playerId] || 0) + 50;

      hostEndRound(true, `${playerName} solved the word: "${targetWord}"! (+50 pts) 🎉`);
    } else {
      // Incorrect Solve! Wither a petal
      wrongGuessesRef.current += 1;
      const actionText = `${playerName} guessed "${cleanGuess}" incorrectly. 🥀`;

      if (wrongGuessesRef.current >= MAX_LIVES) {
        hostEndRound(false, actionText + ` The word was "${targetWord}". 🥀`);
      } else {
        const payload = {
          guessedLetters: guessedLettersRef.current,
          wordPattern: wordPatternRef.current,
          wrongGuesses: wrongGuessesRef.current,
          scores: scoresRef.current,
          lastActionText: actionText,
        };
        broadcast("hm_round_update", payload);

        setGuessedLetters([...guessedLettersRef.current]);
        setWrongGuesses(wrongGuessesRef.current);
        setLastActionText(actionText);
      }
    }
  };

  const hostEndRound = (victory: boolean, actionText: string) => {
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

    if (victory) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
    }
  };

  const hostNextRound = () => {
    if (!isHost) return;
    setIsNextRoundLoading(true);

    if (roundRef.current >= TOTAL_ROUNDS) {
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
      .on("broadcast", { event: "hm_round_init" }, ({ payload }) => {
        setPhase("choosing");
        setRound(payload.round);
        setChooserId(payload.chooserId);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);
        setWordPattern([]);
        setGuessedLetters([]);
        setWrongGuesses(0);
        setRevealedWord("");
        setSolveInput("");
        setIsNextRoundLoading(false);
      })
      .on("broadcast", { event: "hm_word_set" }, ({ payload }) => {
        setPhase("playing");
        setWordPattern(payload.wordPattern);
        setLastActionText(payload.lastActionText);
      })
      .on("broadcast", { event: "hm_round_update" }, ({ payload }) => {
        setGuessedLetters(payload.guessedLetters);
        setWordPattern(payload.wordPattern);
        setWrongGuesses(payload.wrongGuesses);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);
        setSolveInput("");
      })
      .on("broadcast", { event: "hm_round_over" }, ({ payload }) => {
        setPhase("round_over");
        setRevealedWord(payload.fullWord);
        setScores(payload.scores);
        setLastActionText(payload.lastActionText);

        if (payload.victory) {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
        }
      })
      .on("broadcast", { event: "hm_game_over" }, ({ payload }) => {
        setPhase("ended");
        setScores(payload.scores);
        setLastActionText(payload.winnerText);
      })

      // Host listeners
      .on("broadcast", { event: "hm_choose_word_req" }, ({ payload }) => {
        if (!isHost) return;
        hostSetupWord(payload.word);
      })
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
    };
  }, [room.id, currentUserId, isHost, hostStartRound, supabase]);

  // Host initializer
  useEffect(() => {
    if (!isHost) return;

    const initTimer = setTimeout(() => {
      const initScores: Record<string, number> = {};
      room.members.forEach(m => {
        initScores[m.user_id] = 0;
      });
      scoresRef.current = initScores;
      roundRef.current = 1;
      hostStartRound();
    }, 1200);

    return () => clearTimeout(initTimer);
  }, [isHost]);

  // ─── Actions ──────────────────────────────────────────────────
  const handleWordSelect = (word: string) => {
    if (phase !== "choosing" || !isChooser) return;

    if (isHost) {
      hostSetupWord(word);
    } else {
      broadcast("hm_choose_word_req", { playerId: currentUserId, word });
    }
  };

  const handleKeyClick = (letter: string) => {
    if (isChooser || phase !== "playing") return;

    if (isHost) {
      hostProcessGuess(currentUserId, letter);
    } else {
      broadcast("hm_guess_letter_req", { playerId: currentUserId, letter });
    }
  };

  const handleSolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solveInput.trim() || isChooser || phase !== "playing") return;

    const guess = solveInput.trim();
    if (isHost) {
      hostProcessSolve(currentUserId, guess);
    } else {
      broadcast("hm_solve_word_req", { playerId: currentUserId, guess });
    }
    setSolveInput("");
  };

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
            ? "fill-stone-300 stroke-stone-400 opacity-40"
            : "fill-rose-300 stroke-rose-400 drop-shadow-sm"
        }`}
        strokeWidth={1.5}
        animate={isWithered ? { y: 25, rotate: 15, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.2, type: "spring" }}
      />
    );
  };

  // Filter word bank
  const filteredTerms = BIBLE_TERMS.filter(w =>
    w.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full select-none pb-8 animate-fade-in">
      
      {/* Round Header */}
      <div className="bg-white/60 backdrop-blur-sm border border-stone-100 p-4 rounded-3xl shadow-sm flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[10px] font-bold text-warm-cocoa/40 uppercase tracking-widest">Bible Hangman</span>
          <h2 className="font-serif text-base font-bold text-warm-cocoa">
            Round {round} of {TOTAL_ROUNDS}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {phase === "choosing" && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50">
              {isChooser ? "You are Choosing" : `Choosing: ${getChooserName()}`}
            </span>
          )}
          {phase === "playing" && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/50">
              {isChooser ? "Watching Guessers" : "Guessing Word"}
            </span>
          )}
        </div>
      </div>

      {/* Screen Render based on Phase */}
      <AnimatePresence mode="wait">
        
        {/* Phase 1: Choosing a Word */}
        {phase === "choosing" && (
          <motion.div
            key="choosing-phase"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col gap-4 min-h-[300px]"
          >
            {isChooser ? (
              <>
                <div className="text-center mb-1">
                  <h3 className="font-serif text-base font-bold text-warm-cocoa">
                    Choose a Word for the Sisters
                  </h3>
                  <p className="text-[11px] text-warm-grey/50 italic mt-0.5">
                    Select a Bible term from the 100-word bank below
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-warm-grey/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search words..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all"
                  />
                </div>

                {/* Word list */}
                <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 border border-stone-100 rounded-2xl p-2 bg-white/40 grid grid-cols-2 gap-2 [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-warm-cocoa/10">
                  {filteredTerms.map((word) => (
                    <button
                      key={word}
                      onClick={() => handleWordSelect(word)}
                      className="p-3 rounded-xl border border-stone-200/50 bg-white hover:bg-amber-50 hover:border-amber-200/50 text-[11px] font-bold text-warm-cocoa transition-all text-center cursor-pointer active:scale-95"
                    >
                      {word}
                    </button>
                  ))}
                  {filteredTerms.length === 0 && (
                    <p className="text-xs text-warm-grey/40 italic py-6 col-span-2 text-center">
                      No words match your search.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl animate-bounce mb-4" style={{ animationDuration: "2s" }}>🌸</span>
                <h3 className="font-serif text-base font-bold text-warm-cocoa mb-1">
                  Choosing...
                </h3>
                <p className="text-xs leading-relaxed text-warm-grey/55 italic max-w-xs">
                  {getChooserName()} is choosing a sweet Bible word for everyone to guess! Get ready!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase 2: Playing / Guessing */}
        {phase === "playing" && (
          <motion.div
            key="playing-phase"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-5"
          >
            {/* Visual flower and blanks */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              
              {/* Faith Flower */}
              <div className="md:col-span-5 bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-[10px] font-bold text-warm-cocoa/30 uppercase tracking-wider mb-2">
                  Faith Flower
                </span>

                <svg width="100%" height="150" viewBox="0 0 200 160" className="max-w-[180px]">
                  <path d="M 40 140 Q 100 135 160 140" fill="none" stroke="#D4A574" strokeWidth={3} strokeLinecap="round" />
                  <path d="M 75 140 L 80 155 Q 100 158 120 155 L 125 140 Z" fill="#b5838d" stroke="#8c5862" strokeWidth={1.5} />
                  <path d="M 100 140 C 98 120, 102 95, 100 75" fill="none" stroke="#60a5fa" strokeWidth={3.5} strokeLinecap="round" className="stroke-emerald-400" />
                  
                  {wrongGuesses < 5 && (
                    <path d="M 99 115 Q 80 110, 85 100 Q 95 105, 99 112" fill="#34d399" stroke="#10b981" strokeWidth={1} />
                  )}
                  {wrongGuesses < 6 && (
                    <path d="M 101 105 Q 120 100, 115 90 Q 105 95, 101 102" fill="#34d399" stroke="#10b981" strokeWidth={1} />
                  )}

                  {renderPetal(0, 100, 56, 12, 16, "0")}
                  {renderPetal(1, 116, 65, 12, 16, "60")}
                  {renderPetal(2, 116, 85, 12, 16, "120")}
                  {renderPetal(3, 100, 94, 12, 16, "180")}
                  {renderPetal(4, 84, 85, 12, 16, "240")}
                  {renderPetal(5, 84, 65, 12, 16, "300")}

                  <circle cx={100} cy={75} r={11} fill="#FCD34D" stroke="#F59E0B" strokeWidth={1.5} className="drop-shadow-sm" />
                </svg>

                <div className="mt-2 flex items-center gap-1.5">
                  {Array.from({ length: MAX_LIVES }).map((_, i) => (
                    <span key={i} className={`text-xs transition-all ${i >= wrongGuesses ? "opacity-100 scale-100" : "opacity-30 scale-75 filter grayscale"}`}>
                      🌸
                    </span>
                  ))}
                </div>
              </div>

              {/* Blank slot board */}
              <div className="md:col-span-7 bg-white/60 border border-stone-100 p-5 rounded-3xl shadow-sm flex flex-col justify-center items-center">
                <span className="text-[10px] font-bold text-warm-cocoa/30 uppercase tracking-wider mb-4">
                  Secret Word
                </span>

                <div className="flex flex-wrap justify-center gap-1.5 py-4 w-full">
                  {wordPattern.map((char, index) => {
                    if (char === " ") {
                      return <div key={index} className="w-5" />;
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

            {/* Action Banner */}
            <div className="bg-stone-100/60 border border-stone-200/10 p-2.5 rounded-2xl text-center">
              <p className="text-[10.5px] font-bold text-warm-cocoa/70 italic flex items-center justify-center gap-1">
                <span>🔔</span> {lastActionText}
              </p>
            </div>

            {/* Guesser Inputs (Keyboards + Solves) */}
            {!isChooser ? (
              <div className="flex flex-col gap-4">
                <form onSubmit={handleSolveSubmit} className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={solveInput}
                    onChange={(e) => setSolveInput(e.target.value.replace(/[^A-Za-z\s]/g, ""))}
                    placeholder="Know the word? Submit solve guess..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/70 border border-stone-200 text-xs text-warm-cocoa focus:outline-none focus:ring-2 focus:ring-amber-300/40 transition-all font-serif"
                    maxLength={30}
                  />
                  <button
                    type="submit"
                    disabled={!solveInput.trim()}
                    className="px-4 py-3 rounded-2xl bg-warm-cocoa text-white text-xs font-bold font-serif flex items-center gap-1 hover:bg-warm-cocoa/90 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:scale-100 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Solve
                  </button>
                </form>

                {/* Keyboard */}
                <div className="bg-white/40 border border-stone-100 p-4 rounded-3xl flex flex-col gap-2">
                  {[
                    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
                    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
                    ["Z", "X", "C", "V", "B", "N", "M"]
                  ].map((row, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-1.5">
                      {row.map(letter => {
                        const isGuessed = guessedLetters.includes(letter);
                        const isCorrect = isGuessed && wordPattern.includes(letter);

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
                            disabled={isGuessed}
                            className={`w-7 h-10 md:w-9 md:h-11 rounded-xl border flex items-center justify-center font-bold text-xs md:text-sm shadow-sm transition-all select-none ${keyColor} ${
                              !isGuessed ? "cursor-pointer active:scale-90" : "cursor-default"
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-50 border border-dashed border-stone-200/80 rounded-2xl text-center">
                <p className="text-xs text-warm-grey/50 italic leading-relaxed">
                  You chose the secret word. Sit back and watch the sisters try to guess it! 🌸
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase 3: Round Over or Ended screen overlay */}
        {(phase === "round_over" || phase === "ended") && (
          <motion.div
            key="results-phase"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-stone-150 p-6 rounded-3xl shadow-xl text-center flex flex-col items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/20 rounded-bl-full pointer-events-none" />

            {phase === "round_over" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-50 to-stone-50 flex items-center justify-center text-3xl shadow border">
                  {revealedWord ? "🌸" : "🥀"}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-serif text-lg font-bold text-warm-cocoa">
                    Word Revealed: "{revealedWord}"
                  </h3>
                  <p className="text-xs text-warm-grey/60 max-w-md mt-1 leading-relaxed">
                    {lastActionText}
                  </p>
                </div>

                {isHost ? (
                  <button
                    onClick={hostNextRound}
                    disabled={isNextRoundLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-warm-cocoa hover:bg-warm-cocoa/90 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-warm-cocoa/15 disabled:opacity-50 cursor-pointer"
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
                <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed">{lastActionText}</p>

                {isHost ? (
                  <button
                    onClick={onGameEnd}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-warm-cocoa hover:bg-warm-cocoa/90 text-white text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    Back to Lobby
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
