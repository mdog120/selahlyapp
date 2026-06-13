import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit, Caveat } from "next/font/google"; // Elegant serif + clean sans + cozy handwriting
import { LayoutContent } from "@/components/LayoutContent";
import { BadgeProvider } from "@/context/BadgeContext";
import { GlobalAlertProvider } from "@/components/ui/GlobalAlertProvider";
import { StoryAuraProvider } from "@/context/StoryAuraContext";
import Script from "next/script";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Selahly | Digital Sanctuary",
  description: "A peaceful digital pause for faith, sisterhood, and inspiration.",
  icons: {
    icon: '/logo-v2.svg',
    apple: '/logo-v2.svg',
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Selahly",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FDFBF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
      </head>
      <body
        className={`${playfair.variable} ${outfit.variable} ${caveat.variable} antialiased bg-warm-paper text-warm-grey`}
      >
        <BadgeProvider>
          <GlobalAlertProvider>
            <StoryAuraProvider>
              <LayoutContent>
                {children}
              </LayoutContent>
            </StoryAuraProvider>
          </GlobalAlertProvider>
        </BadgeProvider>
      </body>
    </html>
  );
}
