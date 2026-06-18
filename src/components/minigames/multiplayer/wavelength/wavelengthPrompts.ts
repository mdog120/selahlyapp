export interface WavelengthPrompt {
  id: string;
  topic: string;
  left: string;
  right: string;
  example: string;
}

export const WAVELENGTH_PROMPTS: WavelengthPrompt[] = [
  // Bible characters
  { id: "characters-faith", topic: "Bible Characters", left: "Timid Faith", right: "Bold Faith", example: "Moses, Esther, Peter..." },
  { id: "characters-obedience", topic: "Bible Characters", left: "Runs Away", right: "Quickly Obeys", example: "Jonah, Ruth, Abraham..." },
  { id: "characters-leadership", topic: "Bible Characters", left: "Quiet Supporter", right: "Commanding Leader", example: "Barnabas, Deborah, Nehemiah..." },
  { id: "characters-wisdom", topic: "Bible Characters", left: "Acts Impulsively", right: "Acts Wisely", example: "Peter, Abigail, Solomon..." },
  { id: "characters-courage", topic: "Bible Characters", left: "Very Fearful", right: "Extremely Courageous", example: "Gideon, David, Esther..." },
  { id: "characters-patience", topic: "Bible Characters", left: "Very Impatient", right: "Very Patient", example: "Sarah, Joseph, Job..." },
  { id: "characters-outsider", topic: "Bible Characters", left: "At the Center", right: "An Outsider", example: "David, Rahab, Ruth..." },
  { id: "characters-change", topic: "Bible Characters", left: "Hardly Changes", right: "Completely Transformed", example: "Saul, Zacchaeus, Jacob..." },

  // Bible stories
  { id: "stories-quiet-dramatic", topic: "Bible Stories", left: "Quiet Moment", right: "Huge Spectacle", example: "Ruth gleaning, Red Sea, Pentecost..." },
  { id: "stories-sad-joyful", topic: "Bible Stories", left: "Deeply Sorrowful", right: "Overflowing Joy", example: "The exile, resurrection morning..." },
  { id: "stories-private-public", topic: "Bible Stories", left: "Private Encounter", right: "Whole Nation Watching", example: "Jacob wrestling, Mount Carmel..." },
  { id: "stories-peace-danger", topic: "Bible Stories", left: "Peaceful", right: "Extremely Dangerous", example: "Psalm 23, Daniel in the lions’ den..." },
  { id: "stories-human-miracle", topic: "Bible Stories", left: "Ordinary Human Action", right: "Undeniable Miracle", example: "Building the ark, feeding the 5,000..." },
  { id: "stories-small-big", topic: "Bible Stories", left: "Small Personal Moment", right: "World-Changing Event", example: "Widow’s offering, resurrection..." },

  // Places
  { id: "places-peace-danger", topic: "Places in the Bible", left: "Peaceful Refuge", right: "Dangerous Place", example: "Bethany, wilderness, Babylon..." },
  { id: "places-humble-grand", topic: "Places in the Bible", left: "Humble", right: "Grand", example: "Manger, temple, palace..." },
  { id: "places-earth-heaven", topic: "Places in the Bible", left: "Feels Earthly", right: "Feels Heavenly", example: "Egypt, Eden, New Jerusalem..." },
  { id: "places-dry-lush", topic: "Places in the Bible", left: "Dry and Barren", right: "Lush and Abundant", example: "Sinai, Jordan, Eden..." },

  // Objects and symbols
  { id: "objects-gentle-powerful", topic: "Biblical Objects & Symbols", left: "Gentle Symbol", right: "Powerful Symbol", example: "Dove, sword, pillar of fire..." },
  { id: "objects-small-large", topic: "Biblical Objects & Symbols", left: "Tiny", right: "Enormous", example: "Mustard seed, ark, temple..." },
  { id: "objects-ordinary-sacred", topic: "Biblical Objects & Symbols", left: "Ordinary", right: "Deeply Sacred", example: "Fishing net, altar, ark of the covenant..." },
  { id: "objects-quiet-loud", topic: "Biblical Objects & Symbols", left: "Quiet", right: "Loud", example: "Oil lamp, trumpet, thunder..." },

  // Virtues and spiritual life
  { id: "practices-private-public", topic: "Faith Practices", left: "Private", right: "Public", example: "Silent prayer, preaching, worship..." },
  { id: "practices-easy-hard", topic: "Faith Practices", left: "Easy to Begin", right: "Requires Great Discipline", example: "Gratitude, fasting, forgiveness..." },
  { id: "virtues-gentle-bold", topic: "Christian Virtues", left: "Gentle", right: "Bold", example: "Kindness, courage, righteous justice..." },
  { id: "virtues-inward-outward", topic: "Christian Virtues", left: "Mostly Inward", right: "Clearly Visible", example: "Contentment, generosity, service..." },
  { id: "virtues-natural-difficult", topic: "Christian Virtues", left: "Comes Naturally", right: "Very Difficult", example: "Joy, patience, forgiving an enemy..." },

  // Books and passages
  { id: "books-story-teaching", topic: "Books of the Bible", left: "Mostly Story", right: "Mostly Teaching", example: "Esther, Acts, Romans..." },
  { id: "books-gentle-intense", topic: "Books of the Bible", left: "Gentle Tone", right: "Intense Tone", example: "Ruth, Psalms, Revelation..." },
  { id: "books-personal-global", topic: "Books of the Bible", left: "Very Personal", right: "Global in Scope", example: "Philemon, Genesis, Revelation..." },
  { id: "psalms-lament-praise", topic: "Psalms", left: "Lament", right: "Celebration", example: "Psalm 22, Psalm 23, Psalm 150..." },

  // Miracles and teachings
  { id: "miracles-subtle-spectacular", topic: "Miracles of Jesus", left: "Subtle", right: "Spectacular", example: "Coin in the fish, calming the storm..." },
  { id: "miracles-person-crowd", topic: "Miracles of Jesus", left: "Helps One Person", right: "Helps a Huge Crowd", example: "Healing Bartimaeus, feeding the 5,000..." },
  { id: "parables-simple-deep", topic: "Parables of Jesus", left: "Easy to Understand", right: "Deep and Mysterious", example: "Lost sheep, ten virgins..." },
  { id: "teachings-comfort-challenge", topic: "Teachings of Jesus", left: "Comforting", right: "Challenging", example: "Do not worry, love your enemies..." },
];

export function getRandomPrompt(exclude: string[]): WavelengthPrompt {
  const available = WAVELENGTH_PROMPTS.filter((prompt) => !exclude.includes(prompt.id));
  const pool = available.length > 0 ? available : WAVELENGTH_PROMPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}
