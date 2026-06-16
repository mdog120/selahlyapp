// ─── Egyptian Rat Screw — Pure Game Logic ───────────────────
// No UI, no React — just rules and validation.

import { Card, isFaceCard, Rank } from "./bibleCards";

// ─── Face Card Challenge Chances ────────────────────────────

export function getFaceCardChances(rank: Rank): number {
    switch (rank) {
        case "A": return 4;
        case "K": return 3;
        case "Q": return 2;
        case "J": return 1;
        default: return 0;
    }
}

// ─── Slap Validation ────────────────────────────────────────

export interface SlapResult {
    valid: boolean;
    reason: "doubles" | "sandwich" | "top_bottom" | "invalid";
}

/**
 * Check if the pile can be legally slapped.
 * @param pile - Array of cards, index 0 = bottom, last = top
 */
export function canSlap(pile: Card[]): SlapResult {
    if (pile.length < 2) {
        return { valid: false, reason: "invalid" };
    }

    const top = pile[pile.length - 1];
    const second = pile[pile.length - 2];

    // Doubles: top two cards have the same rank
    if (top.rank === second.rank) {
        return { valid: true, reason: "doubles" };
    }

    // Sandwich: top and third card have the same rank (card between them differs)
    if (pile.length >= 3) {
        const third = pile[pile.length - 3];
        if (top.rank === third.rank) {
            return { valid: true, reason: "sandwich" };
        }
    }

    // Top-Bottom: top card matches the bottom card
    if (pile.length >= 2) {
        const bottom = pile[0];
        if (top.rank === bottom.rank) {
            return { valid: true, reason: "top_bottom" };
        }
    }

    return { valid: false, reason: "invalid" };
}

// ─── Turn & Challenge Management ────────────────────────────

export interface ChallengeState {
    active: boolean;
    challengerId: string;     // Who played the face card
    defenderId: string;       // Who must respond
    chancesRemaining: number; // How many cards the defender can still play
    faceCardRank: Rank;       // The rank that started the challenge
}

/**
 * Determine what happens when a card is played during a challenge.
 * Returns the updated challenge state and whether the pile should be collected.
 */
export function processChallenge(
    challenge: ChallengeState,
    playedCard: Card,
    playerId: string,
    getNextPlayerId: (currentId: string) => string
): {
    challenge: ChallengeState | null;
    pileWinnerId: string | null;
} {
    // The defender played a face card → new challenge, defender becomes challenger
    if (isFaceCard(playedCard.rank)) {
        return {
            challenge: {
                active: true,
                challengerId: playerId,
                defenderId: getNextPlayerId(playerId),
                chancesRemaining: getFaceCardChances(playedCard.rank),
                faceCardRank: playedCard.rank,
            },
            pileWinnerId: null,
        };
    }

    // The defender played a number card → decrement chances
    const remaining = challenge.chancesRemaining - 1;

    if (remaining <= 0) {
        // Defender failed → challenger takes the pile
        return {
            challenge: null,
            pileWinnerId: challenge.challengerId,
        };
    }

    // Still has chances
    return {
        challenge: {
            ...challenge,
            chancesRemaining: remaining,
        },
        pileWinnerId: null,
    };
}

/**
 * Determine the next player in turn order who still has cards.
 */
export function getNextActivePlayer(
    currentPlayerId: string,
    turnOrder: string[],
    playerCardCounts: Record<string, number>
): string {
    const currentIndex = turnOrder.indexOf(currentPlayerId);
    const playerCount = turnOrder.length;

    for (let i = 1; i <= playerCount; i++) {
        const nextIndex = (currentIndex + i) % playerCount;
        const nextId = turnOrder[nextIndex];
        if ((playerCardCounts[nextId] || 0) > 0) {
            return nextId;
        }
    }

    // Shouldn't happen if game isn't over
    return currentPlayerId;
}

/**
 * Check if the game is over (one player has all cards, or only one player has cards).
 */
export function checkWinner(
    turnOrder: string[],
    playerCardCounts: Record<string, number>,
    totalCards: number
): string | null {
    const playersWithCards = turnOrder.filter((id) => (playerCardCounts[id] || 0) > 0);

    if (playersWithCards.length === 1) {
        return playersWithCards[0];
    }

    // Check if any player has all the cards
    for (const id of turnOrder) {
        if ((playerCardCounts[id] || 0) >= totalCards) {
            return id;
        }
    }

    return null;
}

/**
 * Get the penalty cards for a wrong slap (2 cards from their hand go to bottom of pile).
 */
export const WRONG_SLAP_PENALTY = 2;

/**
 * Get a human-readable slap reason.
 */
export function getSlapReasonText(reason: SlapResult["reason"]): string {
    switch (reason) {
        case "doubles": return "Doubles! 🎯";
        case "sandwich": return "Sandwich! 🥪";
        case "top_bottom": return "Top-Bottom! 🔄";
        default: return "Invalid slap!";
    }
}
