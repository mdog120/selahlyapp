export interface WavelengthPrompt {
  id: string;
  left: string; // left end of spectrum (score 0)
  right: string; // right end of spectrum (score 100)
}

export const WAVELENGTH_PROMPTS: WavelengthPrompt[] = [
  // ── Theological Concepts ──────────────────────────────────────────────
  { id: 'law-grace', left: 'Law', right: 'Grace' },
  { id: 'justice-mercy', left: 'Justice', right: 'Mercy' },
  { id: 'sin-righteousness', left: 'Sin', right: 'Righteousness' },
  { id: 'fear-of-god-love-of-god', left: 'Fear of God', right: 'Love of God' },
  { id: 'old-covenant-new-covenant', left: 'Old Covenant', right: 'New Covenant' },
  { id: 'letter-of-law-spirit-of-law', left: 'Letter of the Law', right: 'Spirit of the Law' },
  { id: 'earthly-kingdom-heavenly-kingdom', left: 'Earthly Kingdom', right: 'Heavenly Kingdom' },
  { id: 'human-effort-gods-sovereignty', left: 'Human Effort', right: "God's Sovereignty" },
  { id: 'doubt-faith', left: 'Doubt', right: 'Faith' },
  { id: 'punishment-forgiveness', left: 'Punishment', right: 'Forgiveness' },
  { id: 'wrath-compassion', left: 'Wrath', right: 'Compassion' },
  { id: 'flesh-spirit', left: 'Flesh', right: 'Spirit' },
  { id: 'death-resurrection', left: 'Death', right: 'Resurrection' },
  { id: 'darkness-light', left: 'Darkness', right: 'Light' },
  { id: 'bondage-liberty', left: 'Bondage', right: 'Liberty' },

  // ── Biblical Characters ───────────────────────────────────────────────
  { id: 'david-shepherd-king', left: 'David as Shepherd', right: 'David as King' },
  { id: 'moses-stutterer-deliverer', left: 'Moses the Stutterer', right: 'Moses the Deliverer' },
  { id: 'saul-persecutor-paul-apostle', left: 'Saul the Persecutor', right: 'Paul the Apostle' },
  { id: 'peter-denier-peter-rock', left: 'Peter the Denier', right: 'Peter the Rock' },
  { id: 'jonah-running-jonah-obeying', left: 'Jonah Running Away', right: 'Jonah Obeying' },
  { id: 'jacob-deceiver-israel-overcomer', left: 'Jacob the Deceiver', right: 'Israel the Overcomer' },
  { id: 'gideon-fearful-gideon-warrior', left: 'Gideon the Fearful', right: 'Gideon the Warrior' },
  { id: 'rahab-outsider-rahab-redeemed', left: 'Rahab the Outsider', right: 'Rahab the Redeemed' },
  { id: 'abraham-wanderer-abraham-father', left: 'Abraham the Wanderer', right: 'Abraham the Father of Nations' },
  { id: 'elijah-cave-elijah-carmel', left: 'Elijah in the Cave', right: 'Elijah on Mount Carmel' },

  // ── Biblical Themes ───────────────────────────────────────────────────
  { id: 'desert-wandering-promised-land', left: 'Wandering in the Desert', right: 'Entering the Promised Land' },
  { id: 'captivity-freedom', left: 'Captivity', right: 'Freedom' },
  { id: 'famine-abundance', left: 'Famine', right: 'Abundance' },
  { id: 'exile-homecoming', left: 'Exile', right: 'Homecoming' },
  { id: 'persecution-blessing', left: 'Persecution', right: 'Blessing' },
  { id: 'wilderness-garden', left: 'Wilderness', right: 'Garden' },
  { id: 'scattering-gathering', left: 'Scattering', right: 'Gathering' },
  { id: 'mourning-dancing', left: 'Mourning', right: 'Dancing' },
  { id: 'sowing-in-tears-reaping-in-joy', left: 'Sowing in Tears', right: 'Reaping in Joy' },
  { id: 'valley-of-shadow-green-pastures', left: 'Valley of the Shadow', right: 'Green Pastures' },
  { id: 'broken-vessel-refined-gold', left: 'Broken Vessel', right: 'Refined Gold' },

  // ── Virtue Spectrums ──────────────────────────────────────────────────
  { id: 'pride-humility', left: 'Pride', right: 'Humility' },
  { id: 'anger-patience', left: 'Anger', right: 'Patience' },
  { id: 'selfishness-generosity', left: 'Selfishness', right: 'Generosity' },
  { id: 'worry-peace', left: 'Worry', right: 'Peace' },
  { id: 'bitterness-forgiveness', left: 'Bitterness', right: 'Forgiveness' },
  { id: 'envy-contentment', left: 'Envy', right: 'Contentment' },
  { id: 'hatred-love', left: 'Hatred', right: 'Love' },
  { id: 'cowardice-courage', left: 'Cowardice', right: 'Courage' },
  { id: 'despair-hope', left: 'Despair', right: 'Hope' },
  { id: 'foolishness-wisdom', left: 'Foolishness', right: 'Wisdom' },
  { id: 'laziness-diligence', left: 'Laziness', right: 'Diligence' },
  { id: 'greed-sacrifice', left: 'Greed', right: 'Sacrifice' },
  { id: 'deceit-truth', left: 'Deceit', right: 'Truth' },

  // ── Fun / Creative ────────────────────────────────────────────────────
  { id: 'eden-new-jerusalem', left: 'Garden of Eden', right: 'New Jerusalem' },
  { id: 'bread-living-water', left: 'Bread', right: 'Living Water' },
  { id: 'whisper-thunder', left: 'Whisper', right: 'Thunder' },
  { id: 'burning-bush-red-sea', left: 'Burning Bush', right: 'Parting of the Red Sea' },
  { id: 'mustard-seed-cedar-of-lebanon', left: 'Mustard Seed', right: 'Cedar of Lebanon' },
  { id: 'sheep-lion', left: 'Sheep', right: 'Lion' },
  { id: 'martha-mary', left: 'Martha', right: 'Mary' },
  { id: 'babel-pentecost', left: 'Tower of Babel', right: 'Day of Pentecost' },
  { id: 'still-waters-stormy-seas', left: 'Still Waters', right: 'Stormy Seas' },
  { id: 'manger-throne', left: 'Manger', right: 'Throne' },
  { id: 'donkey-warhorse', left: 'Donkey', right: 'Warhorse' },
  { id: 'clay-potters-hands', left: 'Clay', right: "Potter's Hands" },
  { id: 'narrow-gate-wide-road', left: 'Narrow Gate', right: 'Wide Road' },
  { id: 'sparrow-eagle', left: 'Sparrow', right: 'Eagle' },
  { id: 'oil-lamp-pillar-of-fire', left: 'Oil Lamp', right: 'Pillar of Fire' },
  { id: 'foot-washing-anointing', left: 'Foot Washing', right: 'Anointing with Oil' },
  { id: 'single-talent-ten-talents', left: 'One Talent', right: 'Ten Talents' },
  { id: 'fishing-net-shepherds-staff', left: 'Fishing Net', right: "Shepherd's Staff" },
];

/**
 * Returns a random prompt that hasn't been used yet.
 * If all prompts have been excluded, picks any random prompt.
 */
export function getRandomPrompt(exclude: string[]): WavelengthPrompt {
  const available = WAVELENGTH_PROMPTS.filter(
    (p) => !exclude.includes(p.id),
  );

  if (available.length === 0) {
    return WAVELENGTH_PROMPTS[
      Math.floor(Math.random() * WAVELENGTH_PROMPTS.length)
    ];
  }

  return available[Math.floor(Math.random() * available.length)];
}
