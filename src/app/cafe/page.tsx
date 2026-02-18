import { CafeGame } from '@/components/cafe/CafeGame';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Selah Cafe | Selahly',
    description: 'Brew, serve, and relax in your own cute cafe!',
};

export default function CafePage() {
    return (
        <main className="min-h-screen bg-stone-900">
            <CafeGame />
        </main>
    );
}
