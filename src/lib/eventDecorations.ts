"use client";

export type DecorationKind =
    | "new-year"
    | "valentines"
    | "palm-sunday"
    | "easter"
    | "mothers-day"
    | "memorial-day"
    | "juneteenth"
    | "fathers-day"
    | "world-cup"
    | "july-fourth"
    | "labor-day"
    | "veterans-day"
    | "thanksgiving"
    | "advent"
    | "christmas"
    | "new-years-eve"
    | "daylight-savings";

const DAY_MS = 24 * 60 * 60 * 1000;

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (occurrence - 1) * 7);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number) {
    const last = new Date(year, month + 1, 0);
    const offset = (last.getDay() - weekday + 7) % 7;
    return new Date(year, month, last.getDate() - offset);
}

function getEasterDate(year: number) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month, day);
}

function isSameDay(date: Date, month: number, day: number) {
    return date.getMonth() === month && date.getDate() === day;
}

function isWithinDays(date: Date, target: Date, daysBefore: number, daysAfter: number) {
    const start = new Date(target);
    start.setDate(target.getDate() - daysBefore);
    start.setHours(0, 0, 0, 0);

    const end = new Date(target);
    end.setDate(target.getDate() + daysAfter);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
}

export function getDecorationKind(date: Date): DecorationKind | null {
    const year = date.getFullYear();
    const mothersDay = getNthWeekdayOfMonth(year, 4, 0, 2);
    const memorialDay = getLastWeekdayOfMonth(year, 4, 1);
    const fathersDay = getNthWeekdayOfMonth(year, 5, 0, 3);
    const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
    const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
    const easter = getEasterDate(year);
    const palmSunday = new Date(easter);
    palmSunday.setDate(easter.getDate() - 7);
    const daylightSavingsStart = getNthWeekdayOfMonth(year, 2, 0, 2);
    const daylightSavingsEnd = getNthWeekdayOfMonth(year, 10, 0, 1);
    const worldCupStart = new Date(year, 5, 11);
    const worldCupEnd = new Date(year, 6, 19, 23, 59, 59, 999);
    const adventStart = new Date(year, 11, 1);
    const adventEnd = new Date(year, 11, 24, 23, 59, 59, 999);

    if (isSameDay(date, 0, 1)) return "new-year";
    if (isSameDay(date, 1, 14)) return "valentines";
    if (isSameDay(date, 5, 19)) return "juneteenth";
    if (isSameDay(date, 6, 4)) return "july-fourth";
    if (isSameDay(date, 10, 11)) return "veterans-day";
    if (isSameDay(date, 11, 25)) return "christmas";
    if (isSameDay(date, 11, 31)) return "new-years-eve";
    if (isWithinDays(date, palmSunday, 0, 0)) return "palm-sunday";
    if (Math.abs(date.getTime() - easter.getTime()) <= DAY_MS) return "easter";
    if (isWithinDays(date, mothersDay, 0, 0)) return "mothers-day";
    if (isWithinDays(date, memorialDay, 0, 0)) return "memorial-day";
    if (isWithinDays(date, fathersDay, 0, 0)) return "fathers-day";
    if (isWithinDays(date, laborDay, 0, 0)) return "labor-day";
    if (isWithinDays(date, thanksgiving, 0, 1)) return "thanksgiving";
    if (date >= worldCupStart && date <= worldCupEnd) return "world-cup";
    if (date >= adventStart && date <= adventEnd) return "advent";
    if (date >= daylightSavingsStart && date < daylightSavingsEnd) return "daylight-savings";

    return null;
}

export const EVENT_EMOJIS: Record<DecorationKind, string> = {
    "new-year": "✨",
    "valentines": "💝",
    "palm-sunday": "🌿",
    "easter": "🐰",
    "mothers-day": "🌸",
    "memorial-day": "🇺🇸",
    "juneteenth": "🌟",
    "fathers-day": "👑",
    "world-cup": "⚽",
    "july-fourth": "🎆",
    "labor-day": "🌾",
    "veterans-day": "🎖️",
    "thanksgiving": "🦃",
    "advent": "🕯️",
    "christmas": "🎄",
    "new-years-eve": "🎉",
    "daylight-savings": "☀️"
};

export interface EventDetail {
    title: string;
    message: string;
}

export const EVENT_DETAILS: Record<DecorationKind, EventDetail> = {
    "new-year": {
        title: "Happy New Year! ౨ৎ",
        message: "May this year be filled with His grace, wisdom, and peace. Let us step into this new season with hopeful hearts. 'Forget the former things; do not dwell on the past. See, I am doing a new thing!' — Isaiah 43:18-19"
    },
    "valentines": {
        title: "Happy Valentine's Day! ౨ৎ",
        message: "Remember that you are deeply and unconditionally loved by your Creator. 'We love because He first loved us.' — 1 John 4:19"
    },
    "palm-sunday": {
        title: "Blessed Palm Sunday! ౨ৎ",
        message: "Reflecting on Jesus' humble entry and celebrating Him as our King. 'Hosanna! Blessed is he who comes in the name of the Lord!' — John 12:13"
    },
    "easter": {
        title: "He is Risen! ౨ৎ",
        message: "Celebrate the victory, hope, and new life we have in Jesus today. 'He is not here; he has risen, just as he said!' — Matthew 28:6"
    },
    "mothers-day": {
        title: "Happy Mother's Day! ౨ৎ",
        message: "Celebrating the strength, wisdom, and gentle love of mothers and mentors. 'Her children arise and call her blessed; her husband also, and he praises her.' — Proverbs 31:28"
    },
    "memorial-day": {
        title: "Memorial Day ౨ৎ",
        message: "Taking a quiet moment to remember and give thanks for those who laid down their lives in service and sacrifice."
    },
    "juneteenth": {
        title: "Celebrating Juneteenth! ౨ৎ",
        message: "Remembering freedom, resilience, and hope. 'Now the Lord is the Spirit, and where the Spirit of the Lord is, there is freedom.' — 2 Corinthians 3:17"
    },
    "fathers-day": {
        title: "Happy Father's Day! ౨ৎ",
        message: "Honoring the dedication, guidance, and strength of fathers and reflecting on our Heavenly Father's perfect love."
    },
    "world-cup": {
        title: "World Cup Winner Prediction ⚽",
        message: "Lock in your prediction for the winning team!"
    },
    "july-fourth": {
        title: "Happy 4th of July! 🎆",
        message: "Celebrating freedom, community, and His abundant blessings upon us."
    },
    "labor-day": {
        title: "Happy Labor Day! 🌾",
        message: "Taking a peaceful pause to rest and reflect on God's faithful provision in our work and daily life."
    },
    "veterans-day": {
        title: "Veterans Day 🎖️",
        message: "Honoring and praying for all who served our country with bravery, dedication, and honor."
    },
    "thanksgiving": {
        title: "Happy Thanksgiving! 🦃",
        message: "Giving thanks for His endless goodness and love. 'Give thanks to the Lord, for he is good; his love endures forever.' — Psalm 107:1"
    },
    "advent": {
        title: "Blessed Advent Season! 🕯️",
        message: "A sacred time of expectation, hope, and waiting as we prepare our hearts to celebrate the birth of our Savior."
    },
    "christmas": {
        title: "Merry Christmas! 🎄",
        message: "Celebrating the greatest Gift of all: God with us. 'For unto us a child is born, unto us a son is given...' — Isaiah 9:6"
    },
    "new-years-eve": {
        title: "New Year's Eve ౨ৎ",
        message: "Reflecting on God's faithfulness through every season of the past year and looking forward to the future with hope."
    },
    "daylight-savings": {
        title: "Daylight Savings ☀️",
        message: "Enjoying the warm sunlight and the beautiful rhythms of His creation. 'The heavens declare the glory of God; the skies proclaim the work of his hands.' — Psalm 19:1"
    }
};
