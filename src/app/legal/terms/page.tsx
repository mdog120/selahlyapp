export default function TermsPage() {
    return (
        <div className="prose prose-stone max-w-none">
            <h1 className="font-serif text-3xl md:text-4xl text-warm-cocoa mb-2">Terms of Service</h1>
            <p className="text-warm-grey/60 text-lg mb-8 font-serif italic">The rules that keep our community kind and safe.</p>

            <h3>1. The Golden Rule</h3>
            <p>
                Selahly is a space for encouragement, faith, and growth. By using this app, you agree to treat everyone with kindness, respect, and dignity. Think of it like a digital living room—don't bring mud in!
            </p>

            <h3 className="text-red-500">2. Zero Tolerance for Bullying</h3>
            <p>
                We do not play around with this. <strong>Bullying, harassment, hate speech, or predatory behavior is strictly forbidden.</strong>
            </p>
            <p>This includes:</p>
            <ul>
                <li>Mean, rude, or threatening comments.</li>
                <li>Make fun of someone's faith, appearance, or background.</li>
                <li>Asking for inappropriate pictures or personal info.</li>
            </ul>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 my-4 not-prose">
                <p className="font-bold text-red-600 text-sm">THE CONSEQUENCE:</p>
                <p className="text-red-600/80 text-sm m-0">
                    If you are caught doing any of the above, your account will be <strong>banned immediately and permanently</strong>. We also report predatory behavior to relevant authorities and parents if necessary.
                </p>
            </div>

            <h3>3. Age Requirement</h3>
            <p>
                You must be at least 13 years old to use Selahly. If we find out you are younger, we will have to delete your account for your own safety.
            </p>

            <h3>4. Your Content</h3>
            <p>
                You own what you post. However, by posting in public areas (like the Velvet Vault), you give us permission to display it to other users. Don't post anything you wouldn't want your grandmother (or Jesus!) to read.
            </p>

            <h3>5. Reporting Bad Behavior</h3>
            <p>
                If you see something that makes you uncomfortable, <strong>REPORT IT</strong> immediately. There is a report button on every post and profile. Use it. We review every single report.
            </p>
        </div>
    );
}
