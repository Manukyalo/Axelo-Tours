"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Search, 
  X, RefreshCw, Sparkles, BookOpen, Clock, Calendar, CheckCircle2,
  FileText, Save, ExternalLink, Code, Zap, Eye, BarChart3,
  Globe, Share2, ArrowUpRight, ChevronRight, Activity, Cpu,
  Wand2, Database, ShieldCheck, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import {
  OperationalHeader,
  AssetBadge,
  MonoSection,
  TacticalButton,
  MissionCard,
  ManifestSequence
} from "@/components/OperationalComponents";

const STATUS_VARIANTS = {
  live: {
    label: "Live Deployment",
    variant: "success" as const,
    icon: Globe,
    statusType: "active" as const
  },
  review: {
    label: "Intelligence Review",
    variant: "warning" as const,
    icon: ShieldCheck,
    statusType: "calibration" as const
  },
  draft: {
    label: "Narrative Draft",
    variant: "neutral" as const,
    icon: FileText,
    statusType: "draft" as const
  }
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  meta_description: string;
  content_html: string;
  keywords: string[];
  read_time_minutes: number;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function BlogList() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState("");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editorContent, setEditorContent] = useState({
    title: "",
    slug: "",
    meta_description: "",
    content_html: "",
    keywords: [] as string[],
    read_time_minutes: 5,
    published: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [zaraCommand, setZaraCommand] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  }

  const generateAIArticle = async () => {
    setGenerating(true);
    toast.loading("Zara is researching & writing your article...", { id: "gen" });
    try {
        const res = await fetch("/api/blog/generate", { 
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
            }
        });
        const data = await res.json();
        if (data.success) {
            toast.success("New article drafted successfully!");
            fetchPosts();
        } else {
            throw new Error(data.error);
        }
    } catch (e) {
        toast.error("Generation failed. Check logs.", { id: "gen" });
    }
    setGenerating(false);
  };

  const handleZaraCommand = async () => {
    if (!zaraCommand.trim()) return;
    setIsRefining(true);
    const toastId = toast.loading("Zara is processing command...");
    try {
        const res = await fetch("/api/blog/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
            },
            body: JSON.stringify({
                mode: "refine",
                title: editorContent.title,
                currentContent: editorContent.content_html,
                command: zaraCommand
            })
        });
        const data = await res.json();
        if (data.success && data.refined) {
            setEditorContent({
                ...editorContent,
                title: data.refined.title || editorContent.title,
                content_html: data.refined.content_html || editorContent.content_html,
                meta_description: data.refined.meta_description || editorContent.meta_description,
                keywords: data.refined.keywords || editorContent.keywords,
                read_time_minutes: data.refined.read_time_minutes || editorContent.read_time_minutes
            });
            setZaraCommand("");
            toast.success("AI updates applied successfully.", { id: toastId });
        } else {
            throw new Error(data.error || "Refinement failed");
        }
    } catch (e: any) {
        toast.error(e.message || "Zara encountered an issue.", { id: toastId });
    }
    setIsRefining(false);
  };

  const togglePublished = async (post: BlogPost) => {
    const nextState = !post.published;
    const { error } = await supabase
        .from("blog_posts")
        .update({ 
            published: nextState,
            published_at: nextState ? new Date().toISOString() : null
        })
        .eq("id", post.id);
        
    if (error) toast.error("Update failed.");
    else {
      toast.success(nextState ? "Article published live." : "Article moved to drafts.");
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error("Delete failed.");
    else {
        toast.success("Post removed successfully.");
        fetchPosts();
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setEditorContent({
        title: post.title || "",
        slug: post.slug || "",
        meta_description: post.meta_description || "",
        content_html: post.content_html || "",
        keywords: post.keywords || [],
        read_time_minutes: post.read_time_minutes || 5,
        published: post.published || false,
    });
  };

  const createNewPost = () => {
    const newPost: Partial<BlogPost> = {
        title: "Tempting Title...",
        slug: "draft-" + Math.random().toString(36).substring(7),
        meta_description: "",
        content_html: "<p>Once upon a time in the Savannah...</p>",
        keywords: [],
        read_time_minutes: 5,
        published: false
    };
    
    setEditingPost({ id: "new" } as any);
    setEditorContent({
        ...newPost,
        published: false
    } as any);
  };

  const savePost = async () => {
    setIsSaving(true);
    try {
        const isNew = editingPost?.id === "new";
        const url = isNew ? "/api/blog" : `/api/blog/${editingPost?.id}`;
        const method = isNew ? "POST" : "PATCH";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editorContent)
        });
        const data = await res.json();
        if (data.success) {
            toast.success(isNew ? "Post created successfully." : "Post saved successfully.");
            setEditingPost(null);
            fetchPosts();
        } else {
            throw new Error(data.error);
        }
    } catch (e: any) {
        toast.error(e.message || "Save failed.");
    }
    setIsSaving(false);
  };

  const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 pb-32 space-y-10 bg-background min-h-screen">
      <OperationalHeader 
        title="Intelligence Archive" 
        subtitle="Strategic Narrative Assets & Content Metrics"
        icon={Database}
        actions={
          <div className="flex items-center gap-4">
              <TacticalButton 
                onClick={createNewPost} 
                variant="outline"
                icon={Plus}
              >
                Initialize Draft
              </TacticalButton>
              <TacticalButton 
                onClick={generateAIArticle} 
                disabled={generating}
                isLoading={generating}
                icon={Sparkles}
              >
                AI Synthesis
              </TacticalButton>
          </div>
        }
      />

      {/* Content Analytics Readout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Deployments", value: String(posts.filter(p => p.published).length), icon: Globe, color: "emerald", trend: "Live" },
          { label: "Drafted Intel", value: String(posts.filter(p => !p.published).length), icon: Cpu, color: "amber", trend: "Pending" },
          { label: "Reach Index", value: "84K", icon: BarChart3, color: "indigo", trend: "Projected" },
          { label: "SEO Velocity", value: "92%", icon: Zap, color: "fuchsia", trend: "Optimal" },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <MissionCard key={label} className="p-0 border-none shadow-none bg-transparent">
             <div className="flex flex-col gap-4 p-8 bg-card border border-border/50 rounded-[2.5rem] relative overflow-hidden group">
                <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700", `bg-${color}-500`)} />
                <div className="flex items-start justify-between relative z-10">
                  <div className={cn("p-4 rounded-2xl flex items-center justify-center border", `bg-${color}-500/10 border-${color}-500/20 text-${color}-500`)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <AssetBadge label={trend} variant={color === 'emerald' ? 'success' : color === 'amber' ? 'warning' : 'info'} dot={color === 'emerald'} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                  <h3 className="text-3xl font-mono font-bold text-foreground tracking-tighter tabular-nums">{value}</h3>
                </div>
             </div>
          </MissionCard>
        ))}
      </div>

      <div className="flex items-center justify-between gap-6 pb-2">
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)} 
            placeholder="Search Intelligence Archive..."
            className="w-full pl-14 pr-6 h-14 border border-border bg-card/50 rounded-[24px] text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono shadow-inner" 
          />
        </div>
        <AssetBadge label={`${filtered.length} ARCHIVED NODES`} variant="neutral" />
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="h-[320px] rounded-[2.5rem] bg-card border border-border/50 animate-pulse" />
             ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center gap-8 bg-card rounded-[40px] border border-dashed border-border/60">
               <div className="w-24 h-24 rounded-[36px] bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/20">
                  <FileText className="w-12 h-12" />
               </div>
               <p className="text-lg font-bold text-foreground uppercase tracking-tight">No Intelligence Found</p>
               <TacticalButton onClick={createNewPost} variant="outline">Initialize First Entry</TacticalButton>
            </div>
          ) : filtered.map(post => {
            // High-fidelity status resolution
            let status: 'live' | 'review' | 'draft' = 'draft';
            if (post.published) status = 'live';
            else if (post.content_html?.length > 1000 || post.meta_description) status = 'review';
            
            const cfg = STATUS_VARIANTS[status];
            
            return (
              <MissionCard 
                key={post.id} 
                label={`ARCHIVE-ID: ${post.id.split("-")[0].toUpperCase()}`}
                status={cfg.statusType}
                className="flex flex-col h-full hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div onClick={() => handleEdit(post)} className="flex flex-col h-full gap-5">
                   <div className="flex items-start justify-between">
                      <div className="space-y-2">
                         <h3 className="text-lg font-bold text-foreground tracking-tight line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                           {post.title || "Untitled Intelligence"}
                         </h3>
                         <div className="flex items-center gap-2">
                           <AssetBadge label={`${post.read_time_minutes} MIN`} variant="neutral" dot={false} />
                           <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase opacity-50">/{post.slug}</span>
                         </div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-2xl border border-border/40 shrink-0">
                         <cfg.icon className={cn("w-5 h-5", status === "live" ? "text-emerald-500" : "text-muted-foreground")} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-2xl border border-border/30">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Activity className="w-3 h-3" /> SEO Metas
                        </p>
                        <p className="text-xs font-medium text-foreground/80 line-clamp-2 italic leading-relaxed">
                          {post.meta_description || "No metadata synchronization detected."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <MonoSection label="Created" value={format(new Date(post.created_at), "dd MMM yy")} className="bg-card/50" />
                         <MonoSection label="Reach" value={status === 'live' ? "Optimal" : "Pending"} className="bg-card/50" />
                      </div>
                   </div>

                   <div className="mt-auto pt-5 border-t border-border/40 flex items-center justify-between">
                      <AssetBadge label={cfg.label} variant={cfg.variant} />
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-muted-foreground">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                </div>
              </MissionCard>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Intelligence Command Center (Editor) */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-[100vw] w-screen h-screen m-0 p-0 border-none bg-background rounded-none flex flex-col ring-0 focus:ring-0">
            {/* Tactical Header HUD */}
             <div className="bg-card border-b border-border p-6 flex items-center justify-between z-50">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-primary flex items-center justify-center font-bold text-white text-xl rounded-2xl shadow-xl shadow-primary/20 italic">
                        {editingPost?.id === "new" ? "N" : "E"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground tracking-tighter uppercase leading-none">
                            {editingPost?.id === "new" ? "Initialize Intelligence" : "Calibrate Narrative"}
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border/50">
                                {[
                                    { id: "edit", icon: Edit2, label: "Editor" },
                                    { id: "split", icon: Code, label: "Split" },
                                    { id: "preview", icon: Eye, label: "Preview" }
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setViewMode(tab.id as any)} 
                                        className={cn(
                                          "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                                          viewMode === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <tab.icon className="w-3 h-3" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            
                            {(viewMode === "preview" || viewMode === "split") && (
                                <div className="flex items-center gap-1 ml-2 p-1 bg-muted/30 rounded-xl">
                                    {[
                                        { id: "mobile", label: "Mobile" },
                                        { id: "tablet", label: "Tablet" },
                                        { id: "desktop", label: "Ultrawide (21:9)" }
                                    ].map((vp) => (
                                        <button 
                                            key={vp.id}
                                            onClick={() => setPreviewViewport(vp.id as any)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg transition-all text-[9.5px] font-bold uppercase tracking-wider",
                                                previewViewport === vp.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {vp.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4 border-r border-border pr-6">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Deployment Status</span>
                        <AssetBadge 
                          label={editorContent.published ? "LIVE DEPLOYMENT" : "INTELLIGENCE REVIEW"} 
                          variant={editorContent.published ? "success" : "warning"} 
                          dot={editorContent.published}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setEditorContent({...editorContent, published: !editorContent.published})}
                           className={cn(
                             "px-6 h-11 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-[0.98] group overflow-hidden relative border",
                             editorContent.published 
                               ? "bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 border-rose-500/20" 
                               : "bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20"
                           )}
                         >
                           {/* Button Glow Effect */}
                           <div className={cn(
                             "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                             editorContent.published ? "bg-rose-500/10" : "bg-emerald-500/10"
                           )} />
                           
                           {editorContent.published ? <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /> : <ShieldCheck className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                           <span className="relative z-10">
                            {editorContent.published ? "Retract Intel" : "Authorise Intelligence"}
                           </span>
                         </button>

                        <TacticalButton 
                            onClick={savePost} 
                            isLoading={isSaving}
                            disabled={isRefining}
                            icon={Save}
                            className="px-8 h-11 min-w-[180px]"
                        >
                            Commit Changes
                        </TacticalButton>

                        <button 
                          onClick={() => setEditingPost(null)}
                          className="p-3 hover:bg-muted rounded-xl transition-colors text-muted-foreground"
                        >
                          <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* 3-Pane Tactical View */}
                
                {/* Pane 1: Core Intel (Metadata) - Collapsible or side fixed */}
                <div className="w-[300px] border-r border-border bg-muted/20 overflow-y-auto p-6 hidden 2xl:block">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Core Metadata</h3>
                      <MonoSection label="Slug Descriptor" value={
                        <input 
                          value={editorContent.slug}
                          onChange={e => setEditorContent({...editorContent, slug: e.target.value})}
                          className="w-full bg-transparent border-none outline-none text-xs font-mono p-0"
                        />
                      } />
                      <MonoSection label="Consumption Index" value={
                        <input 
                          type="number"
                          value={editorContent.read_time_minutes}
                          onChange={e => setEditorContent({...editorContent, read_time_minutes: parseInt(e.target.value)})}
                          className="w-full bg-transparent border-none outline-none text-xs font-mono p-0"
                        />
                      } />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">SEO Calibration</h3>
                      <div className="p-4 bg-card border border-border rounded-2xl space-y-4">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase">Meta Narrative</label>
                        <textarea 
                          value={editorContent.meta_description}
                          onChange={e => setEditorContent({...editorContent, meta_description: e.target.value})}
                          className="w-full h-32 bg-transparent border-none outline-none text-xs leading-relaxed resize-none p-0"
                          placeholder="Inject search engine intelligence..."
                        />
                        <div className="flex justify-between items-center text-[9px] font-mono border-t border-border/50 pt-2">
                          <span className="text-muted-foreground uppercase">Sync Delta: {editorContent.meta_description.length}/160</span>
                          <div className={cn("w-2 h-2 rounded-full", editorContent.meta_description.length > 50 && editorContent.meta_description.length <= 160 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                        <ManifestSequence 
                            label="Keyword Matrix" 
                            items={editorContent.keywords} 
                            onChange={(keywords) => setEditorContent({...editorContent, keywords})}
                            icon={Database}
                            color="primary"
                        />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Deployment Logic</h3>
                      <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-bold text-foreground">Status</span>
                           <AssetBadge label={editorContent.published ? "LIVE" : "DRAFT"} variant={editorContent.published ? "success" : "neutral"} />
                        </div>
                        <TacticalButton 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setEditorContent({...editorContent, published: !editorContent.published})}
                        >
                          Toggle Presence
                        </TacticalButton>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pane 2: Content Manifest (Editor) */}
                {(viewMode === "edit" || viewMode === "split") && (
                    <div className={cn("relative h-full overflow-hidden flex flex-col bg-card", viewMode === "split" ? "flex-1" : "w-full")}>
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="max-w-5xl mx-auto space-y-16 py-12">
                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-4xl font-bold text-foreground tracking-tight uppercase placeholder:text-muted-foreground/10 resize-none overflow-hidden"
                                    value={editorContent.title}
                                    onChange={e => {
                                      setEditorContent({...editorContent, title: e.target.value});
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                    }}
                                    rows={1}
                                    placeholder="Intelligence Sequence Title..."
                                />
                                
                                <div className="min-h-[60vh] border-l-[3px] border-primary/20 pl-12 ml-2">
                                  <textarea 
                                      className="w-full h-full bg-transparent border-none outline-none font-mono text-foreground/90 text-xl leading-[1.8] resize-none placeholder:text-muted-foreground/10 selection:bg-primary/20"
                                      value={editorContent.content_html}
                                      onChange={e => {
                                        setEditorContent({...editorContent, content_html: e.target.value});
                                        // Auto-expand height
                                        e.target.style.height = 'auto';
                                        e.target.style.height = e.target.scrollHeight + 'px';
                                      }}
                                      placeholder="Begin intelligence sequence..."
                                  />
                                </div>
                            </div>
                        </div>

                        {/* Zara Command Pad */}
                        <div className="p-10 bg-card/95 border-t border-border/60 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] relative z-10 backdrop-blur-xl">
                           <div className="max-w-5xl mx-auto space-y-6">
                              {/* Suggestion Chips HUD */}
                              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                                {[
                                  { label: "Enchant Narrative", cmd: "Make the tone more poetic, adventurous, and emotionally engaging" },
                                  { label: "SEO Calibration", cmd: "Optimize headings, keywords, and meta structure for high-velocity SEO" },
                                  { label: "Expand Depth", cmd: "Add more technical and cultural detail about the locations and wildlife" },
                                  { label: "Narrative Polish", cmd: "Fix grammar, improve sentence flow, and sharpen the prose" },
                                  { label: "Safari Spirit", cmd: "Infuse emotional wonder and the magic of the wild into every paragraph" }
                                ].map((s) => (
                                  <button 
                                    key={s.label}
                                    onClick={() => setZaraCommand(s.cmd)}
                                    className="shrink-0 px-4 py-2 rounded-full bg-muted/40 border border-border/50 text-[9.5px] font-bold text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all uppercase tracking-wider"
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>

                              {/* Input + Trigger */}
                              <div className="flex gap-4">
                                <div className="flex-1 bg-muted/30 rounded-2xl border border-border flex items-center px-6 gap-4 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all group">
                                   <Sparkles className="w-5 h-5 text-primary shrink-0 group-focus-within:animate-pulse" />
                                   <input 
                                      value={zaraCommand}
                                      onChange={e => setZaraCommand(e.target.value)}
                                      onKeyDown={e => e.key === "Enter" && handleZaraCommand()}
                                      className="flex-1 bg-transparent border-none outline-none h-14 text-sm font-medium placeholder:text-muted-foreground/30"
                                      placeholder="Instruct Zara AI to calibrate the narrative..."
                                   />
                                </div>
                                <TacticalButton 
                                  onClick={handleZaraCommand} 
                                  isLoading={isRefining}
                                  disabled={!zaraCommand.trim() || isRefining}
                                  icon={Zap}
                                  className="px-10 shrink-0"
                                >
                                  Neural Sync
                                </TacticalButton>
                              </div>
                           </div>
                        </div>

                        {/* Neural Calibration Overlay */}
                        <AnimatePresence>
                          {isRefining && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              className="absolute inset-0 z-50 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center gap-8"
                            >
                               <div className="relative">
                                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                     <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                  </div>
                               </div>
                               <div className="text-center space-y-2">
                                  <p className="text-xl font-bold uppercase tracking-[0.3em] text-foreground">Neural Calibration</p>
                                  <p className="text-[10px] font-mono text-muted-foreground animate-pulse">SYNCHRONIZING NARRATIVE VECTORS...</p>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Pane 3: Holographic Preview (Live View) */}
                {(viewMode === "preview" || viewMode === "split") && (
                    <div className={cn(
                        "h-full overflow-hidden flex flex-col bg-slate-900/5 border-l border-border transition-all duration-500", 
                        viewMode === "split" ? "w-[55%] bg-slate-900/[0.02]" : "flex-1"
                    )}>
                        <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Holographic Render</span>
                              <span className="px-2.5 py-1 bg-muted/50 rounded-lg text-[9px] font-bold text-muted-foreground uppercase tracking-wider capitalize">{previewViewport}</span>
                            </div>
                            <div className="flex gap-1.5 items-center">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[9px] font-bold text-emerald-500 uppercase">Live Sync</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-950/[0.03] flex justify-center items-start">
                            <motion.div 
                                layout
                                animate={{ 
                                    width: previewViewport === "mobile" ? 380 : previewViewport === "tablet" ? 768 : "90%",
                                    maxWidth: previewViewport === "mobile" ? 380 : previewViewport === "tablet" ? 768 : 1200,
                                    scale: (viewMode === "split" && previewViewport === "desktop") ? 0.85 : 1,
                                    originY: 0
                                }}
                                className={cn(
                                    "bg-white shadow-2xl overflow-hidden self-start transition-all duration-700",
                                    previewViewport === "mobile" ? "aspect-[9/19.5] rounded-[3.5rem] border-[14px] border-slate-900" : 
                                    previewViewport === "tablet" ? "aspect-[3/4] rounded-[2.5rem] border-[12px] border-slate-900" :
                                    "rounded-2xl border border-border"
                                )}
                            >
                                {/* Cinematic Scanline Overlay */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                                
                                <div className="p-12 md:p-16 prose prose-slate max-w-none prose-h1:text-4xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:uppercase prose-p:text-gray-500 prose-p:leading-relaxed selection:bg-primary/20 relative z-10">
                                    <div className="mb-12">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-full text-[9px] font-bold uppercase tracking-widest mb-6">
                                          Travel Intelligence Archive
                                        </div>
                                        <h1 className="leading-tight text-slate-900 lowercase!">{editorContent.title || "Untitled Intelligence"}</h1>
                                        <div className="flex items-center gap-4 text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-6">
                                           <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> {editorContent.read_time_minutes} Min Read</span>
                                           <span>•</span>
                                           <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {format(new Date(), "MMMM yyyy")}</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-700 leading-loose prose-headings:text-slate-900 prose-a:text-primary prose-img:rounded-3xl" dangerouslySetInnerHTML={{ __html: editorContent.content_html }} />
                                    
                                    <div className="mt-20 pt-12 border-t border-slate-100 italic text-slate-400 text-sm">
                                      End of Intelligence Sequence. Published by Axelo Tours & Safari Ltd.
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
