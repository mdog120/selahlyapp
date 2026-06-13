"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Heart, ShieldCheck, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "./Button";
import { loadStripe } from "@stripe/stripe-js/pure";
import { 
    Elements, 
    CardElement, 
    useStripe, 
    useElements, 
    PaymentRequestButtonElement 
} from "@stripe/react-stripe-js";

// Lazy load Stripe to prevent server-side rendering (SSR) crashes
let stripePromise: any = null;
const getStripe = () => {
    if (!stripePromise && typeof window !== "undefined" && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
    const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
    const [amount, setAmount] = useState<string>("25");
    const [customAmount, setCustomAmount] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loadingSecret, setLoadingSecret] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [retrievedAmount, setRetrievedAmount] = useState<number | null>(null);

    const presetAmounts = ["5", "10", "25", "50", "100"];
    const finalAmount = amount === "custom" ? customAmount : amount;

    // Check if key is configured (client-side safe)
    const hasStripeKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    useEffect(() => {
        if (!isOpen) {
            setStep("amount");
            setAmount("25");
            setCustomAmount("");
            setClientSecret(null);
            setLoadingSecret(false);
            setErrorMsg(null);
            setRetrievedAmount(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (typeof window === "undefined" || !isOpen) return;

        const params = new URLSearchParams(window.location.search);
        const redirectStatus = params.get("redirect_status");
        const clientSecretParam = params.get("payment_intent_client_secret");

        if (redirectStatus === "succeeded" && clientSecretParam) {
            const promise = getStripe();
            if (promise) {
                promise.then((stripeInstance: any) => {
                    if (!stripeInstance) return;
                    stripeInstance.retrievePaymentIntent(clientSecretParam).then(({ paymentIntent }: any) => {
                        if (paymentIntent) {
                            setRetrievedAmount(paymentIntent.amount / 100);
                            setStep("success");
                            triggerConfetti();

                            // Clean up URL parameters so a page refresh doesn't trigger the success modal again
                            const newUrl = window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    });
                });
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAmountSelect = (val: string) => {
        setAmount(val);
        if (val !== "custom") {
            setCustomAmount("");
        }
    };

    const handleNextToPayment = async () => {
        const amt = parseFloat(finalAmount);
        if (isNaN(amt) || amt < 0.50) {
            alert("Minimum donation amount is $0.50.");
            return;
        }

        setLoadingSecret(true);
        setErrorMsg(null);
        try {
            const res = await fetch("/api/donate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount: amt }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to initialize checkout.");
            }

            setClientSecret(data.clientSecret);
            setStep("payment");
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "An unexpected error occurred. Please check your credentials.");
        } finally {
            setLoadingSecret(false);
        }
    };

    const triggerConfetti = () => {
        const duration = 2.5 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-fade-in">
            <div className="relative w-full max-w-md bg-warm-paper rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden animate-fade-in">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-muted-rose/10 rounded-bl-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-sage-green/10 rounded-tr-full pointer-events-none" />

                {/* Header */}
                <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">౨ৎ</span>
                        <h3 className="font-serif text-2xl text-warm-cocoa font-semibold">Support Selahly</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-stone-200/50 text-warm-grey/60 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Warning message if Stripe Publishable Key is missing */}
                {!hasStripeKey && step !== "success" && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600 leading-relaxed text-left z-10">
                        <span className="font-bold">Stripe configuration required:</span> Please add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_SECRET_KEY</code> to your <code>.env.local</code> file to enable donations.
                    </div>
                )}

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-600 leading-relaxed text-left z-10 animate-fade-in">
                        {errorMsg}
                    </div>
                )}

                {/* Step 1: Select Amount */}
                {step === "amount" && (
                    <div className="flex flex-col gap-5 z-10">
                        <div className="text-center md:text-left">
                            <p className="text-sm text-warm-grey/80 leading-relaxed">
                                Selahly is a digital sanctuary for sisterhood. Your contributions help cover server costs and maintain an ad-free experience.
                            </p>
                        </div>

                        {/* Preset options */}
                        <div className="grid grid-cols-3 gap-3">
                            {presetAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    onClick={() => handleAmountSelect(amt)}
                                    className={`py-3.5 rounded-2xl border text-sm font-bold transition-all shadow-sm ${
                                        amount === amt
                                            ? "bg-warm-cocoa border-warm-cocoa text-white scale-[1.02]"
                                            : "bg-white border-warm-grey/10 hover:border-warm-cocoa/40 text-warm-cocoa hover:bg-stone-50"
                                    }`}
                                >
                                    ${amt}
                                </button>
                            ))}
                            <button
                                onClick={() => handleAmountSelect("custom")}
                                className={`py-3.5 rounded-2xl border text-sm font-bold transition-all shadow-sm ${
                                    amount === "custom"
                                        ? "bg-warm-cocoa border-warm-cocoa text-white scale-[1.02]"
                                        : "bg-white border-warm-grey/10 hover:border-warm-cocoa/40 text-warm-cocoa hover:bg-stone-50"
                                }`}
                            >
                                Custom
                            </button>
                        </div>

                        {/* Custom Input */}
                        {amount === "custom" && (
                            <div className="relative animate-fade-in">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-grey/40 font-bold text-sm">$</span>
                                <input
                                    type="number"
                                    min="0.50"
                                    step="0.01"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="Enter donation amount"
                                    className="w-full pl-8 pr-4 py-3.5 bg-white rounded-2xl border border-warm-grey/10 outline-none text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-semibold"
                                />
                            </div>
                        )}

                        <Button 
                            className="w-full mt-2 bg-gradient-to-r from-muted-rose to-rose-400 text-white rounded-2xl py-6 font-serif tracking-widest hover:scale-[1.01] transition-transform shadow-lg shadow-muted-rose/25"
                            onClick={handleNextToPayment}
                            disabled={loadingSecret || !hasStripeKey}
                        >
                            {loadingSecret ? (
                                <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING...</span>
                            ) : "CONTINUE TO PAYMENT"}
                        </Button>
                    </div>
                )}

                {/* Step 2: Stripe Payment Form */}
                {step === "payment" && clientSecret && getStripe() && (
                    <div className="flex flex-col gap-4 z-10 animate-fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-warm-grey/5">
                            <span className="text-xs font-bold text-warm-cocoa uppercase tracking-wider">Donation Total</span>
                            <span className="font-serif text-xl font-bold text-warm-grey">${parseFloat(finalAmount).toFixed(2)}</span>
                        </div>

                        <Elements stripe={getStripe()} options={{ clientSecret }}>
                            <StripeCheckoutForm 
                                amount={finalAmount}
                                clientSecret={clientSecret}
                                onSuccess={() => {
                                    setStep("success");
                                    triggerConfetti();
                                }}
                            />
                        </Elements>

                        <button
                            onClick={() => setStep("amount")}
                            className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline font-bold uppercase tracking-wider text-center"
                        >
                            Back to Amount
                        </button>
                    </div>
                )}

                {/* Step 3: Success Screen */}
                {step === "success" && (
                    <div className="flex flex-col items-center text-center gap-6 z-10 py-6 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-sage-green/10 border-2 border-sage-green/20 flex items-center justify-center text-sage-green animate-bounce-slow shadow-sm">
                            <Heart className="w-10 h-10 fill-current animate-pulse text-muted-rose" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-serif text-2xl text-warm-cocoa font-medium">Thank You, Sister!</h2>
                            <p className="text-sm text-warm-grey/70 max-w-xs leading-relaxed">
                                Your donation of <strong>${retrievedAmount !== null ? retrievedAmount.toFixed(2) : parseFloat(finalAmount).toFixed(2)}</strong> has been processed successfully. Thank you for sowing into this digital sanctuary!
                            </p>
                        </div>
                        <Button 
                            className="bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-2xl px-12 py-5 text-xs font-serif tracking-wider shadow-lg shadow-warm-cocoa/10 transition-transform active:scale-95 mt-2"
                            onClick={onClose}
                        >
                            CLOSE WINDOW
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

interface StripeCheckoutFormProps {
    amount: string;
    clientSecret: string;
    onSuccess: () => void;
}

function StripeCheckoutForm({ amount, clientSecret, onSuccess }: StripeCheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    
    const [cardName, setCardName] = useState("");
    const [processing, setProcessing] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<any>(null);

    // Initializing Stripe Payment Request for Apple Pay/Google Pay
    useEffect(() => {
        if (!stripe) return;

        // Skip Apple Pay check in standalone PWA/WebView mode to prevent external browser breakout redirects
        const isStandalone = typeof window !== "undefined" && (
            window.matchMedia('(display-mode: standalone)').matches || 
            (window.navigator as any).standalone
        );
        const isWebView = typeof window !== "undefined" && 
            /iPhone|iPad|iPod/.test(navigator.userAgent) && 
            !/Safari/.test(navigator.userAgent);

        if (isStandalone || isWebView) {
            console.log("Stripe Payment Request Button skipped in standalone PWA/WebView mode to prevent browser breakout.");
            return;
        }

        const pr = stripe.paymentRequest({
            country: "US",
            currency: "usd",
            total: {
                label: "Donation to Selahly",
                amount: Math.round(parseFloat(amount) * 100),
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        pr.canMakePayment().then((result) => {
            if (result) {
                setPaymentRequest(pr);
            }
        });

        pr.on("paymentmethod", async (ev) => {
            const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: ev.paymentMethod.id },
                { handleActions: false }
            );

            if (confirmError) {
                ev.complete("fail");
                alert(confirmError.message);
            } else {
                ev.complete("success");
                if (paymentIntent && paymentIntent.status === "succeeded") {
                    onSuccess();
                }
            }
        });
    }, [stripe, amount, clientSecret]);

    const handleCardSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setProcessing(false);
            return;
        }

        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: cardName.trim(),
                    },
                },
            });

            if (error) {
                console.error("Card confirmation error:", error);
                alert(error.message || "Failed to confirm card payment.");
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                onSuccess();
            }
        } catch (err: any) {
            console.error("Payment submission failed:", err);
            alert(err.message || "Payment submission failed.");
        } finally {
            setProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                color: "#4A4A4A",
                fontFamily: "var(--font-outfit), sans-serif",
                fontSize: "14px",
                "::placeholder": {
                    color: "#C0C0C0",
                },
            },
            invalid: {
                color: "#EF4444",
                iconColor: "#EF4444",
            },
        },
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Real Apple Pay / Google Pay button */}
            {paymentRequest && (
                <div className="flex flex-col gap-2">
                    <PaymentRequestButtonElement options={{ paymentRequest }} />
                    <div className="flex items-center my-1">
                        <div className="h-px bg-warm-grey/10 flex-1" />
                        <span className="px-3 text-[9px] uppercase font-bold text-warm-grey/30 tracking-widest">or use credit card</span>
                        <div className="h-px bg-warm-grey/10 flex-1" />
                    </div>
                </div>
            )}

            {processing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-10 h-10 text-muted-rose animate-spin" />
                    <p className="text-xs font-medium text-warm-grey/60">Processing payment securely...</p>
                </div>
            ) : (
                <form onSubmit={handleCardSubmit} className="flex flex-col gap-3.5 text-left">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">Cardholder Name</label>
                        <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Emma Watson"
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-warm-grey/5 outline-none text-xs text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-semibold"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">Card Details</label>
                        <div className="p-3 bg-white rounded-xl border border-warm-grey/5 focus-within:ring-2 focus-within:ring-muted-rose/20 transition-all">
                            <CardElement options={cardElementOptions} />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={!stripe}
                        className="w-full bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-2xl py-5 text-sm font-serif tracking-wider shadow-lg shadow-warm-cocoa/20 mt-2 transition-transform hover:scale-[1.01]"
                    >
                        COMPLETE GIFT ౨ৎ
                    </Button>
                </form>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-warm-grey/40 font-medium uppercase tracking-widest mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-green" /> SSL Secure Stripe Payments
            </div>
        </div>
    );
}
