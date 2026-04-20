"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, RefreshCw, Sparkles, BookOpen, Clock, Calendar, CheckCircle2,
  FileText, Save, ExternalLink, Code, Link
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
    const toastId = toast.loading("Zara is thinking...");
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
            toast.success("Article refined by Zara!", { id: toastId });
        } else {
            throw new Error(data.error || "Refinement failed");
        }
    } catch (e: any) {
        toast.error(e.message || "Zara encountered an issue.", { id: toastId });
    }
    setIsRefining(false);
  };

  const togglePublished = async (pkg: BlogPost) => {
    const nextState = !pkg.published;
    const { error } = await supabase
        .from("blog_posts")
        .update({ 
            published: nextState,
            published_at: nextState ? new Date().toISOString() : null
        })
        .eq("id", pkg.id);
        
    if (error) toast.error("Update failed.");
    else fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this article?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error("Delete failed.");
    else {
        toast.success("Article deleted.");
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
            toast.success(isNew ? "Article created!" : "Changes saved!");
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
    <div className="p-8 pb-32 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            SEO Blog Engine
          </h1>
          <p className="text-gray-500 mt-2">
            AI-driven organic growth. Generate, review, and publish high-ranking articles.
          </p>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={createNewPost} 
                variant="outline"
                className="gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold h-12 px-6 rounded-2xl"
            >
                <Plus className="w-5 h-5" />
                Write Manually
            </Button>
            <Button 
                onClick={generateAIArticle} 
                disabled={generating}
                className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg text-white font-bold h-12 px-6 rounded-2xl"
            >
                {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {generating ? "Zara is writing..." : "Generate AI Article"}
            </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
               <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        value={search} onChange={e => setSearch(e.target.value)} 
                        placeholder="Search articles..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" 
                    />
               </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-white text-xs uppercase text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">Article</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Read Time</th>
                        <th className="px-6 py-4">Dates</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                    {loading ? (
                        <tr><td colSpan={5} className="p-8 text-center"><RefreshCw className="w-5 h-5 animate-spin text-primary mx-auto"/></td></tr>
                    ) : filtered.length === 0 ? (
                        <tr><td colSpan={5} className="p-8 text-center">No articles found. Click Generate to write one!</td></tr>
                    ) : filtered.map(post => (
                        <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 max-w-[300px]">
                                <div className="font-bold text-gray-900 truncate">
                                    {post.title || <span className="text-gray-300 italic">Untitled Masterpiece</span>}
                                </div>
                                <div className="text-xs text-gray-400 truncate mt-1">/{post.slug || "no-slug"}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${post.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                    {post.published ? "Published" : "Draft"}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {post.read_time_minutes} mins
                                </div>
                            </td>
                            <td className="px-6 py-4 text-xs whitespace-nowrap text-gray-500 space-y-1">
                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Created {new Date(post.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2 text-right">
                                     <button onClick={() => handleEdit(post)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors tooltip-trigger" title="Edit Article">
                                        <Edit2 className="w-4 h-4" />
                                     </button>
                                     <button onClick={() => togglePublished(post)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors" title={post.published ? "Unpublish" : "Publish"}>
                                        {post.published ? <ToggleRight className="w-7 h-7 text-green-500" /> : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                                     </button>
                                     <button onClick={() => deletePost(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors tooltip-trigger">
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
      </div>

      {/* Editor / Preview Modal */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-[100vw] md:max-w-[98vw] w-full md:w-[1600px] max-h-screen md:max-h-[96vh] h-full md:h-[920px] overflow-hidden rounded-none md:rounded-[2.5rem] p-0 border-0 flex flex-col shadow-2xl bg-white/95 backdrop-blur-2xl transition-all duration-500">
            {/* Premium Header */}
            <div className="bg-white/50 border-b border-gray-100 p-4 md:p-6 flex flex-col md:justify-between md:items-center shrink-0 gap-4 md:gap-0">
                <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6 w-full md:w-auto">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                            <Edit2 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 leading-none">
                                {editingPost?.id === "new" ? "New Masterpiece" : "Refining Article"}
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                                <div className="flex bg-gray-100/80 p-1 rounded-xl backdrop-blur-sm">
                                    {[
                                        { id: "edit", label: "Write", icon: Edit2 },
                                        { id: "split", label: "Focus", icon: Code },
                                        { id: "preview", label: "Live", icon: ExternalLink }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setViewMode(tab.id as any)} 
                                            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all ${viewMode === tab.id ? "bg-white shadow-md text-primary" : "text-gray-400 hover:text-gray-600"}`}
                                        >
                                            <tab.icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                            <span className={viewMode === tab.id ? "inline" : "hidden sm:inline"}>{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setEditingPost(null)} variant="ghost" className="md:hidden rounded-xl text-gray-400 h-10 w-10 p-0"><X className="w-6 h-6" /></Button>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto mt-2 md:mt-0">
                    <div className="flex flex-col items-start md:items-end md:mr-4">
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${editingPost?.published ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"}`} />
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">{editingPost?.published ? "Live Presence" : "Private Draft"}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button onClick={() => setEditingPost(null)} variant="ghost" className="hidden md:flex rounded-2xl font-bold text-gray-400 hover:text-gray-900 h-12 px-6">Discard</Button>
                        <Button 
                            onClick={savePost} 
                            disabled={isSaving} 
                            className="rounded-xl md:rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white min-w-[120px] md:min-w-[160px] h-10 md:h-12 text-xs md:text-sm font-black gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
                            {isSaving ? "Working..." : "Save Article"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#fbfbfc]">
                {/* Editor Surface */}
                {(viewMode === "edit" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-full lg:w-[60%]" : "w-full"} h-full overflow-hidden flex flex-col bg-white border-r border-gray-50`}>
                        {/* Writing Toolbar */}
                        <div className="px-4 md:px-8 py-3 bg-gray-50/50 border-b border-gray-50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[8px] md:text-[10px] font-black uppercase text-gray-400 mr-2 shrink-0">Structure</span>
                            <div className="flex items-center gap-1">
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 font-black text-[10px] md:text-xs" onClick={() => setEditorContent({...editorContent, content_html: editorContent.content_html + "<h2>Heading 2</h2>\n"})}>H2</button>
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 font-black text-[10px] md:text-xs" onClick={() => setEditorContent({...editorContent, content_html: editorContent.content_html + "<h3>Heading 3</h3>\n"})}>H3</button>
                                <div className="w-px h-4 bg-gray-200 mx-1" />
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500" onClick={() => setEditorContent({...editorContent, content_html: editorContent.content_html + "<b>Bold Text</b>"})}><b>B</b></button>
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 italic" onClick={() => setEditorContent({...editorContent, content_html: editorContent.content_html + "<i>Italic Text</i>"})}><i>I</i></button>
                                <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500" onClick={() => setEditorContent({...editorContent, content_html: editorContent.content_html + '<a href="#" class="text-primary hover:underline">Link Text</a>'})}>Link</button>
                            </div>
                            <div className="flex-1" />
                            <button 
                                onClick={generateAIArticle}
                                className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[8px] md:text-[10px] hover:bg-indigo-100 transition-all border border-indigo-100 shrink-0"
                            >
                                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> ZARA ASSIST
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-8 md:space-y-12">
                                <div className="space-y-4">
                                    <input 
                                        className="w-full bg-transparent border-0 focus:ring-0 text-3xl md:text-5xl font-black text-gray-900 placeholder:text-gray-100 selection:bg-primary/10"
                                        value={editorContent.title}
                                        onChange={e => setEditorContent({...editorContent, title: e.target.value})}
                                        placeholder="Tempting Title..."
                                    />
                                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-xs font-mono text-gray-400">
                                        <span className="flex items-center gap-1.5"><Link className="w-3 h-3 md:w-3.5 md:h-3.5" /> /{editorContent.slug}</span>
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> {editorContent.read_time_minutes} min read</span>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <textarea 
                                        className="w-full min-h-[600px] bg-transparent border-0 focus:ring-0 font-mono text-gray-600 text-base leading-relaxed resize-none p-0 selection:bg-primary/20"
                                        value={editorContent.content_html}
                                        onChange={e => setEditorContent({...editorContent, content_html: e.target.value})}
                                        placeholder="<p>Enchant your readers here...</p>"
                                    />
                                </div>

                                {/* SEO Metadata Section */}
                                <div className="pt-8 md:pt-12 border-t border-gray-50 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Search Meta Description</label>
                                            <textarea 
                                                className="w-full h-24 md:h-32 p-4 rounded-xl md:rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-xs leading-relaxed font-medium text-gray-500"
                                                value={editorContent.meta_description}
                                                onChange={e => setEditorContent({...editorContent, meta_description: e.target.value})}
                                                placeholder="Write a snippet that guarantees clicks..."
                                            />
                                            <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black text-gray-300">
                                                <span>Characters: {editorContent.meta_description.length}</span>
                                                <span className={editorContent.meta_description.length > 160 ? "text-red-400" : "text-emerald-400"}>Recommended: 155-160</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Target Slug</label>
                                                <input 
                                                    className="w-full p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-100 text-[10px] md:text-xs font-mono"
                                                    value={editorContent.slug}
                                                    onChange={e => setEditorContent({...editorContent, slug: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Read Time</label>
                                                <input 
                                                    type="number"
                                                    className="w-full p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-100 text-[10px] md:text-xs font-black"
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
                )}

                {/* Preview Surface / Zara Sidebar */}
                {(viewMode === "preview" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-full lg:w-[40%]" : "w-full"} h-full overflow-hidden flex flex-col bg-[#f8f9fa] border-t lg:border-t-0 lg:border-l border-gray-100`}>
                        {/* Preview Header */}
                        <div className="px-8 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Public Rendering</span>
                            <div className="flex gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20" />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                            <div className="max-w-xl mx-auto bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 overflow-hidden min-h-full border border-white">
                                <div className="p-10 md:p-16 prose prose-slate prose-h1:text-4xl prose-h1:font-black prose-h2:text-2xl prose-h2:font-black prose-p:text-gray-600 prose-p:leading-loose prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                                    <div className="mb-12">
                                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] bg-primary/10 px-3 py-1 rounded-full mb-6 inline-block">Destination Story</span>
                                        <h1 className="leading-tight mb-4 tracking-tighter">{editorContent.title || "Your Epic Journey Begins Here..."}</h1>
                                        <div className="h-1.5 w-20 bg-primary rounded-full" />
                                    </div>
                                    <div dangerouslySetInnerHTML={{ __html: editorContent.content_html }} />
                                    
                                    {/* Brand Signature */}
                                    <div className="mt-20 pt-10 border-t border-gray-100 flex items-center gap-4 not-prose">
                                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black italic shadow-lg shadow-primary/30">A</div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900">Axelo Tours & Safari Ltd</p>
                                            <p className="text-[10px] font-medium text-gray-400 italic">Exploring the wild, protecting the soul.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Zara Interaction Pad */}
                        {viewMode === "split" && (
                            <div className="shrink-0 p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Zara Intelligence</span>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 bg-gray-50 border-gray-100 rounded-xl px-4 py-2 text-xs font-medium focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                                        placeholder="Ask Zara to 'Optimize for SEO' or 'Add travel tips'..."
                                        value={zaraCommand}
                                        onChange={e => setZaraCommand(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleZaraCommand()}
                                        disabled={isRefining}
                                    />
                                    <Button 
                                        onClick={handleZaraCommand}
                                        disabled={isRefining || !zaraCommand.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 font-black text-[10px] h-9"
                                    >
                                        {isRefining ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Command"}
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
