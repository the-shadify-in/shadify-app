import type { Metadata } from "next";
import { Marcellus, Plus_Jakarta_Sans, Cinzel } from "next/font/google";
import "./globals.css";

const marcellus = Marcellus({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
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
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Celebrate with Shadify — Luxury Digital Wedding Invitations & RSVPs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Celebrate with Shadify — Luxury Digital Wedding Invitations & RSVPs",
    description:
      "Every ceremony, direction, family RSVP, and direct UPI shagun in one link. Handcrafted by our WhatsApp concierge.",
    images: ["/og-image.jpg"],
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
        className={`${plusJakarta.variable} ${marcellus.variable} ${cinzel.variable} font-sans antialiased selection:bg-[#D6246E]/15 selection:text-[#1F1A2E]`}
      >
        {children}
      </body>
    </html>
  );
}
