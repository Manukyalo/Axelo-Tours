"use client";

import { motion } from "framer-motion";
import { MessageSquare, Sparkles, Send, Bot, User } from "lucide-react";

export function AITripPlannerTeaser() {
  return (
    <section className="py-32 bg-[#FAFAF7] overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Copy Side */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center space-x-2 text-primary font-bold tracking-widest uppercase text-xs mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Itineraries</span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold text-foreground leading-tight mb-8">
              Meet <span className="text-primary italic">Zara</span>. Your AI Safari Expert.
            </h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10">
              Describe your dream safari in natural language. Whether you want a romantic getaway in the Mara or a family adventure in Amboseli, Zara builds your perfect itinerary in seconds.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Instant multi-destination planning",
                "Real-time lodge availability check",
                "Personalized activity recommendations",
                "Budget-conscious travel optimization"
              ].map((item, i) => (
                <li key={i} className="flex items-center space-x-3 text-foreground font-bold">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex items-center space-x-3">
              <MessageSquare className="w-5 h-5" />
              <span>Chat with Zara</span>
            </button>
          </div>

          {/* Chat Preview Side */}
          <div className="flex-1 w-full max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/3] bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-border/40 overflow-hidden flex flex-col"
            >
              {/* Chat Header */}
              <div className="p-6 border-b border-border/40 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Zara</h4>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online & Ready</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
              </div>

              {/* Chat Content */}
              <div className="p-8 flex-grow space-y-6 overflow-y-auto">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-lg">
                    <p className="font-medium text-sm leading-relaxed">
                      "I want a 4-day safari for my honeymoon in July. We love wildlife photography and luxury lodges."
                    </p>
                  </div>
                </div>

                {/* Zara Message */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-gray-100 text-foreground p-4 rounded-2xl rounded-tl-none border border-border/40">
                    <p className="font-medium text-sm leading-relaxed">
                      "Congratulations! July is peak Great Migration season. I recommend the **Maasai Mara Luxury Photographer's Circuit**. 
                      I can book a suite at **Angama Mara** with a private guide specializing in feline photography. Shall I build the itinerary?"
                    </p>
                  </div>
                </div>

                {/* Suggestion Bubbles */}
                <div className="flex flex-wrap gap-2 pt-4">
                  {["See Itinerary", "Check Pricing", "Change Destination"].map((opt) => (
                    <div key={opt} className="px-4 py-2 border border-primary/20 rounded-full text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors">
                      {opt}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="p-6 border-t border-border/40 bg-gray-50/50 flex items-center space-x-4">
                <div className="flex-grow bg-white border border-border/60 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium">
                  Type your dream...
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Send className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
