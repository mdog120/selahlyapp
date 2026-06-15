export function getFriendlyLocation(pathname: string): string {
    if (!pathname) return "Exploring Selahly ✨";
    if (pathname === "/home") return "Resting on Home Page 🏡";
    if (pathname === "/diaries") return "Writing in Diaries ✏️";
    if (pathname === "/garden") return "Working in Selah Garden ❀";
    if (pathname === "/prayer-pocket") return "Active in Prayer Pocket 🙏";
    if (pathname === "/vibe-board") return "Sharing on Vibe Board ✨";
    if (pathname.startsWith("/velvet-vault")) return "Browsing Velvet Vault 🎀";
    if (pathname === "/minigames") return "Playing in Arcade 🕹️";
    if (pathname === "/minigames/multiplayer") return "Waiting in Multiplayer Lobby 👥";
    if (pathname === "/minigames/sudoku") return "Playing Sudoku 🔢";
    if (pathname === "/minigames/wordsearch") return "Playing Word Search 🔍";
    if (pathname === "/minigames/crosswords") return "Playing Crosswords ✏️";
    if (pathname === "/minigames/blockblast") return "Playing Block Blast 🟨";
    if (pathname === "/bible") return "Reading the Bible 📖";
    if (pathname === "/gratitude") return "Filling Gratitude Journal 🌸";
    if (pathname.startsWith("/messages")) return "Chatting with Sisters 💬";
    if (pathname === "/settings") return "Updating Settings ⚙️";
    if (pathname.startsWith("/profile")) return "Viewing a Profile 👤";
    if (pathname === "/search") return "Searching for Sisters 🔍";
    if (pathname === "/grace-inhale") return "Taking a deep breath 🌬️";
    return "Exploring Selahly ✨";
}
