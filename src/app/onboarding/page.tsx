"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { BowLogo } from "@/components/ui/BowLogo";

const STATEMENT_OF_FAITH = [
    {
        title: "Trinity",
        content: "It is the testimony of both the Old and New Testaments and of the Christian Church that God is both One and Triune. The biblical revelation testifies that there is only one God and that He is eternally existent in three persons—Father, Son, and Holy Spirit. God the Father is the creator and sustainer of all things, and He created the universe in love. He created man in His own image for fellowship and called man back to Himself through Christ after the rebellion and fall of man. The Son Jesus Christ is eternally God. He was together with the Father and the Holy Spirit from the beginning, and through Him all things were made. For man’s redemption, He left heaven and became incarnate by the Holy Spirit through the virgin Mary; henceforth, He is forever one Christ with two natures—God and man—in one person. The Holy Spirit is God, the Lord and giver of life, who was active in the Old Testament and given to the Church in fullness at Pentecost. He empowers the saints for service and witness, cleanses man from the old nature and conforms us to the image of Christ. The baptism in the Holy Spirit, subsequent to conversion, releases the fullness of the Spirit and is evidenced by the fruits and gifts of the Holy Spirit."
    },
    {
        title: "Scripture",
        content: "We affirm that the Bible, containing the Old and New Testaments, is alone the only infallible, inspired Word of God, and that its authority is ultimate, final, and eternal. It cannot be added to, subtracted from, or superseded in any regard. The Bible is the source of all doctrine, instruction, correction, and reproof. It contains all that is needed for guidance in godliness and practical Christian conduct."
    },
    {
        title: "Devil",
        content: "We believe in the scripture that there is a devil, who seeks the downfall of every man. He brought sickness, sin and death into the world. He seeks the destruction of those who exercise their faith in the Lord Jesus. However, a time would soon come when he will be thrown into the pit and chained for one thousand years, and after this, he will be put into the lake of fire where he will remain suffering together with his followers for ever and ever."
    },
    {
        title: "Church",
        content: "The goal of the Church is to make disciples of all nations and to present the saints complete in Christ. The five-fold ministry of Ephesians 4 governs the Church, the offices of elder and deacon, as well as other offices mentioned in scripture. Church policy is a balance between congregation and eldership authority, emphasizing the final authority of the Church leadership. It is essential to the life of the Church that scriptural patterns of discipline are practiced and that oversight for Church discipline, individual and corporate, is exercised by the leadership of the Church."
    },
    {
        title: "Atonement",
        content: "Christ’s vicarious death on the cross paid the penalty for the sins of the whole world, but its benefits are only applicable to those who receive Jesus as their personal Savior. Healing—body, soul, and spirit—and all of God’s provisions for His saints, are provided for in the atonement, but these must be appropriated."
    },
    {
        title: "Salvation",
        content: "The Word of God declares clearly that salvation is a free gift of God, based on the merits of the death of His Son, and is appropriated by faith. Salvation is effected by personal repentance, belief in the Lord Jesus (justification), and personal acceptance of Him into one’s life as Lord and Savior (regeneration). The new life in Christ includes the privileges of adoption and inheritance in the kingdom of God’s beloved Son. Salvation is an act of free will in response to God’s personal love for mankind. It is predestined only in the sense that God, through His omniscience, foreknew those who would choose Him. It is secure in the eternal, unchanging commitment of God who does not lie and is forever the same. Salvation should produce an active lifestyle of loving obedience and service to Jesus Christ our Savior."
    },
    {
        title: "Sanctification",
        content: "We affirm Sanctification is another grace of God by which our souls are progressively and completely cleansed. This is the second accomplishment of the grace which through our faith in the Blood of Jesus Christ is wrought after we have been justified and free from our sins or regenerated."
    },
    {
        title: "Christian Life",
        content: "We believe that the Scriptures portray the life of the saint in this world to be one of balance between what is imputed to us as Christians and what is imparted to us according to our faith and maturity. Hence, God’s provision for His children is total, and the promises are final and forever. The shortcomings of the individual and of the Church are because of the still progressing sanctification of the saints. The Christian life is filled with trials, tests, and warfare against a spiritual enemy. For those abiding in Christ until their deaths or His return, the promises of eternal blessing in the presence of God are assured. To remain faithful through all circumstances of life requires dependence upon the Holy Spirit and a willingness to die to personal desires and passions."
    },
    {
        title: "Baptism & the Holy Communion",
        content: "The Word of God enjoins on the Church two perpetual ordinances of the Lord Jesus Christ. The first, baptism by immersion, is the outward sign of what God has already done in the individual’s life and is a testimony to all that the person now belongs to Jesus. It is identification with Jesus and is effected in the name of the Father, the Son, and the Holy Spirit. The Holy Communion is a commemoration of the death of the Lord and is done in remembrance of Him until He comes again; it is a sign of our participation in Him. Both institutions are restricted to those who are believers."
    },
    {
        title: "Baptism of the Holy Spirit",
        content: "We believe the Holy Spirit is the promise of the Father. It is God’s gift to every believer and His baptism is evident through speaking of tongues."
    },
    {
        title: "Prayer",
        content: "We believe no man can be greater than his prayer life. A prayer-less individual is indirectly declaring his independence from God. Every Christian without condemnation of heart has a right to thank God and be in adoration and in prayer unto the Lord always. It is God’s plan and order that we should pray to receive the blessings He has promised us."
    },
    {
        title: "Restitution",
        content: "We affirm restitution to be a sign of true repentance. This is payment for what is damaged. Whatever cannot give us a clear conscience before man and God should be restituted without delay."
    },
    {
        title: "Eschatology",
        content: "We affirm the bodily, personal, second coming of the Lord Jesus Christ, the resurrection of the saints, the millennium, and the final judgment. The final judgment will determine the eternal status of both the saints and the unbelievers, determined by their relationship to Jesus Christ. We affirm with the Bible the final state of the new heavens and the new earth."
    }
];

const REFERRAL_OPTIONS = [
    "Instagram",
    "TikTok",
    "Friend",
    "Search",
    "Other"
];

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState<"referral" | "covenant">("referral");
    const [referralSource, setReferralSource] = useState("");
    const [referralDetails, setReferralDetails] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleReferralSubmit = () => {
        setStep("covenant");
    };

    const handleAccept = async () => {
        setSubmitting(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // Update profile with referral and covenant acceptance
            const { error } = await supabase
                .from("profiles")
                .update({
                    accepted_code_of_conduct: true,
                    referral_source: referralSource,
                    referral_details: referralDetails
                })
                .eq("id", user.id);

            if (error) throw error;

            // Redirect to home/dashboard
            router.push("/home"); // or /home depending on final structure
        } catch (error) {
            console.error("Error accepting code of conduct:", error);
            setSubmitting(false);
        }
    };

    if (step === "referral") {
        return (
            <div className="min-h-screen bg-warm-paper text-warm-grey flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full glass-card p-8 rounded-3xl relative overflow-hidden animate-fade-in-up">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-soft-blush/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="text-center mb-8 relative z-10">
                        <BowLogo className="mx-auto mb-4 text-[#D4A5A5]" size="60px" />
                        <h1 className="font-serif text-3xl text-warm-cocoa mb-2">Welcome, Sister.</h1>
                        <p className="text-warm-grey/70">We'd love to know how you found ur way here.</p>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {REFERRAL_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => setReferralSource(option)}
                                className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${referralSource === option
                                        ? "bg-sage-green text-white border-sage-green shadow-lg scale-[1.02]"
                                        : "bg-white/50 border-white/50 hover:border-sage-green/50 hover:bg-white/80"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {referralSource === "Friend" && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-sm font-medium text-warm-grey/80 mb-2">Who invited you?</label>
                            <input
                                type="text"
                                value={referralDetails}
                                onChange={(e) => setReferralDetails(e.target.value)}
                                placeholder="Enter your friend's name..."
                                className="w-full p-3 rounded-xl bg-white/50 border border-white focus:ring-2 ring-sage-green/20 outline-none transition-all"
                            />
                        </div>
                    )}

                    {referralSource === "Other" && (
                        <div className="mt-4 animate-fade-in">
                            <label className="block text-sm font-medium text-warm-grey/80 mb-2">Please specify:</label>
                            <input
                                type="text"
                                value={referralDetails}
                                onChange={(e) => setReferralDetails(e.target.value)}
                                placeholder="Tell us more..."
                                className="w-full p-3 rounded-xl bg-white/50 border border-white focus:ring-2 ring-sage-green/20 outline-none transition-all"
                            />
                        </div>
                    )}

                    <Button
                        onClick={handleReferralSubmit}
                        disabled={!referralSource || (referralSource === "Friend" && !referralDetails)}
                        size="lg"
                        className="w-full mt-8"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-paper text-warm-grey flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full glass-card p-8 rounded-3xl relative overflow-hidden animate-fade-in">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-soft-blush/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="text-center mb-6 relative z-10">
                    <BowLogo className="mx-auto mb-4 text-[#D4A5A5]" size="60px" />
                    <h1 className="font-serif text-3xl text-warm-grey mb-2">Community Covenant</h1>
                    <p className="text-warm-grey/70">Before you enter, please affirm our shared beliefs.</p>
                </div>

                <div className="h-96 overflow-y-auto pr-4 mb-6 space-y-6 custom-scrollbar relative z-10 bg-white/30 p-4 rounded-xl border border-white/50">
                    {STATEMENT_OF_FAITH.map((item, i) => (
                        <div key={i}>
                            <h3 className="font-serif text-lg text-warm-cocoa mb-1">{item.title}</h3>
                            <p className="text-sm text-warm-grey/80 leading-relaxed text-justify">
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <label className="flex items-start gap-3 cursor-pointer group max-w-md">
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 ${accepted ? "bg-sage-green border-sage-green" : "border-warm-grey/30 group-hover:border-sage-green"}`}>
                            {accepted && <span className="text-white text-sm">✓</span>}
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-warm-grey/80 leading-relaxed text-left">
                            I accept the <a href="/legal/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="underline hover:text-warm-cocoa font-semibold">Terms & Conditions</a>, <a href="/legal/privacy" target="_blank" onClick={(e) => e.stopPropagation()} className="underline hover:text-warm-cocoa font-semibold">Privacy Policy</a>, and <a href="/legal/safety" target="_blank" onClick={(e) => e.stopPropagation()} className="underline hover:text-warm-cocoa font-semibold">Safety Guidelines</a>, and I agree to use Selahly for God's purpose.
                        </span>
                    </label>

                    <Button
                        onClick={handleAccept}
                        disabled={!accepted || submitting}
                        size="lg"
                        className="w-full sm:w-auto px-12 mt-2"
                    >
                        {submitting ? "Joining Sanctuary..." : "I Accept"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
