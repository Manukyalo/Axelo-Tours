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
  title: "Axelo Tours & Safari | Premium Kenya Safari Experiences",
  description: "Experience the wild like never before. AI-powered safari planning, luxury tented camps, and seamless bookings for the modern explorer.",
  keywords: ["Safari", "Kenya", "Maasai Mara", "AI Travel", "Luxury Safari", "Amboseli"],
  openGraph: {
    title: "Axelo Tours & Safari | Premium Kenya Safari Experiences",
    description: "AI-powered safari planning and luxury experiences in Kenya.",
    url: "https://axelo-tours.vercel.app",
    siteName: "Axelo Tours",
    locale: "en_US",
    type: "website",
  },
};

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
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
