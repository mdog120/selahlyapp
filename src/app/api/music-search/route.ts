import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || "";

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`;

    try {
        const res = await fetch(itunesUrl);
        const data = await res.json();
        return NextResponse.json(data, {
            headers: { "Cache-Control": "public, max-age=3600" },
        });
    } catch (err: any) {
        console.error("iTunes search proxy failed:", err);
        return NextResponse.json(
            { results: [], error: "search failed" },
            { status: 502 }
        );
    }
}
