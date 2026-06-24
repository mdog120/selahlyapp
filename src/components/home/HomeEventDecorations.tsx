"use client";

import { useState } from "react";

type DecorationKind =
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

function getDecorationKind(date: Date): DecorationKind | null {
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

const DECORATIONS: Record<DecorationKind, { items: string[]; className: string }> = {
    "new-year": {
        items: ["✦", "✺", "✧", "✹", "✦", "✺"],
        className: "animate-[selahly-spark_1.8s_ease-in-out_infinite] text-warm-cocoa"
    },
    valentines: {
        items: ["♡", "♥", "♡", "♥", "♡", "♥"],
        className: "animate-[selahly-float_7s_ease-in-out_infinite] text-muted-rose"
    },
    "palm-sunday": {
        items: ["🌿", "✿", "🌿", "❀", "🌿", "✿"],
        className: "animate-[selahly-float_8s_ease-in-out_infinite]"
    },
    "world-cup": {
        items: ["⚽", "⚽", "⚽", "⚽", "⚽", "⚽"],
        className: "animate-[selahly-float_7s_ease-in-out_infinite]"
    },
    "july-fourth": {
        items: ["✦", "✺", "✦", "✹", "✦", "✺"],
        className: "animate-[selahly-spark_1.8s_ease-in-out_infinite] text-muted-rose"
    },
    thanksgiving: {
        items: ["🦃", "🍂", "🦃", "🍁", "🦃"],
        className: "animate-[selahly-float_8s_ease-in-out_infinite]"
    },
    christmas: {
        items: ["❄", "❅", "❄", "❅", "❄", "❅", "❄"],
        className: "animate-[selahly-snow_8s_linear_infinite] text-sky-200"
    },
    easter: {
        items: ["🐰", "🥚", "🐇", "🥚", "🐰", "🌸"],
        className: "animate-[selahly-hop_6s_ease-in-out_infinite]"
    },
    "mothers-day": {
        items: ["✿", "♡", "❀", "♡", "✿", "❁"],
        className: "animate-[selahly-float_8s_ease-in-out_infinite] text-muted-rose/70"
    },
    "memorial-day": {
        items: ["★", "✦", "★", "✧", "★", "✦"],
        className: "animate-[selahly-spark_2.4s_ease-in-out_infinite] text-sage-green"
    },
    juneteenth: {
        items: ["✦", "★", "✺", "★", "✦", "✺"],
        className: "animate-[selahly-spark_2s_ease-in-out_infinite] text-deep-velvet"
    },
    "fathers-day": {
        items: ["★", "♡", "★", "✦", "★", "♡"],
        className: "animate-[selahly-float_8s_ease-in-out_infinite] text-warm-cocoa/65"
    },
    "labor-day": {
        items: ["✦", "★", "✦", "★", "✦", "★"],
        className: "animate-[selahly-float_8s_ease-in-out_infinite] text-warm-grey/45"
    },
    "veterans-day": {
        items: ["★", "✦", "★", "✧", "★", "✦"],
        className: "animate-[selahly-spark_2.2s_ease-in-out_infinite] text-warm-cocoa"
    },
    advent: {
        items: ["✦", "✧", "✦", "✧", "✦", "✧"],
        className: "animate-[selahly-spark_2.8s_ease-in-out_infinite] text-muted-rose/70"
    },
    "new-years-eve": {
        items: ["✹", "✦", "✺", "✧", "✹", "✦"],
        className: "animate-[selahly-spark_1.6s_ease-in-out_infinite] text-warm-cocoa"
    },
    "daylight-savings": {
        items: ["✿", "❀", "✿", "❁", "✿", "❀"],
        className: "animate-[selahly-float_9s_ease-in-out_infinite] text-muted-rose/50"
    }
};

const POSITIONS = [
    "left-[3%] top-[12rem] md:left-[4%] md:top-[8rem]",
    "left-[88%] top-[9rem] md:left-[16%] md:top-[18rem]",
    "left-[8%] top-[25rem] md:left-[31%] md:top-[6rem]",
    "left-[84%] top-[31rem] md:left-[70%] md:top-[15rem]",
    "left-[4%] top-[42rem] md:left-[86%] md:top-[7rem]",
    "left-[86%] top-[47rem] md:left-[95%] md:top-[22rem]",
    "left-[50%] top-[52rem] md:left-[47%] md:top-[26rem]"
];

const WORLD_CUP_TEAMS = ["Brazil", "USA", "France", "Argentina", "England", "Spain"];

export function HomeEventDecorations() {
    const [isWorldCupPromptOpen, setIsWorldCupPromptOpen] = useState(false);
    const [teamPick, setTeamPick] = useState<string | null>(null);
    const kind = getDecorationKind(new Date());
    if (!kind) return null;

    const decoration = DECORATIONS[kind];
    const isWorldCup = kind === "world-cup";

    return (
        <>
            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[34rem] overflow-hidden"
                aria-hidden={isWorldCup ? undefined : "true"}
            >
                {decoration.items.map((item, index) => {
                    const className = `absolute select-none text-2xl opacity-70 md:text-3xl ${POSITIONS[index % POSITIONS.length]} ${decoration.className}`;
                    const style = {
                        animationDelay: `${index * 0.55}s`
                    };

                    if (isWorldCup) {
                        return (
                            <button
                                key={`${kind}-${index}`}
                                type="button"
                                aria-label="Make a World Cup winner prediction"
                                onClick={() => setIsWorldCupPromptOpen(true)}
                                className={`pointer-events-auto cursor-pointer rounded-full transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-muted-rose/50 ${className}`}
                                style={style}
                            >
                                {item}
                            </button>
                        );
                    }

                    return (
                        <span
                            key={`${kind}-${index}`}
                            className={className}
                            style={style}
                        >
                            {item}
                        </span>
                    );
                })}
            </div>

            {isWorldCupPromptOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-grey/20 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-warm-paper p-6 text-center shadow-xl">
                        <p className="text-4xl" aria-hidden="true">⚽</p>
                        <h2 className="mt-3 font-serif text-2xl text-warm-cocoa">
                            Which team do you think will win?
                        </h2>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            {WORLD_CUP_TEAMS.map((team) => (
                                <button
                                    key={team}
                                    type="button"
                                    onClick={() => setTeamPick(team)}
                                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                                        teamPick === team
                                            ? "border-muted-rose/50 bg-soft-blush text-warm-cocoa"
                                            : "border-warm-grey/10 bg-white/70 text-warm-grey/70 hover:border-muted-rose/35 hover:text-warm-cocoa"
                                    }`}
                                >
                                    {team}
                                </button>
                            ))}
                        </div>

                        {teamPick && (
                            <p className="mt-4 rounded-2xl bg-white/65 px-4 py-3 text-sm font-medium text-warm-grey">
                                Locked in: {teamPick}. We will see.
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsWorldCupPromptOpen(false)}
                            className="mt-5 text-xs font-bold uppercase tracking-widest text-warm-grey/50 transition-colors hover:text-warm-cocoa"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
