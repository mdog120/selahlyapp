"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    BOARD,
    BOARD_SIZE,
    SCRIPTURE_CARDS,
    PLAYER_TOKENS,
    COLOR_GROUPS,
    STARTING_MONEY,
    GO_BONUS,
    TITHE_AMOUNT,
    MAX_ROUNDS,
    BoardSpace,
    PropertySpace,
    ScriptureCard,
} from "./boardData";
import { Trophy, RotateCcw, Shuffle, LogOut, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ─── Types ──────────────────────────────────────────────────

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

interface BibleMonopolyProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
    onCloseRoom: () => void;
}

type Phase = "rolling" | "landed" | "game_over";

interface PlayerState {
    id: string;
    position: number;
    money: number;
    token: number; // index into PLAYER_TOKENS
    properties: string[]; // property names owned
    bankrupt: boolean;
    skipNextTurn: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

function isPropertySpace(space: BoardSpace): space is PropertySpace {
    return space.type === "property";
}

function getColorGroupProperties(colorKey: string): string[] {
    return COLOR_GROUPS[colorKey]?.properties || [];
}

function ownsFullColorGroup(playerProps: string[], colorKey: string): boolean {
    const group = getColorGroupProperties(colorKey);
    return group.length > 0 && group.every((p) => playerProps.includes(p));
}

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const TURN_TIMER = 30;

// ─── Component ──────────────────────────────────────────────

export function BibleMonopoly({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: BibleMonopolyProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state in refs (host source of truth) ──
    const playersRef = useRef<Record<string, PlayerState>>({});
    const turnOrderRef = useRef<string[]>([]);
    const currentTurnIndexRef = useRef(0);
    const roundRef = useRef(1);
    const potRef = useRef(0);
    const propertyOwnersRef = useRef<Record<string, string>>({}); // propertyName -> playerId
    const scriptureCardsRef = useRef<ScriptureCard[]>([]);
    const scriptureIndexRef = useRef(0);
    const phaseRef = useRef<Phase>("rolling");
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const turnTimerRef = useRef(TURN_TIMER);
    const pendingLandRef = useRef<{
        space: BoardSpace;
        spaceIndex: number;
        scriptureCard?: ScriptureCard;
    } | null>(null);

    // ─── Display state (for rendering) ──
    const [phase, setPhase] = useState<Phase>("rolling");
    const [players, setPlayers] = useState<Record<string, PlayerState>>({});
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState("");
    const [round, setRound] = useState(1);
    const [pot, setPot] = useState(0);
    const [propertyOwners, setPropertyOwners] = useState<Record<string, string>>({});
    const [timer, setTimer] = useState(TURN_TIMER);

    // Dice display
    const [dice, setDice] = useState<[number, number]>([1, 1]);
    const [diceRolling, setDiceRolling] = useState(false);

    // Action panel state
    const [statusMessage, setStatusMessage] = useState("");
    const [showBuyPrompt, setShowBuyPrompt] = useState(false);
    const [buyPropertyInfo, setBuyPropertyInfo] = useState<PropertySpace | null>(null);
    const [showScriptureCard, setShowScriptureCard] = useState<ScriptureCard | null>(null);

    // Game over
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [finalStandings, setFinalStandings] = useState<{ id: string; money: number }[]>([]);

    // ─── Broadcast helper ──
    const broadcast = useCallback((event: string, payload: any) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function hostInitGame() {
        const order = shuffleArray(room.members.map((m) => m.user_id));
        turnOrderRef.current = order;

        const playerStates: Record<string, PlayerState> = {};
        order.forEach((id, idx) => {
            playerStates[id] = {
                id,
                position: 0,
                money: STARTING_MONEY,
                token: idx % PLAYER_TOKENS.length,
                properties: [],
                bankrupt: false,
                skipNextTurn: false,
            };
        });
        playersRef.current = playerStates;
        currentTurnIndexRef.current = 0;
        roundRef.current = 1;
        potRef.current = 0;
        propertyOwnersRef.current = {};
        scriptureCardsRef.current = shuffleArray([...SCRIPTURE_CARDS]);
        scriptureIndexRef.current = 0;
        phaseRef.current = "rolling";

        const payload = {
            players: playerStates,
            turnOrder: order,
            currentTurnPlayerId: order[0],
            round: 1,
            pot: 0,
            propertyOwners: {},
        };

        broadcast("bm_game_init", payload);
        applyDisplayState(payload);
        hostStartTurnTimer();
    }

    function applyDisplayState(payload: {
        players: Record<string, PlayerState>;
        turnOrder: string[];
        currentTurnPlayerId: string;
        round: number;
        pot: number;
        propertyOwners: Record<string, string>;
    }) {
        setPlayers({ ...payload.players });
        setTurnOrder([...payload.turnOrder]);
        setCurrentTurnPlayerId(payload.currentTurnPlayerId);
        setRound(payload.round);
        setPot(payload.pot);
        setPropertyOwners({ ...payload.propertyOwners });
        setPhase("rolling");
        setShowBuyPrompt(false);
        setBuyPropertyInfo(null);
        setShowScriptureCard(null);
        setStatusMessage("");
    }

    function hostStartTurnTimer() {
        hostClearTimer();
        turnTimerRef.current = TURN_TIMER;
        setTimer(TURN_TIMER);

        timerIntervalRef.current = setInterval(() => {
            turnTimerRef.current -= 1;
            const t = turnTimerRef.current;
            setTimer(t);
            broadcast("bm_timer", { timeLeft: t });
            if (t <= 0) {
                hostClearTimer();
                // Auto-pass: end turn without rolling
                hostEndTurn();
            }
        }, 1000);
    }

    function hostClearTimer() {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }

    function hostProcessRoll(playerId: string) {
        const currentPlayer = turnOrderRef.current[currentTurnIndexRef.current];
        if (playerId !== currentPlayer) return;
        if (phaseRef.current !== "rolling") return;

        const p = playersRef.current[playerId];
        if (!p || p.bankrupt) return;

        // Check skip turn
        if (p.skipNextTurn) {
            p.skipNextTurn = false;
            playersRef.current[playerId] = { ...p };

            const msg = `${getMemberName(room.members, playerId)} is resting in the wilderness. Turn skipped!`;
            broadcast("bm_roll_result", {
                playerId,
                die1: 0,
                die2: 0,
                newPosition: p.position,
                skipped: true,
                message: msg,
                players: playersRef.current,
            });
            setStatusMessage(msg);
            setDice([1, 1]);

            setTimeout(() => hostEndTurn(), 2000);
            return;
        }

        hostClearTimer();
        phaseRef.current = "landed";

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;
        const oldPos = p.position;
        const newPos = (oldPos + total) % BOARD_SIZE;
        const passedGo = newPos < oldPos && oldPos !== 0; // wrapped around

        // Award GO bonus
        if (passedGo) {
            p.money += GO_BONUS;
        }

        p.position = newPos;
        playersRef.current[playerId] = { ...p };

        const space = BOARD[newPos];
        const goMsg = passedGo ? ` Passed GO — collected ${GO_BONUS} shekels!` : "";

        broadcast("bm_roll_result", {
            playerId,
            die1,
            die2,
            newPosition: newPos,
            skipped: false,
            message: `Rolled ${die1} + ${die2} = ${total}.${goMsg}`,
            players: playersRef.current,
        });

        setDice([die1, die2]);
        setDiceRolling(true);
        setTimeout(() => {
            setDiceRolling(false);
            setPlayers({ ...playersRef.current });
        }, 600);

        // Process landing after dice animation
        setTimeout(() => {
            hostProcessLanding(playerId, space, newPos);
        }, 800);
    }

    function hostProcessLanding(playerId: string, space: BoardSpace, spaceIndex: number) {
        const p = playersRef.current[playerId];
        if (!p) return;

        if (space.type === "go") {
            // Landed exactly on GO — bonus already handled if passed
            const msg = `Landed on GO! ⭐`;
            broadcastLandAction(playerId, msg, false);
            setTimeout(() => hostEndTurn(), 2000);
        } else if (space.type === "property") {
            const owner = propertyOwnersRef.current[space.name];
            if (!owner) {
                // Unowned — offer to buy
                if (p.money >= space.cost) {
                    pendingLandRef.current = { space, spaceIndex };
                    const msg = `Landed on ${space.emoji} ${space.name} (${space.cost} shekels). Buy it?`;
                    broadcast("bm_land_action", {
                        playerId,
                        message: msg,
                        canBuy: true,
                        property: space,
                        players: playersRef.current,
                        pot: potRef.current,
                        propertyOwners: propertyOwnersRef.current,
                    });
                    setStatusMessage(msg);
                    if (playerId === currentUserId) {
                        setShowBuyPrompt(true);
                        setBuyPropertyInfo(space);
                    }
                    setPlayers({ ...playersRef.current });
                    // Start buy timer — auto-pass after 15s
                    hostStartBuyTimer(playerId);
                } else {
                    const msg = `Landed on ${space.emoji} ${space.name} but can't afford it (${space.cost} shekels).`;
                    broadcastLandAction(playerId, msg, false);
                    setTimeout(() => hostEndTurn(), 2000);
                }
            } else if (owner === playerId) {
                const msg = `Landed on your own property: ${space.emoji} ${space.name}.`;
                broadcastLandAction(playerId, msg, false);
                setTimeout(() => hostEndTurn(), 2000);
            } else {
                // Pay rent
                const ownerPlayer = playersRef.current[owner];
                if (!ownerPlayer || ownerPlayer.bankrupt) {
                    const msg = `Landed on ${space.emoji} ${space.name} (owner is bankrupt — no rent).`;
                    broadcastLandAction(playerId, msg, false);
                    setTimeout(() => hostEndTurn(), 2000);
                    return;
                }

                let rent = space.rent;
                // Double rent if owner has full color group
                if (ownsFullColorGroup(ownerPlayer.properties, space.color)) {
                    rent *= 2;
                }

                p.money -= rent;
                ownerPlayer.money += rent;

                const ownerName = getMemberName(room.members, owner);
                const payerName = getMemberName(room.members, playerId);

                playersRef.current[playerId] = { ...p };
                playersRef.current[owner] = { ...ownerPlayer };

                // Check bankruptcy
                if (p.money < 0) {
                    p.bankrupt = true;
                    // Transfer properties to the bank
                    p.properties.forEach((propName) => {
                        delete propertyOwnersRef.current[propName];
                    });
                    p.properties = [];
                    playersRef.current[playerId] = { ...p };

                    const msg = `${payerName} paid ${rent} shekels rent to ${ownerName} and went bankrupt! 💸`;
                    broadcast("bm_bankrupt", {
                        playerId,
                        message: msg,
                        players: playersRef.current,
                        propertyOwners: propertyOwnersRef.current,
                    });
                    setStatusMessage(msg);
                    setPlayers({ ...playersRef.current });
                    setPropertyOwners({ ...propertyOwnersRef.current });

                    // Check if game over
                    if (hostCheckGameOver()) return;
                    setTimeout(() => hostEndTurn(), 2500);
                } else {
                    const doubleMsg = ownsFullColorGroup(ownerPlayer.properties, space.color) ? " (doubled!)" : "";
                    const msg = `${payerName} paid ${rent}${doubleMsg} shekels rent to ${ownerName}!`;
                    broadcastLandAction(playerId, msg, false);
                    setTimeout(() => hostEndTurn(), 2500);
                }
            }
        } else if (space.type === "scripture_card") {
            const card = hostDrawScriptureCard();
            pendingLandRef.current = { space, spaceIndex, scriptureCard: card };
            hostProcessScriptureCard(playerId, card);
        } else if (space.type === "tithe") {
            p.money -= TITHE_AMOUNT;
            potRef.current += TITHE_AMOUNT;
            playersRef.current[playerId] = { ...p };

            if (p.money < 0) {
                p.bankrupt = true;
                p.properties.forEach((propName) => {
                    delete propertyOwnersRef.current[propName];
                });
                p.properties = [];
                playersRef.current[playerId] = { ...p };

                const msg = `Paid tithe of ${TITHE_AMOUNT} shekels and went bankrupt! 💰`;
                broadcast("bm_bankrupt", {
                    playerId,
                    message: msg,
                    players: playersRef.current,
                    propertyOwners: propertyOwnersRef.current,
                    pot: potRef.current,
                });
                setStatusMessage(msg);
                setPlayers({ ...playersRef.current });
                setPot(potRef.current);
                setPropertyOwners({ ...propertyOwnersRef.current });

                if (hostCheckGameOver()) return;
                setTimeout(() => hostEndTurn(), 2000);
            } else {
                const msg = `Paid tithe of ${TITHE_AMOUNT} shekels to the pot. 💰`;
                broadcastLandAction(playerId, msg, false);
                setTimeout(() => hostEndTurn(), 2000);
            }
        } else if (space.type === "free_parking") {
            const collected = potRef.current;
            if (collected > 0) {
                p.money += collected;
                potRef.current = 0;
                playersRef.current[playerId] = { ...p };
                const msg = `Free Parking! Collected ${collected} shekels from the pot! 🅿️`;
                broadcastLandAction(playerId, msg, false);
            } else {
                const msg = `Free Parking! Nothing in the pot. 🅿️`;
                broadcastLandAction(playerId, msg, false);
            }
            setTimeout(() => hostEndTurn(), 2000);
        } else if (space.type === "wilderness") {
            p.skipNextTurn = true;
            playersRef.current[playerId] = { ...p };
            const msg = `Entered the Wilderness. 🏜️ Must rest — skip next turn!`;
            broadcastLandAction(playerId, msg, false);
            setTimeout(() => hostEndTurn(), 2000);
        }
    }

    function broadcastLandAction(playerId: string, message: string, canBuy: boolean) {
        broadcast("bm_land_action", {
            playerId,
            message,
            canBuy,
            property: null,
            players: playersRef.current,
            pot: potRef.current,
            propertyOwners: propertyOwnersRef.current,
        });
        setStatusMessage(message);
        setPlayers({ ...playersRef.current });
        setPot(potRef.current);
        setPropertyOwners({ ...propertyOwnersRef.current });
    }

    function hostDrawScriptureCard(): ScriptureCard {
        const cards = scriptureCardsRef.current;
        const idx = scriptureIndexRef.current % cards.length;
        scriptureIndexRef.current = idx + 1;
        return cards[idx];
    }

    function hostProcessScriptureCard(playerId: string, card: ScriptureCard) {
        const p = playersRef.current[playerId];
        if (!p) return;

        let msg = `📜 Scripture Card: ${card.text}`;

        switch (card.action) {
            case "receive": {
                p.money += card.amount || 0;
                playersRef.current[playerId] = { ...p };
                break;
            }
            case "pay": {
                const amount = card.amount || 0;
                p.money -= amount;
                potRef.current += amount;
                playersRef.current[playerId] = { ...p };

                if (p.money < 0) {
                    p.bankrupt = true;
                    p.properties.forEach((propName) => {
                        delete propertyOwnersRef.current[propName];
                    });
                    p.properties = [];
                    playersRef.current[playerId] = { ...p };
                }
                break;
            }
            case "move_to": {
                const dest = card.destination ?? 0;
                const passedGo = dest <= p.position && dest !== p.position;
                p.position = dest;
                if (passedGo && card.amount) {
                    p.money += card.amount;
                } else if (passedGo) {
                    p.money += GO_BONUS;
                }
                playersRef.current[playerId] = { ...p };
                break;
            }
            case "move_forward": {
                const spaces = card.spaces || 0;
                const oldPos = p.position;
                const newPos = (oldPos + spaces) % BOARD_SIZE;
                const passedGo = newPos < oldPos;
                if (passedGo) {
                    p.money += GO_BONUS;
                }
                p.position = newPos;
                playersRef.current[playerId] = { ...p };
                break;
            }
            case "skip_turn": {
                p.skipNextTurn = true;
                playersRef.current[playerId] = { ...p };
                break;
            }
            case "collect_from_each": {
                const amount = card.amount || 0;
                const order = turnOrderRef.current;
                order.forEach((otherId) => {
                    if (otherId === playerId) return;
                    const other = playersRef.current[otherId];
                    if (!other || other.bankrupt) return;
                    other.money -= amount;
                    p.money += amount;
                    if (other.money < 0) {
                        other.bankrupt = true;
                        other.properties.forEach((propName) => {
                            delete propertyOwnersRef.current[propName];
                        });
                        other.properties = [];
                    }
                    playersRef.current[otherId] = { ...other };
                });
                playersRef.current[playerId] = { ...p };
                break;
            }
        }

        broadcast("bm_land_action", {
            playerId,
            message: msg,
            canBuy: false,
            property: null,
            scriptureCard: card,
            players: playersRef.current,
            pot: potRef.current,
            propertyOwners: propertyOwnersRef.current,
        });

        setStatusMessage(msg);
        setShowScriptureCard(card);
        setPlayers({ ...playersRef.current });
        setPot(potRef.current);
        setPropertyOwners({ ...propertyOwnersRef.current });

        if (p.bankrupt) {
            broadcast("bm_bankrupt", {
                playerId,
                message: `${getMemberName(room.members, playerId)} went bankrupt from a Scripture Card! 💸`,
                players: playersRef.current,
                propertyOwners: propertyOwnersRef.current,
            });
            if (hostCheckGameOver()) return;
        }

        setTimeout(() => hostEndTurn(), 3000);
    }

    function hostStartBuyTimer(playerId: string) {
        hostClearTimer();
        turnTimerRef.current = 15;
        setTimer(15);
        timerIntervalRef.current = setInterval(() => {
            turnTimerRef.current -= 1;
            const t = turnTimerRef.current;
            setTimer(t);
            broadcast("bm_timer", { timeLeft: t });
            if (t <= 0) {
                hostClearTimer();
                hostProcessPassProperty(playerId);
            }
        }, 1000);
    }

    function hostProcessBuyProperty(playerId: string) {
        const pending = pendingLandRef.current;
        if (!pending || !isPropertySpace(pending.space)) return;

        hostClearTimer();

        const p = playersRef.current[playerId];
        if (!p) return;

        const space = pending.space;
        p.money -= space.cost;
        p.properties.push(space.name);
        propertyOwnersRef.current[space.name] = playerId;
        playersRef.current[playerId] = { ...p };
        pendingLandRef.current = null;

        const playerName = getMemberName(room.members, playerId);
        const msg = `${playerName} bought ${space.emoji} ${space.name} for ${space.cost} shekels!`;

        broadcast("bm_buy_property", {
            playerId,
            propertyName: space.name,
            message: msg,
            players: playersRef.current,
            propertyOwners: propertyOwnersRef.current,
            pot: potRef.current,
        });

        setStatusMessage(msg);
        setShowBuyPrompt(false);
        setBuyPropertyInfo(null);
        setPlayers({ ...playersRef.current });
        setPropertyOwners({ ...propertyOwnersRef.current });

        setTimeout(() => hostEndTurn(), 1500);
    }

    function hostProcessPassProperty(playerId: string) {
        hostClearTimer();
        pendingLandRef.current = null;

        const playerName = getMemberName(room.members, playerId);
        const msg = `${playerName} passed on buying the property.`;

        broadcast("bm_pass_property", {
            playerId,
            message: msg,
            players: playersRef.current,
        });

        setStatusMessage(msg);
        setShowBuyPrompt(false);
        setBuyPropertyInfo(null);

        setTimeout(() => hostEndTurn(), 1500);
    }

    function hostEndTurn() {
        hostClearTimer();
        pendingLandRef.current = null;

        const order = turnOrderRef.current;
        const activePlayers = order.filter((id) => !playersRef.current[id]?.bankrupt);

        if (activePlayers.length <= 1) {
            hostGameOver();
            return;
        }

        // Move to next active player
        let nextIdx = (currentTurnIndexRef.current + 1) % order.length;
        let safety = 0;
        while (playersRef.current[order[nextIdx]]?.bankrupt && safety < order.length) {
            nextIdx = (nextIdx + 1) % order.length;
            safety++;
        }

        // Track rounds — a round completes when we wrap back past index 0
        if (nextIdx <= currentTurnIndexRef.current) {
            roundRef.current += 1;
            if (roundRef.current > MAX_ROUNDS) {
                hostGameOver();
                return;
            }
        }

        currentTurnIndexRef.current = nextIdx;
        phaseRef.current = "rolling";

        const nextPlayerId = order[nextIdx];

        broadcast("bm_turn_end", {
            currentTurnPlayerId: nextPlayerId,
            round: roundRef.current,
            players: playersRef.current,
            pot: potRef.current,
            propertyOwners: propertyOwnersRef.current,
        });

        setCurrentTurnPlayerId(nextPlayerId);
        setRound(roundRef.current);
        setPhase("rolling");
        setPlayers({ ...playersRef.current });
        setPot(potRef.current);
        setPropertyOwners({ ...propertyOwnersRef.current });
        setShowBuyPrompt(false);
        setBuyPropertyInfo(null);
        setShowScriptureCard(null);
        setStatusMessage("");

        hostStartTurnTimer();
    }

    function hostCheckGameOver(): boolean {
        const order = turnOrderRef.current;
        const activePlayers = order.filter((id) => !playersRef.current[id]?.bankrupt);
        if (activePlayers.length <= 1) {
            hostGameOver();
            return true;
        }
        return false;
    }

    function hostGameOver() {
        hostClearTimer();
        phaseRef.current = "game_over";

        const allPlayers = Object.values(playersRef.current);
        const standings = allPlayers
            .map((p) => ({
                id: p.id,
                money: p.bankrupt ? 0 : p.money + p.properties.reduce((sum, propName) => {
                    const space = BOARD.find((s) => s.type === "property" && s.name === propName) as PropertySpace | undefined;
                    return sum + (space?.cost || 0);
                }, 0),
            }))
            .sort((a, b) => b.money - a.money);

        const winner = standings[0]?.id || "";

        broadcast("bm_game_over", {
            winnerId: winner,
            standings,
            players: playersRef.current,
        });

        setPhase("game_over");
        setWinnerId(winner);
        setFinalStandings(standings);
        setPlayers({ ...playersRef.current });
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // ═══════════════════════════════════════════════════════
    // SINGLE CHANNEL SETUP — ALL listeners registered ONCE
    // ═══════════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase.channel(`bible_monopoly:${room.id}`);

        channel
            .on("broadcast", { event: "bm_game_init" }, ({ payload }) => {
                setPlayers(payload.players);
                setTurnOrder(payload.turnOrder);
                setCurrentTurnPlayerId(payload.currentTurnPlayerId);
                setRound(payload.round);
                setPot(payload.pot);
                setPropertyOwners(payload.propertyOwners);
                setPhase("rolling");
                setStatusMessage("");
                setShowBuyPrompt(false);
                setBuyPropertyInfo(null);
                setShowScriptureCard(null);
                setWinnerId(null);
                setFinalStandings([]);
            })
            .on("broadcast", { event: "bm_timer" }, ({ payload }) => {
                if (!isHost) {
                    setTimer(payload.timeLeft);
                }
            })
            .on("broadcast", { event: "bm_roll_result" }, ({ payload }) => {
                if (!isHost) {
                    setDice([payload.die1 || 1, payload.die2 || 1]);
                    if (!payload.skipped) {
                        setDiceRolling(true);
                        setTimeout(() => setDiceRolling(false), 600);
                    }
                    setPlayers(payload.players);
                    setStatusMessage(payload.message);
                }
            })
            .on("broadcast", { event: "bm_land_action" }, ({ payload }) => {
                if (!isHost) {
                    setStatusMessage(payload.message);
                    setPlayers(payload.players);
                    setPot(payload.pot);
                    setPropertyOwners(payload.propertyOwners);
                    if (payload.canBuy && payload.playerId === currentUserId) {
                        setShowBuyPrompt(true);
                        setBuyPropertyInfo(payload.property);
                    }
                    if (payload.scriptureCard) {
                        setShowScriptureCard(payload.scriptureCard);
                    }
                    if (!payload.canBuy) {
                        setPhase("landed");
                    }
                }
            })
            .on("broadcast", { event: "bm_buy_property" }, ({ payload }) => {
                if (!isHost) {
                    setStatusMessage(payload.message);
                    setPlayers(payload.players);
                    setPropertyOwners(payload.propertyOwners);
                    setPot(payload.pot);
                    setShowBuyPrompt(false);
                    setBuyPropertyInfo(null);
                }
            })
            .on("broadcast", { event: "bm_pass_property" }, ({ payload }) => {
                if (!isHost) {
                    setStatusMessage(payload.message);
                    setPlayers(payload.players);
                    setShowBuyPrompt(false);
                    setBuyPropertyInfo(null);
                }
            })
            .on("broadcast", { event: "bm_turn_end" }, ({ payload }) => {
                if (!isHost) {
                    setCurrentTurnPlayerId(payload.currentTurnPlayerId);
                    setRound(payload.round);
                    setPlayers(payload.players);
                    setPot(payload.pot);
                    setPropertyOwners(payload.propertyOwners);
                    setPhase("rolling");
                    setShowBuyPrompt(false);
                    setBuyPropertyInfo(null);
                    setShowScriptureCard(null);
                    setStatusMessage("");
                }
            })
            .on("broadcast", { event: "bm_bankrupt" }, ({ payload }) => {
                if (!isHost) {
                    setStatusMessage(payload.message);
                    setPlayers(payload.players);
                    setPropertyOwners(payload.propertyOwners);
                    if (payload.pot !== undefined) setPot(payload.pot);
                }
            })
            .on("broadcast", { event: "bm_game_over" }, ({ payload }) => {
                setPhase("game_over");
                setWinnerId(payload.winnerId);
                setFinalStandings(payload.standings);
                setPlayers(payload.players);
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            })
            // HOST ONLY: process requests from other players
            .on("broadcast", { event: "bm_player_roll" }, ({ payload }) => {
                if (!isHost) return;
                hostProcessRoll(payload.playerId);
            })
            .on("broadcast", { event: "bm_player_buy" }, ({ payload }) => {
                if (!isHost) return;
                hostProcessBuyProperty(payload.playerId);
            })
            .on("broadcast", { event: "bm_player_pass" }, ({ payload }) => {
                if (!isHost) return;
                hostProcessPassProperty(payload.playerId);
            })
            .subscribe();

        channelRef.current = channel;
        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    // ─── Host: Initialize and start game ──
    useEffect(() => {
        if (!isHost) return;

        const initTimer = setTimeout(() => {
            hostInitGame();
        }, 1000);

        return () => clearTimeout(initTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, room.members]);

    // ─── Client actions ──
    const handleRollDice = useCallback(() => {
        if (currentTurnPlayerId !== currentUserId) return;
        if (isHost) {
            hostProcessRoll(currentUserId);
        } else {
            broadcast("bm_player_roll", { playerId: currentUserId });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTurnPlayerId, currentUserId, isHost, broadcast]);

    const handleBuyProperty = useCallback(() => {
        if (isHost) {
            hostProcessBuyProperty(currentUserId);
        } else {
            broadcast("bm_player_buy", { playerId: currentUserId });
        }
        setShowBuyPrompt(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, isHost, broadcast]);

    const handlePassProperty = useCallback(() => {
        if (isHost) {
            hostProcessPassProperty(currentUserId);
        } else {
            broadcast("bm_player_pass", { playerId: currentUserId });
        }
        setShowBuyPrompt(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, isHost, broadcast]);

    const handlePlayAgain = useCallback(() => {
        hostInitGame();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    const isMyTurn = currentTurnPlayerId === currentUserId;
    const currentPlayerState = players[currentTurnPlayerId];
    const myPlayerState = players[currentUserId];

    // ─── Game Over Screen ──
    if (phase === "game_over") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center"
            >
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">
                    <Trophy className="w-8 h-8 text-amber-600" />
                </div>

                <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-1">
                    Game Over! 🎉
                </h2>
                {winnerId && (
                    <p className="text-sm font-bold text-amber-700 mb-1">
                        {PLAYER_TOKENS[players[winnerId]?.token || 0]?.emoji}{" "}
                        {getMemberName(room.members, winnerId)} wins!
                    </p>
                )}
                <p className="text-xs text-warm-grey/50 mb-6">
                    {round >= MAX_ROUNDS ? `${MAX_ROUNDS} rounds completed` : "Last player standing"}
                </p>

                {/* Final Standings */}
                <div className="space-y-2 mb-6 max-w-xs mx-auto">
                    {finalStandings.map((s, idx) => {
                        const p = players[s.id];
                        const token = PLAYER_TOKENS[p?.token || 0];
                        return (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                                    idx === 0
                                        ? "bg-amber-50 border border-amber-200/50"
                                        : p?.bankrupt
                                            ? "bg-stone-100/50 border border-stone-200/30 opacity-50"
                                            : "bg-white/60 border border-stone-200/30"
                                }`}
                            >
                                <span className="text-sm font-bold text-warm-grey/40 w-5">
                                    {idx === 0 ? "👑" : `#${idx + 1}`}
                                </span>
                                <span className="text-lg">{token?.emoji}</span>
                                <span className="flex-1 text-left text-xs font-bold text-warm-cocoa">
                                    {getMemberName(room.members, s.id)}
                                    {s.id === currentUserId && " (You)"}
                                </span>
                                <span className="text-sm font-bold text-warm-cocoa">
                                    {p?.bankrupt ? "💀" : `${s.money} ₪`}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {isHost && (
                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            onClick={handlePlayAgain}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                        >
                            <RotateCcw className="w-4 h-4" /> Play Again
                        </button>
                        <button
                            onClick={onGameEnd}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-xs font-bold text-amber-800 transition-all active:scale-95"
                        >
                            <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                        </button>
                        <button
                            onClick={onCloseRoom}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95"
                        >
                            <LogOut className="w-3.5 h-3.5" /> Close Room
                        </button>
                    </div>
                )}

                {!isHost && (
                    <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Loading State ──
    if (turnOrder.length === 0) {
        return (
            <div className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center">
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <p className="font-serif text-lg text-warm-cocoa font-bold mb-2">
                        Setting up the board... 🎲
                    </p>
                    <p className="text-xs text-warm-grey/50">
                        Preparing Bible Monopoly Lite
                    </p>
                </motion.div>
            </div>
        );
    }

    // ─── Main Game ──
    return (
        <div className="w-full flex flex-col gap-3">
            {/* ─── 1. Top Info Bar ─── */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-warm-grey/50">
                    🏛️ Bible Monopoly
                </div>
                <div className="text-[10px] text-warm-cocoa font-bold">
                    Round {round}/{MAX_ROUNDS}
                </div>
                <div className="flex items-center gap-2">
                    {currentPlayerState && (
                        <span className="text-[10px] font-bold text-warm-cocoa">
                            {PLAYER_TOKENS[currentPlayerState.token]?.emoji}{" "}
                            {isMyTurn ? "Your turn" : getMemberName(room.members, currentTurnPlayerId)}
                        </span>
                    )}
                    {timer > 0 && (
                        <span
                            className={`text-xs font-bold ${
                                timer <= 5 ? "text-rose-500 animate-pulse" : "text-warm-grey/50"
                            }`}
                        >
                            ⏱️ {timer}s
                        </span>
                    )}
                </div>
            </div>

            {/* ─── 2. Board View — Horizontal Strip ─── */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-3 shadow-sm">
                <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-2 text-center">
                    Board
                </p>
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5 pb-2" style={{ minWidth: `${BOARD_SIZE * 56}px` }}>
                        {BOARD.map((space, idx) => {
                            const playersOnSpace = Object.values(players).filter(
                                (p) => p.position === idx && !p.bankrupt
                            );
                            const isCurrentPos =
                                currentPlayerState && currentPlayerState.position === idx;
                            const isProp = isPropertySpace(space);
                            const owner = isProp ? propertyOwners[space.name] : null;
                            const ownerPlayer = owner ? players[owner] : null;

                            return (
                                <motion.div
                                    key={idx}
                                    className={`relative flex-shrink-0 w-[52px] rounded-xl border overflow-hidden ${
                                        isCurrentPos
                                            ? "border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/80"
                                            : "border-warm-grey/10 bg-white/60"
                                    }`}
                                    animate={isCurrentPos ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    {/* Color bar for properties */}
                                    {isProp && (
                                        <div
                                            className="w-full h-2 rounded-t-xl"
                                            style={{ backgroundColor: space.colorHex }}
                                        />
                                    )}
                                    {!isProp && <div className="w-full h-2 bg-stone-200/50 rounded-t-xl" />}

                                    <div className="px-1 py-1 flex flex-col items-center gap-0.5">
                                        <span className="text-sm leading-none">{space.emoji}</span>
                                        <span className="text-[7px] text-warm-cocoa font-bold text-center leading-tight truncate w-full">
                                            {space.name}
                                        </span>

                                        {/* Owner indicator */}
                                        {ownerPlayer && (
                                            <span className="text-[8px] leading-none">
                                                {PLAYER_TOKENS[ownerPlayer.token]?.emoji}
                                            </span>
                                        )}

                                        {/* Price for properties */}
                                        {isProp && !owner && (
                                            <span className="text-[6px] text-warm-grey/40 font-bold">
                                                {space.cost}₪
                                            </span>
                                        )}

                                        {/* Players on this space */}
                                        {playersOnSpace.length > 0 && (
                                            <div className="flex items-center gap-0.5 flex-wrap justify-center">
                                                {playersOnSpace.map((pp) => (
                                                    <motion.span
                                                        key={pp.id}
                                                        className="text-[10px] leading-none"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring" }}
                                                    >
                                                        {PLAYER_TOKENS[pp.token]?.emoji}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── 3. Action Panel ─── */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-4 shadow-sm">
                {/* Dice Display */}
                <div className="flex items-center justify-center gap-3 mb-3">
                    <AnimatePresence mode="wait">
                        {[dice[0], dice[1]].map((d, i) => {
                            const DiceIcon = DICE_ICONS[Math.max(0, Math.min(5, d - 1))];
                            return (
                                <motion.div
                                    key={`die-${i}-${d}`}
                                    initial={diceRolling ? { rotate: 0, scale: 0.5 } : {}}
                                    animate={
                                        diceRolling
                                            ? {
                                                  rotate: [0, 180, 360, 540, 720],
                                                  scale: [0.5, 1.2, 0.8, 1.1, 1],
                                              }
                                            : { rotate: 0, scale: 1 }
                                    }
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="w-12 h-12 bg-white rounded-xl border-2 border-stone-200 flex items-center justify-center shadow-sm"
                                >
                                    <DiceIcon className="w-8 h-8 text-warm-cocoa" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Roll Button */}
                {isMyTurn && phase === "rolling" && !myPlayerState?.bankrupt && (
                    <motion.button
                        onClick={handleRollDice}
                        className="w-full py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20 mb-3"
                        whileTap={{ scale: 0.95 }}
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        🎲 Roll Dice
                    </motion.button>
                )}

                {/* Waiting for other player */}
                {!isMyTurn && phase === "rolling" && (
                    <div className="text-center mb-3">
                        <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-xs font-bold text-warm-grey/50"
                        >
                            Waiting for {getMemberName(room.members, currentTurnPlayerId)} to roll...
                        </motion.p>
                    </div>
                )}

                {/* Buy/Pass Prompt */}
                <AnimatePresence>
                    {showBuyPrompt && buyPropertyInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 mb-3"
                        >
                            <div className="text-center mb-3">
                                <span className="text-2xl">{buyPropertyInfo.emoji}</span>
                                <p className="font-serif text-sm font-bold text-warm-cocoa mt-1">
                                    {buyPropertyInfo.name}
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: buyPropertyInfo.colorHex }}
                                    />
                                    <span className="text-[10px] text-warm-grey/60">
                                        {buyPropertyInfo.verse}
                                    </span>
                                </div>
                                <p className="text-xs text-warm-cocoa mt-1">
                                    Cost: <span className="font-bold">{buyPropertyInfo.cost} ₪</span>
                                    {" · "}
                                    Rent: <span className="font-bold">{buyPropertyInfo.rent} ₪</span>
                                </p>
                                <p className="text-[10px] text-warm-grey/50 mt-0.5">
                                    You have: {myPlayerState?.money || 0} ₪
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBuyProperty}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs transition-all active:scale-95"
                                >
                                    Buy 🏠
                                </button>
                                <button
                                    onClick={handlePassProperty}
                                    className="flex-1 py-2.5 rounded-xl bg-stone-200 text-warm-cocoa font-bold text-xs transition-all active:scale-95"
                                >
                                    Pass ✋
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Scripture Card Reveal */}
                <AnimatePresence>
                    {showScriptureCard && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="bg-gradient-to-b from-amber-50 to-white border border-amber-200/50 rounded-2xl p-4 mb-3 text-center"
                        >
                            <span className="text-3xl">{showScriptureCard.emoji}</span>
                            <p className="font-serif text-xs text-warm-cocoa mt-2 font-bold leading-relaxed">
                                {showScriptureCard.text}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status Message */}
                <AnimatePresence>
                    {statusMessage && !showBuyPrompt && !showScriptureCard && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <p className="text-xs font-bold text-warm-cocoa bg-stone-50 rounded-xl px-3 py-2 border border-stone-200/30">
                                {statusMessage}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── 4. Player Dashboard ─── */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold">
                        Players
                    </p>
                    <p className="text-[9px] text-warm-grey/40 font-bold">
                        Pot: {pot} ₪
                    </p>
                </div>
                <div className="space-y-2">
                    {turnOrder.map((id) => {
                        const p = players[id];
                        if (!p) return null;
                        const token = PLAYER_TOKENS[p.token];
                        const isCurrentTurn = id === currentTurnPlayerId;
                        const isMe = id === currentUserId;

                        // Get color dots for owned properties
                        const ownedColors = new Set<string>();
                        p.properties.forEach((propName) => {
                            const space = BOARD.find(
                                (s) => s.type === "property" && s.name === propName
                            ) as PropertySpace | undefined;
                            if (space) ownedColors.add(space.colorHex);
                        });

                        return (
                            <motion.div
                                key={id}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                    p.bankrupt
                                        ? "bg-stone-100/50 border border-stone-200/20 opacity-40"
                                        : isCurrentTurn
                                            ? "bg-amber-50 border border-amber-200/50 ring-1 ring-amber-300/30"
                                            : isMe
                                                ? "bg-white/80 border border-warm-grey/10"
                                                : "bg-white/40 border border-warm-grey/5"
                                }`}
                                animate={isCurrentTurn ? { scale: [1, 1.01, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                <span className="text-lg">{token?.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-bold text-warm-cocoa truncate">
                                            {getMemberName(room.members, id)}
                                            {isMe && " (You)"}
                                        </span>
                                        {p.bankrupt && (
                                            <span className="text-[8px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">
                                                Bankrupt
                                            </span>
                                        )}
                                        {p.skipNextTurn && !p.bankrupt && (
                                            <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">
                                                🏜️ Skip
                                            </span>
                                        )}
                                    </div>
                                    {/* Owned property color dots */}
                                    {p.properties.length > 0 && (
                                        <div className="flex items-center gap-0.5 mt-0.5 flex-wrap">
                                            {p.properties.map((propName) => {
                                                const space = BOARD.find(
                                                    (s) =>
                                                        s.type === "property" && s.name === propName
                                                ) as PropertySpace | undefined;
                                                return (
                                                    <div
                                                        key={propName}
                                                        className="w-2 h-2 rounded-full border border-white"
                                                        style={{
                                                            backgroundColor:
                                                                space?.colorHex || "#ccc",
                                                        }}
                                                        title={propName}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-bold ${
                                        p.bankrupt
                                            ? "text-rose-400"
                                            : "text-warm-cocoa"
                                    }`}
                                >
                                    {p.bankrupt ? "💀" : `${p.money} ₪`}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
