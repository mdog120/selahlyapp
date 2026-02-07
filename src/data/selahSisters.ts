export type SelahSister = {
    name: string;
    biography: string;
    book: string;
    chapter: string;
};

export const selahSisters: SelahSister[] = [
    {
        name: "Esther",
        biography: "A queen of courage who saved her people through prayer and bold action. She reminds us that we were made for such a time as this.",
        book: "Esther",
        chapter: "4"
    },
    {
        name: "Ruth",
        biography: "A woman of loyalty and redemption. Her story is a beautiful testament to God's providence and the power of steadfast love.",
        book: "Ruth",
        chapter: "1"
    },
    {
        name: "Deborah",
        biography: "A prophetess and judge who led with wisdom and fire. She shows us the strength of a woman who fully trusts in God's command.",
        book: "Judges",
        chapter: "4"
    },
    {
        name: "Hannah",
        biography: "A mother of fervent prayer. Her cry to the Lord birthed a prophet, teaching us that God hears the whispers of a broken heart.",
        book: "1 Samuel",
        chapter: "1"
    },
    {
        name: "Mary Magdalene",
        biography: "A devoted follower who was the first to witness the Resurrection. She represents the beauty of a life transformed by grace.",
        book: "John",
        chapter: "20"
    }
];

export function getDailySelahSister(): SelahSister {
    // Simple rotation based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return selahSisters[dayOfYear % selahSisters.length];
}
