import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
    try {
        const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
        if (!stripeSecret) {
            console.error("Stripe Secret Key missing.");
            return NextResponse.json(
                { error: "Stripe configuration error. Please add STRIPE_SECRET_KEY to your .env.local file." },
                { status: 500 }
            );
        }

        // Initialize Stripe inside the handler to prevent build-time crashes when secret key is not set
        const stripe = new Stripe(stripeSecret);

        const body = await request.json();
        const { amount, allowRedirects } = body;

        if (!amount || isNaN(Number(amount))) {
            return NextResponse.json(
                { error: "Invalid or missing donation amount." },
                { status: 400 }
            );
        }

        const amountInCents = Math.round(Number(amount) * 100);

        if (amountInCents < 50) {
            return NextResponse.json(
                { error: "Donation amount must be at least $0.50 (minimum Stripe charge)." },
                { status: 400 }
            );
        }

        const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
            amount: amountInCents,
            currency: "usd",
            description: "Donation to Selahly Digital Sanctuary",
        };

        if (allowRedirects === false) {
            paymentIntentOptions.automatic_payment_methods = {
                enabled: true,
                allow_redirects: "never",
            };
        } else {
            paymentIntentOptions.automatic_payment_methods = {
                enabled: true,
            };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (err: any) {
        console.error("Error creating PaymentIntent:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
