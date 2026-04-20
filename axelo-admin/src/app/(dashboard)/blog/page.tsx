"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, RefreshCw, Sparkles, BookOpen, Clock, Calendar, CheckCircle2,
  FileText, Save, ExternalLink, Code, Link, Zap, Eye, BarChart3,
  Globe, Share2, ArrowUpRight, ChevronRight, Activity, Brain,
  Wand2, Layout, Database, ShieldCheck
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

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
  });
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [zaraCommand, setZaraCommand] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  
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
            toast.success("New article drafted successfully!", { id: "gen" });
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
            toast.success("Intelligence applied successfully.", { id: toastId });
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
        
    if (error) toast.error("State update failed.");
    else {
      toast.success(nextState ? "Article deployed live." : "Article moved to draft.");
      fetchPosts();
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this content asset?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error("Decommissioning failed.");
    else {
        toast.success("Asset removed from manifest.");
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
    setEditorContent(newPost as any);
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
            toast.success(isNew ? "Asset created successfully." : "Asset calibration saved.");
            setEditingPost(null);
            fetchPosts();
        } else {
            throw new Error(data.error);
        }
    } catch (e: any) {
        toast.error(e.message || "Commit failed.");
    }
    setIsSaving(false);
  };

  const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 pb-32 space-y-10 bg-[#fafafa] min-h-screen">
      {/* Elite Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600/10 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              Content Distribution Pipeline
            </div>
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-4 uppercase">
            Blog <span className="text-indigo-600 italic">Manifest</span>
          </h1>
          <p className="text-gray-500 font-medium max-w-xl text-lg leading-relaxed italic">
            Automating organic discovery through high-fidelity SEO content. Zara AI generates, refines, and deploys high-ranking travel narratives.
          </p>
        </div>

        <div className="flex items-center gap-4">
             <Button 
                onClick={createNewPost} 
                variant="outline"
                className="gap-2 border-gray-200 text-gray-900 bg-white hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] h-14 px-8 rounded-2xl shadow-sm transition-all"
            >
                <Plus className="w-5 h-5 text-indigo-600" />
                Manual Entry
            </Button>
            <Button 
                onClick={generateAIArticle} 
                disabled={generating}
                className="gap-2 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] h-14 px-8 rounded-2xl shadow-xl shadow-gray-200 transition-all border-none"
            >
                {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
                {generating ? "Agent Writing..." : "Zap AI Deployment"}
            </Button>
        </div>
      </div>

      {/* Strategic Content KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Live Assets", value: String(posts.filter(p => p.published).length), icon: Globe, color: "emerald", trend: "Broadcasting" },
          { label: "Neural Drafts", value: String(posts.filter(p => !p.published).length), icon: Brain, color: "amber", trend: "Refining" },
          { label: "Reach Potential", value: "84K", icon: BarChart3, color: "indigo", trend: "Projected Q2" },
          { label: "SEO Velocity", value: "92/100", icon: Zap, color: "fuchsia", trend: "Top Tier" },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <div key={label} className="group bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-${color}-50 flex items-center justify-center text-${color}-600 shadow-sm group-hover:scale-110 transition-all duration-500`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all uppercase tracking-widest leading-none">
                {trend}
              </div>
            </div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 leading-none">{label}</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                {value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Manifest Table */}
      <div className="space-y-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex-1 max-w-xl relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  value={search} onChange={e => setSearch(e.target.value)} 
                  placeholder="Identify content asset..."
                  className="w-full pl-14 pr-6 h-14 border border-gray-100 rounded-[24px] text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-black tracking-tight shadow-sm placeholder:text-gray-300" 
                />
              </div>

              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                  <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {filtered.length} Content Nodes Registry
              </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fcfcfc] text-[10px] uppercase text-gray-400 font-bold tracking-[0.2em] border-b border-gray-100">
                  <tr>
                    <th className="px-10 py-7">Content Identity</th>
                    <th className="px-8 py-7">Consumption Index</th>
                    <th className="px-8 py-7">Timeline</th>
                    <th className="px-8 py-7">Integrity Status</th>
                    <th className="px-10 py-7 text-right">Sequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {loading ? (
                    <tr><td colSpan={5} className="px-8 py-32 text-center"><RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto opacity-10" /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-40 text-center text-gray-300 font-black uppercase text-[11px] tracking-[0.4em] italic opacity-50">Zero Content Signals Detected.</td></tr>
                  ) : filtered.map(post => (
                    <tr key={post.id} className="group hover:bg-[#fafafa] transition-all duration-300">
                      <td className="px-10 py-7 max-w-[450px]">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[24px] bg-gray-50 border-4 border-white flex items-center justify-center font-black text-gray-300 text-2xl shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 overflow-hidden">
                                {post.published ? (
                                  <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white italic">
                                     <CheckCircle2 className="w-8 h-8" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 italic font-black">
                                     {post.title[0]}
                                  </div>
                                )}
                            </div>
                            <div>
                                <span className="font-black text-gray-900 tracking-tighter text-xl uppercase italic block underline decoration-gray-100 group-hover:text-indigo-600 transition-colors truncate">
                                  {post.title || "Untitled Masterpiece"}
                                </span>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">/{post.slug}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                         <div className="flex items-center gap-2.5 text-[11px] font-black text-indigo-600 uppercase tracking-tight bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 w-fit">
                            <Clock className="w-3.5 h-3.5 stroke-[3px]" />
                            {post.read_time_minutes} MIN READ
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Encoded On</span>
                           <span className="font-bold text-gray-900 text-sm tracking-tight">{new Date(post.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <span className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all ${
                          post.published ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50" : "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50"
                        }`}>
                          {post.published ? <Globe className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                          {post.published ? "Deployed Live" : "Neural Draft"}
                        </span>
                      </td>
                      <td className="px-10 py-7 text-right">
                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                             <button onClick={() => togglePublished(post)} className="p-3 bg-white hover:bg-gray-50 border border-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all" title={post.published ? "Deactivate Presence" : "Execute Deployment"}>
                                {post.published ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                             </button>
                             <button onClick={() => handleEdit(post)} className="p-3 bg-white hover:bg-gray-900 border border-gray-100 hover:border-gray-900 text-gray-400 hover:text-white rounded-2xl shadow-sm transition-all group/btn">
                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                             </button>
                             <button onClick={() => deletePost(post.id)} className="p-3 bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-100 text-gray-400 hover:text-rose-600 rounded-2xl shadow-sm transition-all">
                                <Trash2 className="w-5 h-5" />
                             </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Elite Editor Command Center */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-[1700px] w-[98vw] h-[95vh] rounded-[48px] p-0 border-none shadow-3xl overflow-hidden bg-white/95 backdrop-blur-3xl flex flex-col transition-all duration-700">
            {/* Command Header */}
            <div className="bg-white/80 border-b border-gray-100 p-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-indigo-600 flex items-center justify-center font-black text-white text-2xl rounded-[24px] shadow-2xl shadow-indigo-100 italic">
                        {editingPost?.id === "new" ? "N" : "E"}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                            {editingPost?.id === "new" ? "New Content Unit" : "Calibrating Asset"}
                        </h2>
                        <div className="flex items-center gap-6 mt-3">
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                {[
                                    { id: "edit", label: "Logic", icon: Code },
                                    { id: "split", label: "Dual View", icon: Layout },
                                    { id: "preview", label: "Hologram", icon: Eye }
                                ].map(tab => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setViewMode(tab.id as any)} 
                                        className={`flex items-center gap-2.5 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === tab.id ? "bg-white shadow-xl text-indigo-600" : "text-gray-400 hover:text-gray-900"}`}
                                    >
                                        <tab.icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 hidden xl:flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Autosync Active</span>
                    </div>
                    <Button onClick={() => setEditingPost(null)} variant="ghost" className="rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 hover:text-gray-900 px-8 h-14">Discard</Button>
                    <Button 
                        onClick={savePost} 
                        disabled={isSaving} 
                        className="rounded-[24px] bg-gray-900 hover:bg-black text-white font-black uppercase text-[11px] tracking-[0.2em] px-12 h-14 shadow-2xl shadow-gray-200 transition-all border-none gap-3"
                    >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-indigo-400" />}
                        {isSaving ? "Synchronizing..." : "Commit Asset"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex bg-[#fbfbfc]">
                {/* Logical Editor Workspace */}
                {(viewMode === "edit" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-[60%]" : "w-full"} h-full overflow-hidden flex flex-col bg-white border-r border-gray-50 relative`}>
                        {/* Control Bar */}
                        <div className="px-10 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Structural Registry</span>
                                <div className="flex items-center gap-2">
                                    {["H1", "H2", "H3", "QUOTE", "LINK"].map(tool => (
                                      <button key={tool} className="px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[9px] font-black text-gray-500 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">{tool}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mr-4">
                                    Lines: {editorContent.content_html.split('\n').length}
                                </div>
                                <Button 
                                    onClick={generateAIArticle}
                                    className="bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest h-9 px-4 border border-indigo-100 shadow-sm transition-all"
                                >
                                    <Wand2 className="w-3.5 h-3.5 mr-2" /> Neural Rewrite
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-16 custom-scrollbar scroll-smooth">
                            <div className="max-w-4xl mx-auto space-y-16">
                                <div className="space-y-6">
                                    <input 
                                        className="w-full bg-transparent border-0 focus:ring-0 text-7xl font-black text-gray-900 tracking-[-0.05em] uppercase italic placeholder:text-gray-100 selection:bg-indigo-100 transition-all leading-tight"
                                        value={editorContent.title}
                                        onChange={e => setEditorContent({...editorContent, title: e.target.value})}
                                        placeholder="Master Title..."
                                    />
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                                            <Link className="w-3.5 h-3.5 text-indigo-500" />
                                            /{editorContent.slug}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                            {editorContent.read_time_minutes} MINS
                                        </div>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <textarea 
                                        className="w-full min-h-[1000px] bg-transparent border-0 focus:ring-0 font-mono text-gray-600 text-lg leading-loose resize-none p-0 selection:bg-indigo-100 placeholder:text-gray-100/50"
                                        value={editorContent.content_html}
                                        onChange={e => setEditorContent({...editorContent, content_html: e.target.value})}
                                        placeholder="Deploy high-fidelity travel narratives here..."
                                    />
                                    {/* Scroll Indicator */}
                                    <div className="absolute right-0 top-0 h-full w-1.5 bg-gray-50 rounded-full opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>

                                {/* Advanced Calibration (SEO) */}
                                <div className="pt-20 border-t-2 border-dashed border-gray-100 space-y-12 pb-32">
                                    <div className="flex items-center gap-3">
                                       <Database className="w-5 h-5 text-indigo-600" />
                                       <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.3em]">Neural SEO Payload</h3>
                                    </div>

                                    <div className="grid grid-cols-5 gap-12">
                                        <div className="col-span-3 space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Meta Transmission (Description)</label>
                                            <textarea 
                                                className="w-full h-40 p-6 rounded-[32px] bg-gray-50 border border-gray-100 focus:bg-white focus:ring-8 focus:ring-indigo-50 transition-all text-sm leading-relaxed font-bold text-gray-600 shadow-inner"
                                                value={editorContent.meta_description}
                                                onChange={e => setEditorContent({...editorContent, meta_description: e.target.value})}
                                                placeholder="Write a snippet that guarantees clicks..."
                                            />
                                            <div className="flex justify-between items-center text-[10px] font-black px-4">
                                                <span className="text-gray-300 italic">Signature Count: {editorContent.meta_description.length} chars</span>
                                                <span className={editorContent.meta_description.length > 160 ? "text-amber-500" : "text-emerald-500"}>Optimal: 155-160</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asset Slug URI</label>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-inner">
                                                    <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                                                    <input 
                                                        className="w-full bg-transparent text-[13px] font-black outline-none tracking-tight text-gray-900"
                                                        value={editorContent.slug}
                                                        onChange={e => setEditorContent({...editorContent, slug: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Consumption Time (Mins)</label>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-inner">
                                                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                                                    <input 
                                                        type="number"
                                                        className="w-full bg-transparent text-[13px] font-black outline-none tracking-tight text-gray-900"
                                                        value={editorContent.read_time_minutes}
                                                        onChange={e => setEditorContent({...editorContent, read_time_minutes: parseInt(e.target.value)})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Holographic Preview Surface */}
                {(viewMode === "preview" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-[40%]" : "w-full"} h-full overflow-hidden flex flex-col bg-[#f8f9fa] border-l border-gray-100`}>
                        {/* Rendering Intelligence */}
                        <div className="px-10 py-6 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Holographic Projection</span>
                            <div className="flex gap-2">
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest leading-none">Ready to deploy</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar bg-slate-50/50">
                            <div className="max-w-2xl mx-auto bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden min-h-full border border-white relative">
                                {/* Simulated Browser Controls */}
                                <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-8 gap-1.5 shrink-0 opacity-40">
                                   <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                   <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                   <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                </div>

                                <div className="p-16 lg:p-24 prose prose-slate prose-h1:text-5xl prose-h1:font-black prose-h1:tracking-tighter prose-h1:uppercase prose-h1:italic prose-h2:text-3xl prose-h2:font-black prose-h2:tracking-tight prose-p:text-gray-500 prose-p:text-lg prose-p:leading-relaxed prose-a:text-indigo-600 prose-a:font-black prose-a:underline prose-li:font-medium">
                                    <div className="mb-20">
                                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-2xl shadow-indigo-200 italic">
                                          <Sparkles className="w-4 h-4" /> Destination Signal
                                        </div>
                                        <h1 className="leading-none mb-8">{editorContent.title || "Waiting for signal..."}</h1>
                                        <div className="flex items-center gap-4 text-gray-300 font-black uppercase text-[10px] tracking-widest italic">
                                           <span>Axelo Exclusive</span>
                                           <span className="w-2 h-2 rounded-full bg-gray-100" />
                                           <span>{editorContent.read_time_minutes} Minute Read</span>
                                        </div>
                                    </div>

                                    <div className="selection:bg-indigo-600 selection:text-white" dangerouslySetInnerHTML={{ __html: editorContent.content_html }} />
                                    
                                    {/* Strategic Signature */}
                                    <div className="mt-24 pt-12 border-t-4 border-gray-50 flex items-center justify-between not-prose">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[24px] bg-gray-900 flex items-center justify-center text-white font-black italic text-3xl shadow-2xl">A</div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 uppercase italic">Axelo Intelligence</p>
                                                <p className="text-[11px] font-bold text-gray-400 tracking-tight">Authentic Safari Logistics</p>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-emerald-50 flex items-center justify-center">
                                           <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Zara Intelligence Command Pad */}
                        {viewMode === "split" && (
                            <div className="shrink-0 p-10 bg-white border-t border-gray-100 shadow-[0_-20px_60px_rgba(0,0,0,0.03)] z-30">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-100">
                                            <Sparkles className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                           <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 block">Zara Neural Link</span>
                                           <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Natural Language Logic Unit</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                                      <Activity className="w-3 h-3 text-emerald-500" />
                                      Sync: Ready
                                    </div>
                                </div>
                                <div className="flex gap-4 p-2 bg-gray-50 border border-gray-100 rounded-[28px] focus-within:ring-8 focus-within:ring-indigo-50 focus-within:border-indigo-100 transition-all">
                                    <input 
                                        className="flex-1 bg-transparent border-none px-6 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-200"
                                        placeholder="Command Zara: 'Enchant the intro', 'Optimize for SEO', 'Add luxury tips'..."
                                        value={zaraCommand}
                                        onChange={e => setZaraCommand(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleZaraCommand()}
                                        disabled={isRefining}
                                    />
                                    <Button 
                                        onClick={handleZaraCommand}
                                        disabled={isRefining || !zaraCommand.trim()}
                                        className="bg-indigo-600 hover:bg-black text-white rounded-[20px] px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all"
                                    >
                                        {isRefining ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 text-emerald-400" />}
                                        {isRefining ? "Processing" : "Execute"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
