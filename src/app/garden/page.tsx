import { GardenGrid } from "@/components/garden/GardenGrid";
import { Navbar } from "@/components/Navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Selah Garden | Selahly",
    description: "Grow your faith.",
};

export default function GardenPage() {
    return (
        <main className="min-h-screen bg-soft-paper pb-20">
            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-xl">
                <div className="text-center mb-8 animate-fade-in-up">
                    <h1 className="font-serif text-4xl text-warm-cocoa mb-2">Selah Garden</h1>
                    <p className="text-warm-grey">Plant seeds of scripture and watch them bloom.</p>
                </div>

                <div className="animate-fade-in-up delay-100">
                    <GardenGrid />
                </div>
            </div>
        </main>
    );
}
