"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Heart, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "./Button";

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DonateModal({ isOpen, onClose }: DonateModalProps) {
    const [step, setStep] = useState<"amount" | "payment" | "success">("amount");
    const [amount, setAmount] = useState<string>("25");
    const [customAmount, setCustomAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"apple" | "card" | null>(null);
    const [processing, setProcessing] = useState(false);
    const [applePaySheet, setApplePaySheet] = useState(false);

    // Card state
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [cardName, setCardName] = useState("");

    const presetAmounts = ["5", "10", "25", "50", "100"];

    const finalAmount = amount === "custom" ? customAmount : amount;

    useEffect(() => {
        if (!isOpen) {
            setStep("amount");
            setAmount("25");
            setCustomAmount("");
            setPaymentMethod(null);
            setProcessing(false);
            setApplePaySheet(false);
            setCardNumber("");
            setExpiry("");
            setCvv("");
            setCardName("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAmountSelect = (val: string) => {
        setAmount(val);
        if (val !== "custom") {
            setCustomAmount("");
        }
    };

    const handleNextToPayment = () => {
        const amt = parseFloat(finalAmount);
        if (isNaN(amt) || amt <= 0) {
            alert("Please choose or enter a valid donation amount.");
            return;
        }
        setStep("payment");
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

    const handleApplePaySubmit = () => {
        setApplePaySheet(true);
    };

    const confirmApplePay = () => {
        setApplePaySheet(false);
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setStep("success");
            triggerConfetti();
        }, 1800);
    };

    const handleCardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cardNumber.replace(/\s/g, "").length < 16) {
            alert("Please enter a valid 16-digit card number.");
            return;
        }
        if (!expiry.match(/^\d{2}\/\d{2}$/)) {
            alert("Please enter a valid expiry date (MM/YY).");
            return;
        }
        if (cvv.length < 3) {
            alert("Please enter a valid CVV.");
            return;
        }
        if (!cardName.trim()) {
            alert("Please enter the cardholder's name.");
            return;
        }

        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setStep("success");
            triggerConfetti();
        }, 2000);
    };

    // Format card number
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 16);
        const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
        setCardNumber(formatted);
    };

    // Format expiry date
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (val.length >= 2) {
            val = val.slice(0, 2) + "/" + val.slice(2);
        }
        setExpiry(val);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Main Dialog */}
            <div className="relative w-full max-w-md bg-warm-paper rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden animate-fade-in-up">
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

                {/* Amount Choice step */}
                {step === "amount" && (
                    <div className="flex flex-col gap-5 z-10">
                        <div className="text-center md:text-left">
                            <p className="text-sm text-warm-grey/80 leading-relaxed">
                                Selahly is 100% ad-free, secure, and made for sisterhood. Your donations help keep our servers running and add neat features for girls worldwide.
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
                                    min="1"
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
                        >
                            CONTINUE TO PAYMENT
                        </Button>
                    </div>
                )}

                {/* Payment Selection & Card Form step */}
                {step === "payment" && (
                    <div className="flex flex-col gap-4 z-10 animate-fade-in">
                        <div className="flex items-center justify-between pb-3 border-b border-warm-grey/5">
                            <span className="text-xs font-bold text-warm-cocoa uppercase tracking-wider">Donation Total</span>
                            <span className="font-serif text-xl font-bold text-warm-grey">${parseFloat(finalAmount).toFixed(2)}</span>
                        </div>

                        {processing ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-10 h-10 text-muted-rose animate-spin" />
                                <p className="text-sm font-medium text-warm-grey/60">Processing gift secure...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Apple Pay Option */}
                                <button
                                    onClick={handleApplePaySubmit}
                                    className="w-full bg-black hover:bg-zinc-900 text-white rounded-2xl py-4 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-md relative"
                                >
                                    <span className="text-xs tracking-wider font-semibold"> Pay with Apple Pay</span>
                                </button>

                                <div className="flex items-center my-1">
                                    <div className="h-px bg-warm-grey/10 flex-1" />
                                    <span className="px-3 text-[10px] uppercase font-bold text-warm-grey/30 tracking-widest">or use credit card</span>
                                    <div className="h-px bg-warm-grey/10 flex-1" />
                                </div>

                                {/* Credit Card Form */}
                                <form onSubmit={handleCardSubmit} className="flex flex-col gap-3.5 text-left">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">Cardholder Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                            placeholder="Emma Watson"
                                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-warm-grey/5 outline-none text-xs text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">Card Number</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={cardNumber}
                                                onChange={handleCardNumberChange}
                                                placeholder="4111 1111 1111 1111"
                                                className="w-full pl-4 pr-10 py-2.5 bg-white rounded-xl border border-warm-grey/5 outline-none text-xs text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-mono"
                                            />
                                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/30" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">Expiry Date</label>
                                            <input
                                                type="text"
                                                required
                                                value={expiry}
                                                onChange={handleExpiryChange}
                                                placeholder="MM/YY"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-warm-grey/5 outline-none text-xs text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1">CVV / CVC</label>
                                            <input
                                                type="password"
                                                required
                                                maxLength={4}
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                placeholder="•••"
                                                className="w-full px-4 py-2.5 bg-white rounded-xl border border-warm-grey/5 outline-none text-xs text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-mono"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-2xl py-5 text-sm font-serif tracking-wider shadow-lg shadow-warm-cocoa/20 mt-2 transition-transform hover:scale-[1.01]"
                                    >
                                        COMPLETE GIFT ౨ৎ
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Back navigation */}
                        {!processing && (
                            <button
                                onClick={() => setStep("amount")}
                                className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline font-bold uppercase tracking-wider"
                            >
                                Back to Amount
                            </button>
                        )}

                        <div className="flex items-center justify-center gap-1.5 text-[9px] text-warm-grey/40 font-medium uppercase tracking-widest mt-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-sage-green" /> SSL Secure Payment Gateway
                        </div>
                    </div>
                )}

                {/* Payment Success state */}
                {step === "success" && (
                    <div className="flex flex-col items-center text-center gap-6 z-10 py-6 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-sage-green/10 border-2 border-sage-green/20 flex items-center justify-center text-sage-green animate-bounce-slow shadow-sm">
                            <Heart className="w-10 h-10 fill-current animate-pulse text-muted-rose" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-serif text-2xl text-warm-cocoa font-medium">Thank You, Sister!</h2>
                            <p className="text-sm text-warm-grey/70 max-w-xs leading-relaxed">
                                Your gift of <strong>${parseFloat(finalAmount).toFixed(2)}</strong> has been successfully received. We are so grateful for your support in sowing into this digital sanctuary!
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

            {/* Apple Pay Dialog Sheet (iOS Native style mockup) */}
            {applePaySheet && (
                <div className="fixed inset-0 z-[110] bg-black/40 flex items-end justify-center p-0 animate-fade-in">
                    <div className="w-full max-w-md bg-stone-900 text-white rounded-t-[2.5rem] p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        {/* Apple Pay Header */}
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <span className="font-sans font-bold text-lg"> Pay</span>
                            <button onClick={() => setApplePaySheet(false)} className="p-1 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5 text-white/50" />
                            </button>
                        </div>

                        {/* Transaction Detail info */}
                        <div className="flex flex-col gap-4 text-sm font-sans">
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">Merchant</span>
                                <span className="font-semibold">Selahly Sanctuary</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">Payment card</span>
                                <span className="font-semibold flex items-center gap-1.5">
                                    <span className="w-5 h-3 bg-red-500 rounded-sm" /> MasterCard (•••• 1294)
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">Contact</span>
                                <span className="font-semibold text-right">emma.watson@icloud.com</span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between items-center text-base">
                                <span className="text-white/60 font-bold uppercase tracking-wider text-xs">Total</span>
                                <span className="font-bold text-xl">${parseFloat(finalAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Trigger Action */}
                        <button
                            onClick={confirmApplePay}
                            className="w-full bg-white hover:bg-white/90 text-black py-4 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.01] active:scale-95 shadow-lg"
                        >
                            <span className="font-sans font-bold text-sm">Pay with Touch ID / Face ID</span>
                            <span className="text-[10px] text-black/50 uppercase font-bold tracking-wider">Double Click / Tap to Confirm</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
