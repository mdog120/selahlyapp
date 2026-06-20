export interface BibleTerm {
  word: string;
  hint: string;
  category: "Character" | "Place" | "Book" | "Concept";
}

export const BIBLE_TERMS: BibleTerm[] = [
  { word: "MOSES", hint: "Split the Red Sea and received the Ten Commandments", category: "Character" },
  { word: "BETHLEHEM", hint: "The small town where Jesus was born", category: "Place" },
  { word: "GENESIS", hint: "The very first book of the Bible, detailing creation", category: "Book" },
  { word: "ABRAHAM", hint: "Known as the father of many nations and a friend of God", category: "Character" },
  { word: "NOAH", hint: "Built an ark to save his family and animals from the great flood", category: "Character" },
  { word: "DAVID", hint: "A young shepherd boy who defeated Goliath and became king", category: "Character" },
  { word: "GOLIATH", hint: "The giant Philistine warrior who was defeated by a single stone", category: "Character" },
  { word: "JERUSALEM", hint: "The holy city where Solomon built the great temple", category: "Place" },
  { word: "SAMSON", hint: "A judge blessed with immense strength, betrayed by Delilah", category: "Character" },
  { word: "SOLOMON", hint: "King of Israel known for his great wisdom and wealth", category: "Character" },
  { word: "COVENANT", hint: "A sacred, solemn agreement between God and His people", category: "Concept" },
  { word: "PENTECOST", hint: "The day the Holy Spirit descended on the apostles like fire", category: "Concept" },
  { word: "REVELATION", hint: "The final book of the Bible, containing apocalyptic visions", category: "Book" },
  { word: "PAUL", hint: "Apostle to the Gentiles who wrote many of the New Testament epistles", category: "Character" },
  { word: "GARDEN OF EDEN", hint: "The paradise where Adam and Eve first lived", category: "Place" },
  { word: "EGYPT", hint: "The land where the Israelites were enslaved before the Exodus", category: "Place" },
  { word: "JORDAN", hint: "The river where Joshua crossed into the Promised Land and Jesus was baptized", category: "Place" },
  { word: "MANNA", hint: "The miraculous bread from heaven that fed the Israelites in the wilderness", category: "Concept" },
  { word: "TABERNACLE", hint: "The portable dwelling place of God's presence during the wilderness journey", category: "Concept" },
  { word: "GABRIEL", hint: "The archangel who announced the birth of Jesus to Mary", category: "Character" },
  { word: "DANIEL", hint: "A faithful prophet who was protected by God in a lions' den", category: "Character" },
  { word: "ESTHER", hint: "A courageous Jewish queen who saved her people from destruction", category: "Character" },
  { word: "JONAH", hint: "A prophet who spent three days inside a great fish after fleeing God", category: "Character" },
  { word: "MATTHEW", hint: "A tax collector who became a disciple and wrote the first Gospel", category: "Character" },
  { word: "NAZARETH", hint: "The childhood hometown of Jesus", category: "Place" },
  { word: "CALVARY", hint: "The hill where Jesus was crucified, also known as Golgotha", category: "Place" },
  { word: "RESURRECTION", hint: "Jesus rising from the dead on the third day", category: "Concept" },
  { word: "SALVATION", hint: "Deliverance from sin and its consequences, offered through Christ", category: "Concept" },
  { word: "GRACE", hint: "God's unmerited favor and love toward humanity", category: "Concept" },
  { word: "RUTH", hint: "A loyal Moabite widow who stayed with Naomi and became an ancestor of David", category: "Character" },
  { word: "ELIJAH", hint: "A powerful prophet who was taken to heaven in a whirlwind and chariot of fire", category: "Character" },
  { word: "PRAYER", hint: "Solemn request or thanksgiving directed to God", category: "Concept" },
  { word: "FAITH", hint: "Complete trust or confidence in God, even when unseen", category: "Concept" },
  { word: "HALLELUJAH", hint: "A joyful expression of praise, meaning 'Praise the Lord'", category: "Concept" },
  { word: "PRAYER SHAWL", hint: "A fringed garment traditionally worn during Jewish prayers", category: "Concept" },
  { word: "EXODUS", hint: "The second book of the Bible, describing the departure from Egypt", category: "Book" },
  { word: "PSALMS", hint: "A book of sacred songs, poems, and prayers, mostly by King David", category: "Book" },
  { word: "PROVERBS", hint: "A book of wise sayings and practical advice, mostly by Solomon", category: "Book" },
  { word: "BABYLON", hint: "The empire that captured Jerusalem and exiled the Jewish people", category: "Place" },
  { word: "SINAI", hint: "The holy mountain where Moses received the law from God", category: "Place" },
  { word: "GETHSEMANE", hint: "The garden where Jesus prayed in agony before His arrest", category: "Place" },
  { word: "DISCIPLE", hint: "A dedicated follower or student of Jesus", category: "Character" },
  { word: "JOSEPH", hint: "Had a coat of many colors and interpreted dreams in Egypt", category: "Character" },
  { word: "JOSHUA", hint: "Led the Israelites into the Promised Land after Moses died", category: "Character" },
  { word: "MIRACLE", hint: "An extraordinary event indicating divine intervention", category: "Concept" }
];

export function getRandomTerm(usedTerms: string[]): BibleTerm {
  const available = BIBLE_TERMS.filter(t => !usedTerms.includes(t.word));
  const pool = available.length > 0 ? available : BIBLE_TERMS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
