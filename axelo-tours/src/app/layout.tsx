import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://axelotours.co.ke"),
  title: {
    default: "Axelo Tours & Safari Ltd | Premium Kenya Safari Experiences",
    template: "%s | Axelo Tours",
  },
  description: "Experience the wild like never before. Kenya premier safari company — real-time booking, M-Pesa, expert guides.",
  keywords: ["Safari", "Kenya", "Maasai Mara", "AI Travel", "Luxury Safari", "Amboseli", "M-Pesa Booking"],
  openGraph: {
    title: "Axelo Tours & Safari Ltd | Premium Kenya Safari Experiences",
    description: "Kenya premier safari company — real-time booking, M-Pesa, expert guides.",
    url: "https://axelotours.co.ke",
    siteName: "Axelo Tours",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Axelo Tours & Safari Ltd",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    card: "summary_large_image",
    title: "Axelo Tours & Safari Ltd",
    description: "Kenya premier safari company — real-time booking, M-Pesa, expert guides.",
    images: ["/og-image.png"],
  },
};


import { ChatWidget } from "@/components/chat/ChatWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body bg-background text-foreground selection:bg-primary/20">
        {children}
        <ChatWidget />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
