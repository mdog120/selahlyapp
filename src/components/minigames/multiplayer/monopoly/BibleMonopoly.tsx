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
    skipReason?: "jail" | "wilderness";
}

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
const TURN_TIMER = 45;
const BUY_TIMER = 25;
const DICE_ANIMATION_MS = 1200;
const LANDING_REVEAL_MS = 1650;
const STANDARD_EVENT_HOLD_MS = 3500;
const IMPORTANT_EVENT_HOLD_MS = 4500;
const DECISION_RESULT_HOLD_MS = 2600;

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
    const [showTokenPicker, setShowTokenPicker] = useState(true);

    // Game over
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [finalStandings, setFinalStandings] = useState<{ id: string; money: number }[]>([]);

    // ─── Broadcast helper ──
    const broadcast = useCallback((event: string, payload: Record<string, unknown>) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function hostInitGame() {
        const order = shuffleArray(room.members.map((m) => m.user_id));
        turnOrderRef.current = order;

        const playerStates: Record<string, PlayerState> = {};
        order.forEach((id) => {
            playerStates[id] = {
                id,
                position: 0,
                money: STARTING_MONEY,
                token: -1,
                properties: [],
                bankrupt: false,
                skipNextTurn: false,
                skipReason: undefined,
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
        setShowTokenPicker(true);
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
        if (p.token < 0) {
            setStatusMessage("Choose your character before rolling 🎟️");
            return;
        }

        // Check skip turn
        if (p.skipNextTurn) {
            const skipReason = p.skipReason;
            p.skipNextTurn = false;
            p.skipReason = undefined;
            playersRef.current[playerId] = { ...p };

            const msg = skipReason === "jail"
                ? `${getMemberName(room.members, playerId)} is serving one turn in jail. Turn skipped! 🔒`
                : `${getMemberName(room.members, playerId)} is resting in the wilderness. Turn skipped!`;
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

            setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
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
        }, DICE_ANIMATION_MS);

        // Process landing after dice animation
        setTimeout(() => {
            hostProcessLanding(playerId, space, newPos);
        }, LANDING_REVEAL_MS);
    }

    function hostProcessLanding(playerId: string, space: BoardSpace, spaceIndex: number) {
        const p = playersRef.current[playerId];
        if (!p) return;

        if (space.type === "go") {
            // Landed exactly on GO — bonus already handled if passed
            const msg = `Landed on GO! ⭐`;
            broadcastLandAction(playerId, msg, false);
            setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
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
                    setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
                }
            } else if (owner === playerId) {
                const msg = `Landed on your own property: ${space.emoji} ${space.name}.`;
                broadcastLandAction(playerId, msg, false);
                setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
            } else {
                // Pay rent
                const ownerPlayer = playersRef.current[owner];
                if (!ownerPlayer || ownerPlayer.bankrupt) {
                    const msg = `Landed on ${space.emoji} ${space.name} (owner is bankrupt — no rent).`;
                    broadcastLandAction(playerId, msg, false);
                    setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
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
                    setTimeout(() => hostEndTurn(), IMPORTANT_EVENT_HOLD_MS);
                } else {
                    const doubleMsg = ownsFullColorGroup(ownerPlayer.properties, space.color) ? " (doubled!)" : "";
                    const msg = `${payerName} paid ${rent}${doubleMsg} shekels rent to ${ownerName}!`;
                    broadcastLandAction(playerId, msg, false);
                    setTimeout(() => hostEndTurn(), IMPORTANT_EVENT_HOLD_MS);
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
                setTimeout(() => hostEndTurn(), IMPORTANT_EVENT_HOLD_MS);
            } else {
                const msg = `Paid tithe of ${TITHE_AMOUNT} shekels to the pot. 💰`;
                broadcastLandAction(playerId, msg, false);
                setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
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
            setTimeout(() => hostEndTurn(), STANDARD_EVENT_HOLD_MS);
        } else if (space.type === "jail") {
            p.skipNextTurn = true;
            p.skipReason = "jail";
            playersRef.current[playerId] = { ...p };
            const msg = `Sent to Jail! 🔒 Miss your next turn, then return to the journey.`;
            broadcastLandAction(playerId, msg, false);
            setTimeout(() => hostEndTurn(), IMPORTANT_EVENT_HOLD_MS);
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

        const msg = `📜 Scripture Card: ${card.text}`;

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
                p.skipReason = "wilderness";
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

        setTimeout(() => hostEndTurn(), IMPORTANT_EVENT_HOLD_MS);
    }

    function hostStartBuyTimer(playerId: string) {
        hostClearTimer();
        turnTimerRef.current = BUY_TIMER;
        setTimer(BUY_TIMER);
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

        setTimeout(() => hostEndTurn(), DECISION_RESULT_HOLD_MS);
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

        setTimeout(() => hostEndTurn(), DECISION_RESULT_HOLD_MS);
    }

    function hostProcessTokenChoice(playerId: string, tokenIndex: number) {
        const player = playersRef.current[playerId];
        if (!player || tokenIndex < 0 || tokenIndex >= PLAYER_TOKENS.length) return;

        const tokenClaimed = Object.values(playersRef.current).some(
            (other) => other.id !== playerId && other.token === tokenIndex
        );
        if (tokenClaimed) return;

        player.token = tokenIndex;
        playersRef.current[playerId] = { ...player };

        broadcast("bm_token_selected", {
            playerId,
            tokenIndex,
            players: playersRef.current,
        });
        setPlayers({ ...playersRef.current });
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
                setShowTokenPicker(true);
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
                        setTimeout(() => setDiceRolling(false), DICE_ANIMATION_MS);
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
            .on("broadcast", { event: "bm_token_selected" }, ({ payload }) => {
                setPlayers(payload.players);
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
            .on("broadcast", { event: "bm_player_choose_token" }, ({ payload }) => {
                if (!isHost) return;
                hostProcessTokenChoice(payload.playerId, payload.tokenIndex);
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

    const handleChooseToken = useCallback((tokenIndex: number) => {
        const tokenClaimed = Object.values(players).some(
            (player) => player.id !== currentUserId && player.token === tokenIndex
        );
        if (tokenClaimed) return;

        if (isHost) {
            hostProcessTokenChoice(currentUserId, tokenIndex);
        } else {
            broadcast("bm_player_choose_token", {
                playerId: currentUserId,
                tokenIndex,
            });
        }
        setShowTokenPicker(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [players, currentUserId, isHost, broadcast]);

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
                        {PLAYER_TOKENS[players[winnerId]?.token]?.emoji || "🎟️"}{" "}
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
                        const token = p ? PLAYER_TOKENS[p.token] : undefined;
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
                                <span className="text-lg">{token?.emoji || "🎟️"}</span>
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
        <div className="w-full flex flex-col gap-4 rounded-[2rem] border border-[#d9c6a3]/50 bg-gradient-to-b from-[#fbf4e6]/80 via-[#f5ead7]/60 to-[#e8dcc5]/70 p-2.5 sm:p-4 shadow-[0_18px_50px_rgba(67,48,29,0.12)]">
            {/* ─── 1. Top Info Bar ─── */}
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#d9c6a3]/70 bg-gradient-to-r from-[#fffaf0]/95 via-white/90 to-[#fff8e8]/95 px-3 py-2.5 shadow-[0_5px_18px_rgba(92,67,37,0.09)]">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-amber-100 text-sm shadow-inner">
                        🏛️
                    </div>
                    <div>
                        <p className="font-serif text-[11px] font-bold text-[#5b402c]">Bible Monopoly Lite</p>
                        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#9a7b58]">A journey through Scripture</p>
                    </div>
                </div>
                <div className="hidden rounded-full border border-[#dbc59c]/60 bg-[#f8edd7] px-2.5 py-1 text-[9px] font-black text-[#73583d] sm:block">
                    Round {round} of {MAX_ROUNDS}
                </div>
                <div className="flex items-center gap-2">
                    {currentPlayerState && (
                        <span className="max-w-[100px] truncate text-[9px] font-bold text-[#5b402c] sm:max-w-none sm:text-[10px]">
                            {PLAYER_TOKENS[currentPlayerState.token]?.emoji || "🎟️"}{" "}
                            {isMyTurn ? "Your turn" : getMemberName(room.members, currentTurnPlayerId)}
                        </span>
                    )}
                    {timer > 0 && (
                        <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-black tabular-nums ${
                                timer <= 8
                                    ? "border-rose-200 bg-rose-50 text-rose-600 animate-pulse"
                                    : "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                            }`}
                        >
                            {timer}s
                        </span>
                    )}
                </div>
            </div>

            {/* Character selection */}
            <div className="rounded-2xl border border-[#d8c49e]/70 bg-[#fffaf0]/90 p-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="font-serif text-[11px] font-bold text-[#5b402c]">
                            {(myPlayerState?.token ?? -1) >= 0 ? "Your traveler" : "Choose your traveler"}
                        </p>
                        <p className="text-[8px] font-semibold text-[#92785b]">
                            Pick the character that will journey around the board.
                        </p>
                    </div>
                    {(myPlayerState?.token ?? -1) >= 0 && !showTokenPicker && (
                        <button
                            onClick={() => setShowTokenPicker(true)}
                            className="shrink-0 rounded-full border border-[#d7c4a3] bg-white/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#795e42] transition-all active:scale-95"
                        >
                            Change
                        </button>
                    )}
                </div>

                {(showTokenPicker || (myPlayerState?.token ?? -1) < 0) && (
                    <div className="mt-2 grid grid-cols-6 gap-1.5">
                        {PLAYER_TOKENS.map((token, tokenIndex) => {
                            const claimedByOther = Object.values(players).some(
                                (player) => player.id !== currentUserId && player.token === tokenIndex
                            );
                            const selected = myPlayerState?.token === tokenIndex;

                            return (
                                <button
                                    key={token.label}
                                    onClick={() => handleChooseToken(tokenIndex)}
                                    disabled={claimedByOther}
                                    title={claimedByOther ? `${token.label} is already taken` : token.label}
                                    className={`flex min-w-0 flex-col items-center gap-0.5 rounded-xl border px-1 py-2 transition-all ${
                                        selected
                                            ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200"
                                            : claimedByOther
                                                ? "cursor-not-allowed border-stone-200 bg-stone-100 opacity-35 grayscale"
                                                : "border-[#dbc9a9] bg-white/75 hover:-translate-y-0.5 hover:bg-white active:scale-95"
                                    }`}
                                >
                                    <span className="text-xl leading-none">{token.emoji}</span>
                                    <span className="w-full truncate text-center text-[6px] font-black uppercase tracking-wide text-[#72583f] sm:text-[7px]">
                                        {token.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ─── 2. Square Monopoly Board with Embedded Action Panel ─── */}
            {(() => {
                // Grid: 9 columns × 8 rows
                // Top row (row 1, cols 1-9):  indices 14,15,16,17,18,19,20,21,22
                // Left col (rows 2-7, col 1): indices 13,12,11,10,9,8
                // Right col (rows 2-7, col 9): indices 23,24,25,26,27,28
                // Bottom row (row 8, cols 1-9): indices 7,6,5,4,3,2,1,0,29
                // Center area: rows 2-7, cols 2-8 (action panel)

                type EdgeSide = "top" | "bottom" | "left" | "right";

                const boardLayout: { idx: number; row: number; col: number; side: EdgeSide }[] = [];

                // Top row
                const topIndices = [14, 15, 16, 17, 18, 19, 20, 21, 22];
                topIndices.forEach((idx, c) => boardLayout.push({ idx, row: 1, col: c + 1, side: "top" }));

                // Left column (rows 2-7)
                const leftIndices = [13, 12, 11, 10, 9, 8];
                leftIndices.forEach((idx, r) => boardLayout.push({ idx, row: r + 2, col: 1, side: "left" }));

                // Right column (rows 2-7)
                const rightIndices = [23, 24, 25, 26, 27, 28];
                rightIndices.forEach((idx, r) => boardLayout.push({ idx, row: r + 2, col: 9, side: "right" }));

                // Bottom row
                const bottomIndices = [7, 6, 5, 4, 3, 2, 1, 0, 29];
                bottomIndices.forEach((idx, c) => boardLayout.push({ idx, row: 8, col: c + 1, side: "bottom" }));

                const renderBoardCell = (
                    idx: number,
                    row: number,
                    col: number,
                    side: EdgeSide,
                ) => {
                    const space = BOARD[idx];
                    if (!space) return null;
                    const playersOnSpace = Object.values(players).filter(
                        (p) => p.position === idx && !p.bankrupt
                    );
                    const isCurrentPos = currentPlayerState && currentPlayerState.position === idx;
                    const isProp = isPropertySpace(space);
                    const owner = isProp ? propertyOwners[space.name] : null;
                    const ownerPlayer = owner ? players[owner] : null;

                    // Color bar position: inner edge of the board
                    const colorBarClass =
                        side === "top"    ? "absolute bottom-0 left-0 right-0 h-[4px]" :
                        side === "bottom" ? "absolute top-0 left-0 right-0 h-[4px]" :
                        side === "left"   ? "absolute top-0 right-0 bottom-0 w-[4px]" :
                                            "absolute top-0 left-0 bottom-0 w-[4px]";

                    const isCorner = (row === 1 || row === 8) && (col === 1 || col === 9);

                    return (
                        <motion.div
                            key={`cell-${idx}`}
                            className={`relative overflow-hidden flex flex-col items-center justify-center border border-[#cbb894]/45 ${
                                isCorner ? "rounded-[5px]" : "rounded-[3px]"
                            } ${
                                isCurrentPos
                                    ? "ring-2 ring-amber-300 bg-[#fff7d6] z-10 shadow-[0_0_14px_rgba(251,191,36,.7)]"
                                    : "bg-gradient-to-br from-[#fffdf7] to-[#f4ead6]"
                            }`}
                            style={{
                                gridRow: `${row} / ${row + 1}`,
                                gridColumn: `${col} / ${col + 1}`,
                            }}
                            animate={isCurrentPos ? { scale: [1, 1.06, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2.4 }}
                        >
                            {/* Color bar on inner edge for properties */}
                            {isProp && (
                                <div
                                    className={colorBarClass}
                                    style={{ backgroundColor: space.colorHex }}
                                />
                            )}

                            <span className="text-[9px] sm:text-xs leading-none">
                                {space.emoji}
                            </span>
                            <span className="w-full truncate px-[1px] text-center font-serif text-[4px] font-bold leading-tight text-[#604832] sm:text-[6px]">
                                {space.name.length > 9 ? space.name.slice(0, 8) + "…" : space.name}
                            </span>

                            {/* Owner token */}
                            {ownerPlayer && (
                                <span className="text-[6px] leading-none">
                                    {PLAYER_TOKENS[ownerPlayer.token]?.emoji}
                                </span>
                            )}

                            {/* Price for unowned properties */}
                            {isProp && !owner && (
                                <span className="text-[4px] sm:text-[5px] text-[#9a8065] font-bold">
                                    {space.cost}₪
                                </span>
                            )}

                            {/* Player tokens on this space */}
                            {playersOnSpace.length > 0 && (
                                <div className="absolute bottom-[1px] left-0 right-0 flex items-center justify-center gap-[1px]">
                                    {playersOnSpace.map((pp) => (
                                        <motion.span
                                            key={pp.id}
                                            className="text-[7px] sm:text-[8px] leading-none drop-shadow-sm"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring" }}
                                        >
                                            {PLAYER_TOKENS[pp.token]?.emoji}
                                        </motion.span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                };

                return (
                    <div className="relative overflow-hidden rounded-[1.75rem] border-[5px] border-[#8a663f] bg-gradient-to-br from-[#6e4c2f] via-[#9b7449] to-[#5c3c26] p-2 shadow-[0_18px_35px_rgba(61,40,24,.3),inset_0_0_0_2px_rgba(255,233,190,.3)]">
                        <div className="pointer-events-none absolute inset-1 rounded-[1.3rem] border border-[#e1bd7d]/35" />
                        <div
                            className="relative grid w-full gap-[2px] overflow-hidden rounded-xl bg-[#184f3c] p-[2px] shadow-[inset_0_0_30px_rgba(0,0,0,.28)]"
                            style={{
                                gridTemplateColumns: "repeat(9, 1fr)",
                                gridTemplateRows: "repeat(8, 1fr)",
                                aspectRatio: "9 / 8",
                            }}
                        >
                            {/* Perimeter board cells */}
                            {boardLayout.map(({ idx, row, col, side }) =>
                                renderBoardCell(idx, row, col, side)
                            )}

                            {/* ─── Center Area: Action Panel ─── */}
                            <div
                                className="relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-[#d5ba77]/25 bg-[radial-gradient(circle_at_center,#39745c_0%,#215b46_52%,#164434_100%)] p-2 shadow-[inset_0_0_28px_rgba(2,32,24,.38)]"
                                style={{
                                    gridRow: "2 / 8",
                                    gridColumn: "2 / 9",
                                }}
                            >
                                {/* Game Title */}
                                <div className="pointer-events-none absolute inset-2 rounded-lg border border-dashed border-[#e8d59c]/15" />
                                <p className="relative font-serif text-[10px] font-bold tracking-[0.14em] text-[#f3e4b3] sm:text-xs">
                                    ✦ BIBLE MONOPOLY ✦
                                </p>
                                <p className="relative -mt-1 text-[6px] font-bold uppercase tracking-[0.22em] text-emerald-100/50 sm:text-[7px]">
                                    Steward your shekels wisely
                                </p>

                                {/* Dice Display */}
                                <div className="flex items-center justify-center gap-2">
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
                                                    transition={{ duration: 1.15, ease: "easeOut" }}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#ddcda8] bg-gradient-to-br from-white to-[#f3ead8] shadow-[0_5px_10px_rgba(0,0,0,.22),inset_0_1px_0_white] sm:h-11 sm:w-11"
                                                >
                                                    <DiceIcon className="w-5 h-5 sm:w-7 sm:h-7 text-warm-cocoa" />
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>

                                {/* Roll Button */}
                                {isMyTurn && phase === "rolling" && !myPlayerState?.bankrupt && (myPlayerState?.token ?? -1) >= 0 && (
                                    <motion.button
                                        onClick={handleRollDice}
                                        className="relative rounded-xl border border-amber-200/60 bg-gradient-to-b from-[#e7b653] to-[#bd7b24] px-6 py-2 font-serif text-xs font-bold text-white shadow-[0_6px_0_#714615,0_9px_16px_rgba(55,33,12,.28)] transition-all active:translate-y-1 active:scale-95 active:shadow-[0_2px_0_#714615]"
                                        whileTap={{ scale: 0.95 }}
                                        animate={{ scale: [1, 1.04, 1] }}
                                        transition={{ repeat: Infinity, duration: 2.8 }}
                                    >
                                        🎲 Roll Dice
                                    </motion.button>
                                )}

                                {isMyTurn && phase === "rolling" && (myPlayerState?.token ?? -1) < 0 && (
                                    <p className="relative rounded-full border border-amber-300/30 bg-amber-50/90 px-3 py-1.5 text-[9px] font-bold text-amber-900">
                                        Choose your traveler above before rolling 🎟️
                                    </p>
                                )}

                                {/* Waiting for other player */}
                                {!isMyTurn && phase === "rolling" && (
                                    <motion.p
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2.8 }}
                                        className="relative rounded-full bg-emerald-950/25 px-3 py-1 text-[9px] font-bold text-emerald-100/75"
                                    >
                                        Waiting for {getMemberName(room.members, currentTurnPlayerId)} to roll…
                                    </motion.p>
                                )}

                                {/* Buy/Pass Prompt */}
                                <AnimatePresence>
                                    {showBuyPrompt && buyPropertyInfo && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -12 }}
                                            className="relative w-full max-w-[250px] rounded-xl border border-[#dfc27c] bg-gradient-to-b from-[#fff9e9] to-[#f8e7bd] p-3 shadow-[0_8px_20px_rgba(44,30,13,.22)]"
                                        >
                                            <div className="text-center mb-2">
                                                <span className="text-xl">{buyPropertyInfo.emoji}</span>
                                                <p className="font-serif text-xs font-bold text-warm-cocoa mt-0.5">
                                                    {buyPropertyInfo.name}
                                                </p>
                                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: buyPropertyInfo.colorHex }}
                                                    />
                                                    <span className="text-[9px] text-warm-grey/60">
                                                        {buyPropertyInfo.verse}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-warm-cocoa mt-0.5">
                                                    Cost: <span className="font-bold">{buyPropertyInfo.cost} ₪</span>
                                                    {" · "}
                                                    Rent: <span className="font-bold">{buyPropertyInfo.rent} ₪</span>
                                                </p>
                                                <p className="text-[9px] text-warm-grey/50">
                                                    You have: {myPlayerState?.money || 0} ₪
                                                </p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={handleBuyProperty}
                                                    className="flex-1 rounded-lg border border-emerald-400/40 bg-gradient-to-b from-emerald-600 to-emerald-700 py-2 text-[10px] font-bold text-white shadow-sm transition-all active:scale-95"
                                                >
                                                    Buy 🏠
                                                </button>
                                                <button
                                                    onClick={handlePassProperty}
                                                    className="flex-1 rounded-lg border border-[#d1bea0] bg-[#eee2ce] py-2 text-[10px] font-bold text-[#674d35] transition-all active:scale-95"
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
                                            className="w-full max-w-[250px] rounded-xl border border-[#d9bd78] bg-gradient-to-b from-[#fffaf0] to-[#f4dfab] p-3 text-center shadow-[0_8px_22px_rgba(45,29,12,.24)]"
                                        >
                                            <span className="text-2xl">{showScriptureCard.emoji}</span>
                                            <p className="font-serif text-[10px] text-warm-cocoa mt-1 font-bold leading-relaxed">
                                                {showScriptureCard.text}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Status Message */}
                                <AnimatePresence>
                                    {statusMessage && !showBuyPrompt && !showScriptureCard && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="relative text-center"
                                        >
                                            <p className="rounded-lg border border-[#ead79c]/20 bg-emerald-950/35 px-3 py-2 text-[10px] font-bold leading-relaxed text-[#f5ebc8] shadow-inner">
                                                {statusMessage}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ─── 4. Player Dashboard ─── */}
            <div className="rounded-2xl border border-[#d7c39f]/70 bg-gradient-to-b from-[#fffaf0]/95 to-[#f3e5cc]/90 p-3 shadow-[0_8px_24px_rgba(72,50,27,.1)]">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8a6d4e]">
                        Pilgrims
                    </p>
                    <p className="rounded-full border border-amber-200/60 bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-800">
                        Offering pot · {pot} ₪
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
                                        ? "bg-stone-100/50 border border-stone-200/30 opacity-40"
                                        : isCurrentTurn
                                            ? "border border-amber-300/70 bg-gradient-to-r from-amber-50 to-[#fff7dc] ring-1 ring-amber-300/30 shadow-[0_4px_12px_rgba(180,123,35,.12)]"
                                            : isMe
                                                ? "bg-white/85 border border-[#d7c5a7]"
                                                : "bg-white/55 border border-[#dfd1ba]/70"
                                }`}
                                animate={isCurrentTurn ? { scale: [1, 1.01, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                <span className="text-lg">{token?.emoji || "🎟️"}</span>
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
                                                {p.skipReason === "jail" ? "🔒 Jail" : "🏜️ Rest"}
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
