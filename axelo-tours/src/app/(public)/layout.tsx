import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";
import { Globe, Camera, X, MessageCircle } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      
      {/* Footer */}
      <footer className="bg-brand-dark text-white pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-6 group">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300">
                  A
                </div>
                <span className="font-display font-bold text-2xl tracking-tight text-white transition-colors duration-300">
                  AXELO <span className="text-accent">TOURS</span>
                </span>
              </Link>
              <p className="text-gray-400 leading-relaxed mb-6 font-medium">
                Premier Kenya Safari experience. No traditional office. 100% digital. 100% human-led adventures.
              </p>
              <div className="flex items-center space-x-5">
                {[Globe, Camera, X, MessageCircle].map((Icon, i) => (
                  <a key={i} href="#" className="text-gray-400 hover:text-accent transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Explore</h4>
              <ul className="space-y-4">
                {["Safaris", "Day Trips", "AI Trip Planner", "About Us", "Contact"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Legal</h4>
              <ul className="space-y-4">
                {["Terms of Service", "Privacy Policy", "Refund Policy", "Insurance Info"].map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors duration-300">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Join the Journey</h4>
              <p className="text-gray-400 mb-6 font-medium">Get safari tips and exclusive offers delivered to your inbox.</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your Email" 
                  className="bg-white/5 border border-white/10 rounded-l-lg px-4 py-3 outline-none focus:border-accent flex-grow transition-colors duration-300"
                />
                <button className="bg-primary hover:bg-primary/90 text-white rounded-r-lg px-6 font-bold transition-all duration-300">
                  Go
                </button>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} Axelo Tours & Safari Ltd. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <span className="text-gray-500 text-sm flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>All systems operational</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
