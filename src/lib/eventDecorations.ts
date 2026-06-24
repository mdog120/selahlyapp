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
