"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AXELO OPERATIONAL COMPONENTS
 * Premium UI primitives for Senior L6 production standards.
 */

// --- TYPES ---

interface OperationalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

interface AssetBadgeProps {
  label: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  dot?: boolean;
}

interface MonoSectionProps {
  label: string;
  value: string | number | React.ReactNode;
  className?: string;
}

// --- COMPONENTS ---

export const OperationalHeader: React.FC<OperationalHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground font-medium text-sm mt-1 uppercase tracking-widest font-mono">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </div>
  );
};

export const AssetBadge: React.FC<AssetBadgeProps> = ({
  label,
  variant = "neutral",
  dot = true,
}) => {
  const variants = {
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    info: "bg-primary/10 text-primary border-primary/20",
    neutral: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    error: "bg-rose-500",
    info: "bg-primary",
    neutral: "bg-slate-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap",
        variants[variant]
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {variant === "success" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])}
          ></span>
        </span>
      )}
      {label}
    </span>
  );
};

export const MonoSection: React.FC<MonoSectionProps> = ({ label, value, className }) => {
  return (
    <div className={cn("group px-4 py-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all duration-300", className)}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 font-mono">
        {label}
      </p>
      <div className="text-foreground font-semibold">
        {typeof value === "string" || typeof value === "number" ? (
          <span className="font-mono tabular-nums">{value}</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
};

export const TacticalButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    icon?: LucideIcon;
    isLoading?: boolean;
  }
>(({ className, variant = "primary", size = "md", icon: Icon, isLoading, children, ...props }, ref) => {
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-[0_4px_14px_0_rgb(26,107,58,0.39)]",
    secondary: "bg-secondary text-white hover:bg-secondary/90",
    outline: "border-2 border-border bg-transparent hover:bg-muted text-foreground",
    ghost: "bg-transparent hover:bg-muted text-foreground border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex"
    >
      <button
        ref={ref}
        className={cn(
          "relative flex items-center justify-center gap-2 font-bold uppercase tracking-widest rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border w-full h-full",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      <span className={cn(isLoading && "opacity-0")}>{children}</span>
      </button>
    </motion.div>
  );
});

TacticalButton.displayName = "TacticalButton";

export const MissionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  label?: string;
  status?: "active" | "draft" | "calibration";
}> = ({ children, className, label, status }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden group bg-card border border-border/60 rounded-3xl shadow-xl shadow-black/5 hover:border-primary/30 transition-all duration-500",
        className
      )}
    >
      {label && (
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-muted/80 border-l border-b border-border rounded-bl-2xl z-10 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors duration-300">
          {label}
        </div>
      )}
      <div className="p-6">{children}</div>
      {status && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: status === 'active' ? '100%' : status === 'calibration' ? '60%' : '20%' }}
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              status === 'active' ? "bg-emerald-500" : status === 'calibration' ? "bg-amber-500" : "bg-slate-400"
            )}
          />
        </div>
      )}
    </motion.div>
  );
};

import { Plus, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export const ManifestSequence: React.FC<{
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  icon?: LucideIcon;
  color?: string;
}> = ({ label, items, onChange, icon: Icon, color = "primary" }) => {
  const add = () => onChange([...items, ""]);
  const update = (i: number, v: string) => { const a = [...items]; a[i] = v; onChange(a); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={cn("w-5 h-5", color === 'primary' ? 'text-primary' : `text-${color}`)} />}
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest leading-none">
            {label}
          </h3>
        </div>
        <button
          onClick={add}
          className="text-[10px] font-black text-primary hover:text-primary/80 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full border border-primary/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Plus className="w-3 h-3" /> Append Entry
        </button>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className="flex items-center gap-3 group"
            >
              <div className="flex-none w-10 h-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center font-mono text-[10px] font-bold text-muted-foreground group-focus-within:bg-primary/10 group-focus-within:border-primary/20 group-focus-within:text-primary transition-all">
                {(i + 1).toString().padStart(2, "0")}
              </div>
              <input
                value={item}
                onChange={(e) => update(i, e.target.value)}
                className="flex-grow bg-white border border-border px-4 py-2.5 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all placeholder:text-muted-foreground/30"
                placeholder={`Enter ${label.toLowerCase()} specification...`}
              />
              <button
                onClick={() => remove(i)}
                className="flex-none p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {items.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/20"
          >
            <p className="text-xs font-bold uppercase tracking-widest">No entries in sequence</p>
            <button onClick={add} className="text-[10px] font-black text-primary hover:underline uppercase tracking-tighter">Initialize Sequence</button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
