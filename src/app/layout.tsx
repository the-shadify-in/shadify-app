import type { Metadata } from "next";
import { Playfair_Display, Outfit, Cinzel } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shadify.in"),
  title: {
    default: "Celebrate with Shadify — Luxury Digital Wedding Invitations & RSVPs",
    template: "%s | Shadify",
  },
  description:
    "Celebrate with Shadify. Every ceremony, Google Maps direction, 1-tap family RSVP, and direct UPI shagun blessing in one royal link. Handcrafted by our WhatsApp concierge.",
  openGraph: {
    title: "Celebrate with Shadify — Luxury Digital Wedding Invitations & RSVPs",
    description:
      "Every ceremony, direction, family RSVP, and direct UPI shagun in one royal link. No app download, 5-year hosting.",
    url: "https://shadify.in",
    siteName: "Shadify",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${outfit.variable} ${playfair.variable} ${cinzel.variable} font-sans antialiased selection:bg-[#D6246E]/15 selection:text-[#1F1A2E]`}
      >
        {children}
      </body>
    </html>
  );
}
