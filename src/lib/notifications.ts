export const cuteTemplates: Record<string, string[]> = {
  like: [
    "left some love on your post! 💖",
    "smiled at your thoughts! ☀️",
    "heart-ed your post! ౨ৎ",
    "is cheering you on! ✨"
  ],
  message_like: [
    "smiled at your message! ౨ৎ",
    "loved your message! 💖",
    "reacted to your message! ✨",
    "left a sweet reaction on your message! 🌸"
  ],
  message_dislike: [
    "disliked your message. 🥺",
    "gave your message a little frown. 😔",
    "reacted to your message. 💔"
  ],
  group_message_like: [
    "smiled at your message in the group! ౨ৎ",
    "loved your message in the group! 💖",
    "reacted to your group message! ✨"
  ],
  group_message_dislike: [
    "disliked your message in the group. 🥺",
    "reacted to your group message. 💔"
  ],
  comment_like: [
    "loved your comment! 💖",
    "smiled at your comment! ౨ৎ",
    "left some love on your comment! ✨",
    "liked what you commented! 🌸"
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
    return preview;
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

export function stripEmojis(text: string): string {
  if (!text) return "";
  try {
    return text
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\uFE0F/g, '')
      .trim();
  } catch (e) {
    // fallback if regex is not supported in environment
    return text.replace(/[^\w\s\d.,!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g, '').trim();
  }
}

export function formatMessagePreview(content?: string): string {
  if (!content) return 'sent you a message';
  if (content.startsWith("[media:image:")) return "Sent an image";
  if (content.startsWith("[media:video:")) return "Sent a video";
  if (content.startsWith("[sticker:")) {
    const match = content.match(/\[sticker:(.+)\]/);
    const stickerName = match ? match[1] : '';
    return stickerName ? `Sent a ${stickerName} sticker` : "Sent a sticker";
  }
  return stripEmojis(content);
}
