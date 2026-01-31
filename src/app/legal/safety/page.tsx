export default function SafetyPage() {
    return (
        <div className="prose prose-stone max-w-none">
            <h1 className="font-serif text-3xl md:text-4xl text-warm-cocoa mb-2">Safety & Risk Assessment</h1>
            <p className="text-warm-grey/60 text-lg mb-8 font-serif italic">How we identified risks and built features to protect you.</p>

            <p className="lead">
                This document is our <strong>Data Protection Impact Assessment (DPIA)</strong>. It sounds fancy, but it just means we sat down, thought about how this app could be risky, and built specific features to fix those risks.
            </p>

            <h3>Risk 1: Strangers Messaging You</h3>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 not-prose mb-6">
                <h4 className="font-bold text-green-800 text-sm uppercase tracking-wide mb-2">How We Fixed It:</h4>
                <ul className="list-disc list-inside text-green-900/80 space-y-2">
                    <li><strong>Friend-Only DMs:</strong> No one can message you unless you have accepted their friend request.</li>
                    <li><strong>Request Filtering:</strong> You can ignore or decline friend requests without the other person knowing.</li>
                    <li><strong>No "Nearby" Search:</strong> We do not allow searching for users by location.</li>
                </ul>
            </div>

            <h3>Risk 2: Inappropriate Content</h3>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 not-prose mb-6">
                <h4 className="font-bold text-green-800 text-sm uppercase tracking-wide mb-2">How We Fixed It:</h4>
                <ul className="list-disc list-inside text-green-900/80 space-y-2">
                    <li><strong>Curated Vibe Board:</strong> The Vibe Board content is hand-picked by our team, so you won't stumble upon bad stuff.</li>
                    <li><strong>Reporting Tools:</strong> Every post and comment has a "Report" button that alerts our moderators instantly.</li>
                    <li><strong>Automated Filters:</strong> We use filters to block common bad words and bullying language automatically.</li>
                </ul>
            </div>

            <h3>Risk 3: Journal Privacy Leaks</h3>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 not-prose mb-6">
                <h4 className="font-bold text-green-800 text-sm uppercase tracking-wide mb-2">How We Fixed It:</h4>
                <ul className="list-disc list-inside text-green-900/80 space-y-2">
                    <li><strong>Row Level Security (RLS):</strong> We use database-level security rules that physically prevent anyone else's account from calling up your journal entries.</li>
                    <li><strong>Zero Public Access:</strong> There is no feature in the app to "share" a journal entry publicly. It is designed to be private by default.</li>
                </ul>
            </div>

            <h3>Our Promise</h3>
            <p>
                Your safety is more important than our app's growth. We will never sell your personal data to advertisers, and we will always listen when you tell us something feels unsafe.
            </p>
        </div>
    );
}
