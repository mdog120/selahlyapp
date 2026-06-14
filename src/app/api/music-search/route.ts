import { NextResponse } from "next/server";

const CHRISTIAN_GENRES = /christian|gospel|worship|inspirational|praise|ccm/i;

const CHRISTIAN_ARTISTS = [
    "lecrae", "andy mineo", "nf", "kb", "trip lee", "tedashii", "social club misfits", "gawvi", "nobigdyl", "whatuprg", "derek minor",
    "lauren daigle", "hillsong", "maverick city", "elevation worship", "chris tomlin", "phil wickham", "cece winans", "kirk franklin",
    "tasha cobbs", "tobymac", "casting crowns", "mercyme", "brandon lake", "cody carnes", "kari jobe", "brooke ligertwood",
    "bethel music", "passion", "jesus culture", "crowder", "zach williams", "jeremy camp", "matthew west", "francesca battistelli",
    "natalie grant", "danny gokey", "big daddy weave", "we the kingdom", "cain", "anne wilson", "andrew ripp", "micah tyler",
    "mac powell", "third day", "steven curtis chapman", "michael w. smith", "amy grant", "newsboys", "audio adrenaline", "dc talk",
    "switchfoot", "relient k", "skillet", "red", "flyleaf", "for king & country", "for king and country", "tauren wells",
    "don moen", "sinach", "nathaniel bassey", "mercy chinwo", "ada ehi", "frank edwards", "moses bliss", "dunsin oyekan", "guc",
    "jenn johnson", "bethel", "hymn", "glorious", "hosanna", "maranatha", "shane & shane", "shane and shane", "needtobreathe",
    "koryn hawthorne", "jonathan mcreynolds", "travis greene", "chandler moore", "dante bowe", "naomi raine", "colony house",
    "rend collective", "housefires", "united pursuit", "vertical worship", "planetshakers", "fred hammond", "yolanda adams",
    "donnie mcclurkin", "hezekiah walker", "marvin sapp", "bebe winans", "mary mary", "smokie norful", "richard smallwood",
    "walter hawkins", "andrae crouch", "keith green", "rich mullins", "sandy patti", "larnelle harris", "steve green",
    "john michael talbot", "twila paris", "wayne watson", "ray bolts", "dallas holm", "evie"
];

const CHRISTIAN_KEYWORDS = [
    "worship", "gospel", "hallelujah", "hosanna", "yahweh", "jehovah", "amen", "savior", "saviour", "resurrection",
    "salvation", "redeemer", "hymn", "worshiper", "worshipper", "christlike"
];

function isChristianTrack(track: any): boolean {
    if (!track) return false;
    
    const genre = (track.primaryGenreName || "").toLowerCase();
    if (CHRISTIAN_GENRES.test(genre)) {
        return true;
    }

    const artist = (track.artistName || "").toLowerCase();
    if (CHRISTIAN_ARTISTS.some(name => artist.includes(name))) {
        return true;
    }

    const title = (track.trackName || "").toLowerCase();
    const album = (track.collectionName || "").toLowerCase();
    if (CHRISTIAN_KEYWORDS.some(kw => title.includes(kw) || album.includes(kw))) {
        return true;
    }

    return false;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term") || "";

    // Increase limit to 150 to get a larger candidate pool for filtering
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=150`;

    try {
        const res = await fetch(itunesUrl);
        const data = await res.json();
        
        let filteredResults = [];
        if (data.results && Array.isArray(data.results)) {
            filteredResults = data.results.filter(isChristianTrack).slice(0, 30);
        }

        return NextResponse.json({ results: filteredResults }, {
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

