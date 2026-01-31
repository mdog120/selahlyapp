export default function PrivacyPage() {
    return (
        <div className="prose prose-stone max-w-none">
            <h1 className="font-serif text-3xl md:text-4xl text-warm-cocoa mb-2">Privacy Policy</h1>
            <p className="text-warm-grey/60 text-lg mb-8 font-serif italic">Making sure you understand how we protect you.</p>

            <h3>1. Introduction</h3>
            <p>
                Welcome to Selahly! We care big time about your privacy. This document explains what information we collect, why we collect it, and who can see it—but in simple terms that actually make sense.
            </p>

            <h3>2. What Information Do We Collect?</h3>
            <ul>
                <li><strong>Your Profile Basics:</strong> When you sign up, we ask for things like your email, name, and a profile picture. This helps us know it's really you.</li>
                <li><strong>Your Journal Entries:</strong> Everything you write in "Grace & Glow" is stored securely so you can look back on it later.</li>
                <li><strong>Your Messages & Posts:</strong> If you post in the Vault or send a message, we store that text so it can be delivered to your friends.</li>
            </ul>

            <h3>3. Who Can See Your Stuff?</h3>
            <p>This is the most important part!</p>
            <ul>
                <li><strong>Journal Entries:</strong> PRIVATE. Only <strong>you</strong> can see these. Not your friends, not other users. Just you and God.</li>
                <li><strong>Profile Info:</strong> PUBLIC. Your name, bio, and picture can be seen by other users so they can find and friend you.</li>
                <li><strong>Vault Posts:</strong> PUBLIC. Questions you ask in the Velvet Vault are visible to the community so others can answer and encourage you.</li>
                <li><strong>Direct Messages:</strong> PRIVATE. Only the person you are messaging can see these.</li>
            </ul>

            <h3>4. Staying Safe</h3>
            <p>
                We work hard to keep your data safe, but remember: <strong>never share your password</strong> or personal info (like your home address or phone number) in public posts.
            </p>

            <h3>5. Deleting Your Data</h3>
            <p>
                If you ever want to leave Selahly (we'd miss you!), you can delete your account in Settings. This will permanently wipe your journal, profile, and messages from our system.
            </p>

            <div className="mt-8 p-4 bg-sage-green/10 rounded-xl border border-sage-green/20">
                <p className="text-sm text-sage-green font-medium m-0">
                    Last Updated: January 2026<br />
                    Questions? Email us at support@selahly.app
                </p>
            </div>
        </div>
    );
}
