import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google"; // Elegant serif + clean sans
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Selahly | Digital Sanctuary",
  description: "A peaceful digital pause for faith, sisterhood, and inspiration.",
  icons: {
    icon: '/brand-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${outfit.variable} antialiased bg-warm-paper text-warm-grey`}
      >
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 pt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
