/**
 * Generates a deterministic anonymous sister alias for a user in a specific thread context.
 * Within a single thread, a user will always have the same alias to preserve conversation flow.
 * E.g., User A will be "Grace Sister ౨ৎ" while User B will be "Hope Sister ౨ৎ" inside the same topic discussion.
 */
export function getAnonymousAlias(userId: string | null | undefined, salt: string = "selahly") {
    if (!userId) return "Sister ౨ৎ";
    const virtues = [
        "Grace",
        "Hope",
        "Faith",
        "Joy",
        "Mercy",
        "Peace",
        "Patience",
        "Kindness",
        "Love",
        "Wisdom"
    ];
    let hash = 0;
    const combined = userId + salt;
    for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % virtues.length;
    return `${virtues[index]} Sister ౨ৎ`;
}
