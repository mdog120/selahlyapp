"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Shuffle, LogOut, Sparkles } from "lucide-react";
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

interface BibleScrabbleProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
    onCloseRoom: () => void;
}

type Tile = { id: string; letter: string; points: number };
type BoardTile = Tile & { ownerId: string; turn: number };
type BoardState = Record<string, BoardTile>;
type Scores = Record<string, number>;
type Racks = Record<string, Tile[]>;
type Placement = { row: number; col: number; tile: Tile };
type Bonus = "DL" | "TL" | "DW" | "TW" | "STAR" | null;

const BOARD_SIZE = 11;
const CENTER = 5;
const RACK_SIZE = 7;
const TURN_SECONDS = 60;
const MAX_SCORE = 100;

const LETTER_POINTS: Record<string, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
    J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
    S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

const LETTER_COUNTS: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 3, I: 8,
    J: 1, K: 1, L: 4, M: 3, N: 6, O: 7, P: 2, Q: 1, R: 6,
    S: 5, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
};

const BIBLE_WORDS = new Set([
    "ABEL", "ABIDE", "ADAM", "ANGEL", "ANOINT", "ARK", "BABEL", "BAPTISM",
    "BETHANY", "BIBLE", "BLESS", "BREAD", "CANA", "CROSS", "CROWN", "DAVID",
    "DISCIPLE", "DOVE", "EDEN", "ELIJAH", "ESTHER", "EXODUS", "FAITH", "FISH",
    "FORGIVE", "FRUIT", "GALILEE", "GENESIS", "GLORY", "GOSPEL", "GRACE",
    "HEAVEN", "HOLY", "HOPE", "ISRAEL", "JACOB", "JERICHO", "JESUS", "JOB",
    "JOHN", "JONAH", "JORDAN", "JOY", "JUDAH", "KING", "LAMB", "LIGHT",
    "LOVE", "MANNA", "MARY", "MERCY", "MOSES", "NAOMI", "NOAH", "OLIVE",
    "PAUL", "PEACE", "PETER", "PRAYER", "PROPHET", "PSALM", "REDEEM",
    "RUTH", "SABBATH", "SALEM", "SAMUEL", "SARAH", "SAVIOR", "SCRIPTURE",
    "SELAH", "SHEPHERD", "SINAI", "SOLOMON", "SPIRIT", "TEMPLE",
    "TRUTH", "VINE", "WISDOM", "WORD", "WORSHIP", "ZION",
]);

const BONUS_MAP: Record<string, Bonus> = {
    "0-0": "TW", "0-5": "TW", "0-10": "TW", "5-0": "TW", "5-10": "TW",
    "10-0": "TW", "10-5": "TW", "10-10": "TW",
    "1-1": "DW", "2-2": "DW", "3-3": "DW", "4-4": "DW",
    "1-9": "DW", "2-8": "DW", "3-7": "DW", "4-6": "DW",
    "6-4": "DW", "7-3": "DW", "8-2": "DW", "9-1": "DW",
    "6-6": "DW", "7-7": "DW", "8-8": "DW", "9-9": "DW",
    "5-5": "STAR",
    "0-3": "TL", "0-7": "TL", "3-0": "TL", "3-10": "TL",
    "7-0": "TL", "7-10": "TL", "10-3": "TL", "10-7": "TL",
    "2-5": "DL", "5-2": "DL", "5-8": "DL", "8-5": "DL",
    "1-4": "DL", "1-6": "DL", "4-1": "DL", "4-9": "DL",
    "6-1": "DL", "6-9": "DL", "9-4": "DL", "9-6": "DL",
};

const keyFor = (row: number, col: number) => `${row}-${col}`;
const getName = (members: RoomMember[], id: string) =>
    members.find((member) => member.user_id === id)?.first_name || "Sister";

function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}

function createBag(): Tile[] {
    let sequence = 0;
    return shuffle(
        Object.entries(LETTER_COUNTS).flatMap(([letter, count]) =>
            Array.from({ length: count }, () => ({
                id: `${letter}-${sequence++}`,
                letter,
                points: LETTER_POINTS[letter],
            }))
        )
    );
}

function drawTiles(bag: Tile[], count: number) {
    return { drawn: bag.slice(0, count), remaining: bag.slice(count) };
}

function bonusClasses(bonus: Bonus) {
    if (bonus === "TW") return "bg-gradient-to-br from-rose-500 to-red-700 text-white";
    if (bonus === "DW" || bonus === "STAR") return "bg-gradient-to-br from-amber-300 to-orange-400 text-amber-950";
    if (bonus === "TL") return "bg-gradient-to-br from-indigo-500 to-violet-700 text-white";
    if (bonus === "DL") return "bg-gradient-to-br from-sky-300 to-cyan-500 text-sky-950";
    return "bg-[#e9dfc5]/75 text-[#9b8766]";
}

export function BibleScrabble({
    room,
    currentUserId,
    isHost,
    onGameEnd,
    onCloseRoom,
}: BibleScrabbleProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const bagRef = useRef<Tile[]>([]);
    const racksRef = useRef<Racks>({});
    const boardRef = useRef<BoardState>({});
    const scoresRef = useRef<Scores>({});
    const turnOrderRef = useRef<string[]>([]);
    const turnIndexRef = useRef(0);
    const turnNumberRef = useRef(1);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [board, setBoard] = useState<BoardState>({});
    const [rack, setRack] = useState<Tile[]>([]);
    const [scores, setScores] = useState<Scores>({});
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurnId, setCurrentTurnId] = useState("");
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
    const [message, setMessage] = useState("Choose a tile, then tap the board.");
    const [timer, setTimer] = useState(TURN_SECONDS);
    const [bagCount, setBagCount] = useState(0);
    const [lastWord, setLastWord] = useState("");
    const [winnerId, setWinnerId] = useState<string | null>(null);

    const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    const clearTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
    };

    const hostStartTimer = () => {
        clearTimer();
        let seconds = TURN_SECONDS;
        setTimer(seconds);
        broadcast("scrabble_timer", { seconds });
        timerRef.current = setInterval(() => {
            seconds -= 1;
            setTimer(seconds);
            broadcast("scrabble_timer", { seconds });
            if (seconds <= 0) {
                clearTimer();
                hostEndTurn("Time expired — turn passed.");
            }
        }, 1000);
    };

    const sendRack = (playerId: string) => {
        broadcast("scrabble_rack", { playerId, rack: racksRef.current[playerId] || [] });
        if (playerId === currentUserId) setRack([...(racksRef.current[playerId] || [])]);
    };

    const hostBroadcastState = (statusMessage: string) => {
        const payload = {
            board: boardRef.current,
            scores: scoresRef.current,
            turnOrder: turnOrderRef.current,
            currentTurnId: turnOrderRef.current[turnIndexRef.current],
            bagCount: bagRef.current.length,
            turnNumber: turnNumberRef.current,
            message: statusMessage,
        };
        broadcast("scrabble_state", payload);
        setBoard({ ...boardRef.current });
        setScores({ ...scoresRef.current });
        setTurnOrder([...turnOrderRef.current]);
        setCurrentTurnId(payload.currentTurnId);
        setBagCount(payload.bagCount);
        setMessage(statusMessage);
    };

    const hostInit = () => {
        const order = shuffle(room.members.map((member) => member.user_id));
        let bag = createBag();
        const racks: Racks = {};
        const scoresState: Scores = {};

        order.forEach((id) => {
            const result = drawTiles(bag, RACK_SIZE);
            racks[id] = result.drawn;
            bag = result.remaining;
            scoresState[id] = 0;
        });

        bagRef.current = bag;
        racksRef.current = racks;
        boardRef.current = {};
        scoresRef.current = scoresState;
        turnOrderRef.current = order;
        turnIndexRef.current = 0;
        turnNumberRef.current = 1;

        order.forEach(sendRack);
        hostBroadcastState(`${getName(room.members, order[0])} begins the word garden.`);
        hostStartTimer();
    };

    const hostEndTurn = (statusMessage: string) => {
        setPlacements([]);
        setSelectedTileId(null);
        turnIndexRef.current = (turnIndexRef.current + 1) % turnOrderRef.current.length;
        turnNumberRef.current += 1;
        hostBroadcastState(statusMessage);
        hostStartTimer();
    };

    const collectWord = (submitted: Placement[]) => {
        const rows = [...new Set(submitted.map((item) => item.row))];
        const cols = [...new Set(submitted.map((item) => item.col))];
        if (rows.length > 1 && cols.length > 1) return null;

        const horizontal = rows.length === 1;
        const fixed = horizontal ? rows[0] : cols[0];
        let cursor = Math.min(...submitted.map((item) => horizontal ? item.col : item.row));
        while (cursor > 0 && boardRef.current[keyFor(horizontal ? fixed : cursor - 1, horizontal ? cursor - 1 : fixed)]) cursor--;

        const letters: BoardTile[] = [];
        const coordinates: { row: number; col: number }[] = [];
        while (cursor < BOARD_SIZE) {
            const row = horizontal ? fixed : cursor;
            const col = horizontal ? cursor : fixed;
            const placed = submitted.find((item) => item.row === row && item.col === col);
            const existing = boardRef.current[keyFor(row, col)];
            const tile = placed ? { ...placed.tile, ownerId: currentTurnId, turn: turnNumberRef.current } : existing;
            if (!tile) break;
            letters.push(tile);
            coordinates.push({ row, col });
            cursor++;
        }

        if (letters.length < 2) return null;
        return { word: letters.map((tile) => tile.letter).join(""), coordinates, letters };
    };

    const validatePlacement = (submitted: Placement[]) => {
        if (submitted.length === 0) return { error: "Place at least one tile." };
        const wordData = collectWord(submitted);
        if (!wordData) return { error: "Tiles must form one connected word." };
        const wordKeys = new Set(wordData.coordinates.map(({ row, col }) => keyFor(row, col)));
        if (submitted.some(({ row, col }) => !wordKeys.has(keyFor(row, col)))) {
            return { error: "Keep every new tile together in one unbroken line." };
        }

        const occupiedKeys = Object.keys(boardRef.current);
        if (occupiedKeys.length === 0) {
            const crossesCenter = wordData.coordinates.some(({ row, col }) => row === CENTER && col === CENTER);
            if (!crossesCenter) return { error: "The first word must cross the center Scripture star." };
        } else {
            const touchesBoard = submitted.some(({ row, col }) =>
                [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
                    .some(([nextRow, nextCol]) => boardRef.current[keyFor(nextRow, nextCol)])
            );
            if (!touchesBoard && wordData.coordinates.every(({ row, col }) => !boardRef.current[keyFor(row, col)])) {
                return { error: "Connect your word to a tile already on the board." };
            }
        }

        if (!BIBLE_WORDS.has(wordData.word)) {
            return { error: `“${wordData.word}” is not in the Bible word list yet.` };
        }

        let wordMultiplier = 1;
        let points = 0;
        wordData.coordinates.forEach(({ row, col }, index) => {
            const isNew = submitted.some((item) => item.row === row && item.col === col);
            let letterPoints = wordData.letters[index].points;
            if (isNew) {
                const bonus = BONUS_MAP[keyFor(row, col)];
                if (bonus === "DL") letterPoints *= 2;
                if (bonus === "TL") letterPoints *= 3;
                if (bonus === "DW" || bonus === "STAR") wordMultiplier *= 2;
                if (bonus === "TW") wordMultiplier *= 3;
            }
            points += letterPoints;
        });
        points *= wordMultiplier;
        if (submitted.length === RACK_SIZE) points += 25;

        return { wordData, points };
    };

    const hostSubmit = (playerId: string, submitted: Placement[]) => {
        if (playerId !== turnOrderRef.current[turnIndexRef.current]) return;
        const rackIds = new Set((racksRef.current[playerId] || []).map((tile) => tile.id));
        if (submitted.some((item) => !rackIds.has(item.tile.id) || boardRef.current[keyFor(item.row, item.col)])) return;

        const result = validatePlacement(submitted);
        if ("error" in result) {
            broadcast("scrabble_error", { playerId, message: result.error });
            if (playerId === currentUserId) setMessage(result.error || "That word cannot be played.");
            return;
        }

        clearTimer();
        submitted.forEach(({ row, col, tile }) => {
            boardRef.current[keyFor(row, col)] = { ...tile, ownerId: playerId, turn: turnNumberRef.current };
        });

        const usedIds = new Set(submitted.map((item) => item.tile.id));
        const keptRack = (racksRef.current[playerId] || []).filter((tile) => !usedIds.has(tile.id));
        const draw = drawTiles(bagRef.current, Math.min(RACK_SIZE - keptRack.length, bagRef.current.length));
        bagRef.current = draw.remaining;
        racksRef.current[playerId] = [...keptRack, ...draw.drawn];
        scoresRef.current[playerId] = (scoresRef.current[playerId] || 0) + result.points;

        sendRack(playerId);
        broadcast("scrabble_word", {
            word: result.wordData.word,
            points: result.points,
            playerId,
        });
        setLastWord(`${result.wordData.word} +${result.points}`);

        if (scoresRef.current[playerId] >= MAX_SCORE || (bagRef.current.length === 0 && racksRef.current[playerId].length === 0)) {
            const winner = Object.entries(scoresRef.current).sort((a, b) => b[1] - a[1])[0]?.[0] || playerId;
            setWinnerId(winner);
            broadcast("scrabble_game_over", { winnerId: winner, scores: scoresRef.current, board: boardRef.current });
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 } });
            return;
        }

        hostEndTurn(`${getName(room.members, playerId)} played ${result.wordData.word} for ${result.points} points.`);
    };

    useEffect(() => {
        const channel = supabase.channel(`bible_scrabble:${room.id}`);
        channel
            .on("broadcast", { event: "scrabble_state" }, ({ payload }) => {
                setBoard(payload.board);
                setScores(payload.scores);
                setTurnOrder(payload.turnOrder);
                setCurrentTurnId(payload.currentTurnId);
                setBagCount(payload.bagCount);
                setMessage(payload.message);
                setPlacements([]);
                setSelectedTileId(null);
            })
            .on("broadcast", { event: "scrabble_rack" }, ({ payload }) => {
                if (payload.playerId === currentUserId) setRack(payload.rack);
            })
            .on("broadcast", { event: "scrabble_timer" }, ({ payload }) => setTimer(payload.seconds))
            .on("broadcast", { event: "scrabble_error" }, ({ payload }) => {
                if (payload.playerId === currentUserId) setMessage(payload.message);
            })
            .on("broadcast", { event: "scrabble_word" }, ({ payload }) => {
                setLastWord(`${payload.word} +${payload.points}`);
            })
            .on("broadcast", { event: "scrabble_game_over" }, ({ payload }) => {
                setWinnerId(payload.winnerId);
                setScores(payload.scores);
                setBoard(payload.board);
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.65 } });
            })
            .on("broadcast", { event: "scrabble_submit_request" }, ({ payload }) => {
                if (isHost) hostSubmit(payload.playerId, payload.placements);
            })
            .on("broadcast", { event: "scrabble_pass_request" }, ({ payload }) => {
                if (isHost && payload.playerId === turnOrderRef.current[turnIndexRef.current]) {
                    hostEndTurn(`${getName(room.members, payload.playerId)} passed.`);
                }
            })
            .on("broadcast", { event: "scrabble_sync_request" }, ({ payload }) => {
                if (!isHost || turnOrderRef.current.length === 0) return;
                hostBroadcastState("Board restored — keep growing the word garden.");
                sendRack(payload.playerId);
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED" && !isHost) {
                    channel.send({
                        type: "broadcast",
                        event: "scrabble_sync_request",
                        payload: { playerId: currentUserId },
                    });
                }
            });

        channelRef.current = channel;
        return () => {
            clearTimer();
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    useEffect(() => {
        if (!isHost) return;
        const timerId = setTimeout(hostInit, 1000);
        return () => clearTimeout(timerId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, room.members]);

    const isMyTurn = currentTurnId === currentUserId;
    const selectedTile = rack.find((tile) => tile.id === selectedTileId);
    const previewBoard = useMemo(() => {
        const next: Record<string, Tile | BoardTile> = { ...board };
        placements.forEach((placement) => { next[keyFor(placement.row, placement.col)] = placement.tile; });
        return next;
    }, [board, placements]);

    const placeTile = (row: number, col: number) => {
        if (!isMyTurn || !selectedTile || board[keyFor(row, col)] || placements.some((item) => item.row === row && item.col === col)) return;
        setPlacements((current) => [...current, { row, col, tile: selectedTile }]);
        setSelectedTileId(null);
        setMessage("Lovely. Keep building, or submit your word.");
    };

    const recallTiles = () => {
        setPlacements([]);
        setSelectedTileId(null);
        setMessage("Tiles returned to your rack.");
    };

    const submitWord = () => {
        if (!isMyTurn || placements.length === 0) return;
        if (isHost) hostSubmit(currentUserId, placements);
        else broadcast("scrabble_submit_request", { playerId: currentUserId, placements });
    };

    const passTurn = () => {
        if (!isMyTurn) return;
        recallTiles();
        if (isHost) hostEndTurn(`${getName(room.members, currentUserId)} passed.`);
        else broadcast("scrabble_pass_request", { playerId: currentUserId });
    };

    if (winnerId) {
        return (
            <div className="rounded-[2rem] border border-amber-200/70 bg-gradient-to-b from-[#fffaf0] to-[#f3dfb3] p-7 text-center shadow-xl">
                <TrophyIcon />
                <h2 className="font-serif text-2xl font-bold text-[#5c422d]">Word Garden Complete!</h2>
                <p className="mt-1 text-sm font-bold text-amber-800">{getName(room.members, winnerId)} wins Bible Scrabble ✨</p>
                <div className="mx-auto mt-5 max-w-xs space-y-2">
                    {Object.entries(scores).sort((a, b) => b[1] - a[1]).map(([id, score], index) => (
                        <div key={id} className="flex items-center rounded-xl border border-amber-200/60 bg-white/70 px-4 py-2 text-xs font-bold text-[#634a35]">
                            <span className="mr-3">{index === 0 ? "👑" : `#${index + 1}`}</span>
                            <span className="flex-1 text-left">{getName(room.members, id)}</span>
                            <span>{score} pts</span>
                        </div>
                    ))}
                </div>
                {isHost && (
                    <div className="mt-5 flex flex-col gap-2">
                        <button onClick={hostInit} className="flex items-center justify-center gap-2 rounded-xl bg-[#5c422d] py-3 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" /> Play Again</button>
                        <button onClick={onGameEnd} className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-800"><Shuffle className="h-4 w-4" /> Choose Another Game</button>
                        <button onClick={onCloseRoom} className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700"><LogOut className="h-4 w-4" /> Close Room</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full rounded-[2rem] border border-[#cab58d]/60 bg-gradient-to-b from-[#f5ecd9] via-[#e9dcc1] to-[#d8c39d] p-2.5 shadow-[0_20px_50px_rgba(62,44,25,.18)] sm:p-4">
            <style>{`
                @keyframes scrabble-glow { 0%,100% { box-shadow: 0 0 0 rgba(250,204,21,0); } 50% { box-shadow: 0 0 18px rgba(250,204,21,.65); } }
                .scrabble-star { animation: scrabble-glow 2.6s ease-in-out infinite; }
            `}</style>

            <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-[#d8c49c] bg-[#fffaf0]/90 px-3 py-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-lg text-white shadow-md">📖</div>
                    <div>
                        <h2 className="font-serif text-sm font-bold text-[#5a402b]">Bible Scrabble</h2>
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#927653]">Grow words of faith</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-[#6c553e]">{isMyTurn ? "Your turn" : `${getName(room.members, currentTurnId)}’s turn`}</p>
                    <p className={`text-xs font-black tabular-nums ${timer <= 10 ? "text-rose-600 animate-pulse" : "text-emerald-700"}`}>{timer}s · {bagCount} tiles</p>
                </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {turnOrder.map((id) => (
                    <div key={id} className={`rounded-xl border px-2.5 py-2 ${id === currentTurnId ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200" : "border-[#d8c6a6] bg-white/60"}`}>
                        <p className="truncate text-[9px] font-bold text-[#684d35]">{getName(room.members, id)}{id === currentUserId ? " (You)" : ""}</p>
                        <p className="font-serif text-lg font-bold text-emerald-800">{scores[id] || 0}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-[1.5rem] border-[5px] border-[#714d2e] bg-gradient-to-br from-[#9b7446] to-[#5a3924] p-2 shadow-[0_15px_30px_rgba(45,29,16,.32),inset_0_0_0_2px_rgba(255,231,181,.25)]">
                <div className="grid grid-cols-11 gap-[2px] rounded-lg bg-[#305f4b] p-[3px] shadow-inner">
                    {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
                        const row = Math.floor(index / BOARD_SIZE);
                        const col = index % BOARD_SIZE;
                        const squareKey = keyFor(row, col);
                        const tile = previewBoard[squareKey];
                        const bonus = BONUS_MAP[squareKey] || null;
                        const isPreview = placements.some((item) => item.row === row && item.col === col);
                        return (
                            <button
                                key={squareKey}
                                onClick={() => placeTile(row, col)}
                                disabled={!!tile && !isPreview}
                                className={`relative aspect-square min-w-0 rounded-[3px] border border-black/10 ${tile ? "bg-transparent" : bonusClasses(bonus)} ${bonus === "STAR" ? "scrabble-star" : ""}`}
                                aria-label={`Board row ${row + 1}, column ${col + 1}`}
                            >
                                {tile ? (
                                    <motion.div
                                        initial={isPreview ? { scale: 0.6, rotate: -8 } : false}
                                        animate={{ scale: 1, rotate: 0 }}
                                        className={`absolute inset-[1px] flex items-center justify-center rounded-[3px] border border-[#b39159] bg-gradient-to-br from-[#fff3cf] via-[#ecd29b] to-[#cfa76a] shadow-[0_2px_3px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.8)] ${isPreview ? "ring-2 ring-amber-300" : ""}`}
                                    >
                                        <span className="font-serif text-[8px] font-black text-[#4d3825] sm:text-xs">{tile.letter}</span>
                                        <span className="absolute bottom-0.5 right-0.5 text-[4px] font-black text-[#705337] sm:text-[5px]">{tile.points}</span>
                                    </motion.div>
                                ) : (
                                    <span className="text-[4px] font-black leading-none sm:text-[6px]">
                                        {bonus === "STAR" ? "✦" : bonus || ""}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={message} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="my-3 rounded-xl border border-[#d7c49f] bg-[#fff9ea]/90 px-3 py-2 text-center text-[10px] font-bold text-[#71583e]">
                    {lastWord && <span className="mr-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{lastWord}</span>}
                    {message}
                </motion.div>
            </AnimatePresence>

            <div className="rounded-2xl border border-[#c8ad7f] bg-gradient-to-b from-[#82603d] to-[#5f412b] p-2.5 shadow-inner">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#f5e4bc]">Your letter rack</p>
                    <p className="text-[8px] font-bold text-[#ead7ad]">{isMyTurn ? "Tap a tile to select it" : "Waiting for your turn"}</p>
                </div>
                <div className="flex min-h-14 items-center justify-center gap-1.5">
                    {rack.map((tile) => {
                        const isPlaced = placements.some((item) => item.tile.id === tile.id);
                        return (
                            <button
                                key={tile.id}
                                onClick={() => !isPlaced && isMyTurn && setSelectedTileId(tile.id === selectedTileId ? null : tile.id)}
                                disabled={isPlaced || !isMyTurn}
                                className={`relative flex h-11 w-10 items-center justify-center rounded-md border font-serif text-lg font-black transition-all sm:h-12 sm:w-11 ${
                                    isPlaced
                                        ? "translate-y-2 border-[#725132] bg-[#513722] text-transparent opacity-25"
                                        : selectedTileId === tile.id
                                            ? "-translate-y-2 border-amber-300 bg-[#fff1be] text-[#4d3825] ring-2 ring-amber-300 shadow-lg"
                                            : "border-[#b58d54] bg-gradient-to-br from-[#fff4d4] to-[#d4ad70] text-[#4d3825] shadow-[0_4px_0_#3e291b]"
                                }`}
                            >
                                {tile.letter}
                                <span className="absolute bottom-0.5 right-1 text-[6px]">{tile.points}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={recallTiles} disabled={!isMyTurn || placements.length === 0} className="rounded-xl border border-[#d5c09b] bg-white/70 py-2.5 text-[10px] font-bold text-[#70563d] disabled:opacity-40">Recall</button>
                <button onClick={passTurn} disabled={!isMyTurn} className="rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-[10px] font-bold text-rose-700 disabled:opacity-40">Pass</button>
                <button onClick={submitWord} disabled={!isMyTurn || placements.length === 0} className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-800 py-2.5 text-[10px] font-bold text-white shadow-md disabled:opacity-40"><Sparkles className="h-3 w-3" /> Submit</button>
            </div>
        </div>
    );
}

function TrophyIcon() {
    return (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-3xl shadow-md">
            📖
        </div>
    );
}
