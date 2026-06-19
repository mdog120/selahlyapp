export const cuteTemplates: Record<string, string[]> = {
  like: [
    "left some love on your post! 💖",
    "smiled at your thoughts! ☀️",
    "heart-ed your post! ౨ৎ",
    "is cheering you on! ✨"
  ],
  comment: [
    "left a sweet comment on your post! 📝✨",
    "shared their thoughts on your post! 💬🌸",
    "replied to your thoughts! 🥰",
    "left a little note on your post! 💌"
  ],
  reply: [
    "shared a beautiful reply to your question! 🌸✨",
    "answered your question in the Velvet Vault! 🗝️💕",
    "sent a lovely reply to your question! ౨ৎ"
  ],
  pray: [
    "whispered a prayer for you to heaven! 🕊️✨",
    "lifted you up in prayer! 🙏💖",
    "sent a warm prayer your way! 🌸",
    "is praying for you right now! 🤍"
  ],
  prayer: [
    "whispered a prayer for you to heaven! 🕊️✨",
    "lifted you up in prayer! 🙏💖",
    "sent a warm prayer your way! 🌸",
    "is praying for you right now! 🤍"
  ],
  friend_request: [
    "wants to be your prayer partner & friend! 👭౨ৎ",
    "sent you a warm friend request! ✨ Let's connect!",
    "wants to connect with you! 🌸"
  ],
  message: [
    "sent you a sweet note! 💌",
    "dropped a line in your inbox! 💬✨",
    "wants to chat! 🌸"
  ],
  post: [
    "shared a new moment with you! 🌸 Go take a look!",
    "just posted a fresh thought! ✨౨ৎ",
    "shared a beautiful new post! 📖"
  ],
  mention: [
    "called you out in a sweet mention! 🏷️✨",
    "mentioned you! Go see what they said! ౨ৎ"
  ],
  plant_ready: [
    "Your garden is blooming! 🌸 Time to harvest!",
    "A little flower is ready for you! 🌷✨",
    "Your green thumb paid off! Your plants are ready! 🌿"
  ],
  lobby: [
    "is waiting in the multiplayer lobby! 👥 Let's play together!",
    "is in the lobby! Join them for a game! 🎮✨"
  ],
  prayer_request: [
    "needs a little prayer today. 🙏 Can you lift them up?",
    "shared a prayer request. 🕊️ Let's pray together!",
    "is asking for prayer. 🤍 Let's intercede!"
  ],
  verse_of_the_day: [
    "Here is your beautiful Verse of the Day! 📖✨",
    "A little word of grace for your day! ౨ৎ",
    "Start your day with a sweet reminder of God's love! 🕊️"
  ],
  solo_minigame: [
    "Ready for a quick brain break? 🧠 Grace Alchemy is calling! ✨",
    "Your daily minigame is waiting! Let's play! 🧩",
    "Take a quiet moment to play a minigame! 🌸"
  ]
};

export function getDeterministicIndex(id: string, length: number): number {
  if (!id) return 0;
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return sum % length;
}

export function getNotificationTextOnly(type: string, id: string, extraContent?: string): string {
  if (type === 'message' && extraContent) {
    const preview = extraContent.length > 60 ? extraContent.slice(0, 60) + '...' : extraContent;
    return `sent you a message: "${preview}" 💌`;
  }
  const templates = cuteTemplates[type] || ["sent you a notification."];
  const idx = getDeterministicIndex(id, templates.length);
  return templates[idx];
}

export function formatNotificationText(type: string, actorName: string, id: string, extraContent?: string): string {
  const text = getNotificationTextOnly(type, id, extraContent);
  // System notifications without actors
  if (type === 'plant_ready' || type === 'verse_of_the_day' || type === 'solo_minigame') {
    return text;
  }
  return `${actorName} ${text}`;
}
