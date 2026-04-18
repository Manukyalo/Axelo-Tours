"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { 
    Download, 
    Smartphone, 
    Bell, 
    MessageSquare, 
    ShieldAlert, 
    CheckCircle2,
    Apple
} from "lucide-react";

export function AppDownloadSection() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const downloadUrl = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL || "https://axelo-tours.com/download";

  useEffect(() => {
    QRCode.toDataURL(downloadUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#1A6B3A",
        light: "#FFFFFF",
      },
    })
    .then((url) => setQrCodeUrl(url))
    .catch((err) => console.error(err));
  }, [downloadUrl]);

  return (
    <section className="py-32 bg-white relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-1/2 left-0 w-full h-full bg-primary/5 -skew-y-6 -translate-y-1/2" />

        <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-20">
                {/* Visuals Side */}
                <div className="flex-1 w-full flex justify-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative w-full max-w-sm aspect-[9/19] bg-brand-dark rounded-[3rem] border-8 border-gray-100 shadow-2xl shadow-primary/20 overflow-hidden"
                    >
                        {/* Status Bar */}
                        <div className="h-10 bg-brand-dark flex items-center justify-center p-2">
                            <div className="w-16 h-4 bg-gray-900 rounded-full" />
                        </div>
                        {/* Mock App Interface */}
                        <div className="p-6 bg-background h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-display font-bold text-xl text-primary">AXELO</span>
                                <div className="w-8 h-8 rounded-full bg-primary/10" />
                            </div>
                            <div className="space-y-4">
                                <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="h-20 bg-primary/5 rounded-2xl flex flex-col items-center justify-center p-4">
                                        <MessageSquare className="w-5 h-5 text-primary mb-2" />
                                        <div className="h-2 w-12 bg-primary/20 rounded" />
                                    </div>
                                    <div className="h-20 bg-accent/5 rounded-2xl flex flex-col items-center justify-center p-4">
                                        <ShieldAlert className="w-5 h-5 text-accent mb-2" />
                                        <div className="h-2 w-12 bg-accent/20 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Content Side */}
                <div className="flex-1 text-center lg:text-left">
                    <h2 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-8">
                        Take Axelo Tours <span className="text-primary italic">With You</span>.
                    </h2>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-12 max-w-lg">
                        Our native app ensures you're never alone in the wild. Access your itinerary offline, get live updates, and talk to Zara anytime.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                        {[
                            { icon: CheckCircle2, text: "Offline Itineraries" },
                            { icon: Bell, text: "Live Trip Updates" },
                            { icon: MessageSquare, text: "Direct Chat with Zara" },
                            { icon: ShieldAlert, text: "Emergency SOS Support" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center space-x-3 text-foreground font-bold lg:justify-start justify-center">
                                <item.icon className="w-5 h-5 text-primary" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
                        {/* Buttons */}
                        <div className="flex flex-col space-y-4">
                            <a 
                                href={downloadUrl}
                                className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                <Smartphone className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold opacity-70">Download for</p>
                                    <p className="text-lg">Android APK</p>
                                </div>
                            </a>
                            <div className="px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 bg-gray-100 text-gray-400 cursor-not-allowed opacity-70">
                                <Apple className="w-6 h-6" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-bold">App Store</p>
                                    <p className="text-lg">Coming Soon</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        {qrCodeUrl && (
                            <div className="hidden sm:block text-center space-y-3">
                                <div className="p-3 bg-white rounded-3xl border border-border/40 shadow-xl shadow-primary/5">
                                    <Image src={qrCodeUrl} alt="Download QR Code" width={140} height={140} className="rounded-xl" />
                                </div>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Scan to Download</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
}
