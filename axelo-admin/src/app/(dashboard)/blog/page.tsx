"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, RefreshCw, Sparkles, BookOpen, Clock, Calendar, CheckCircle2,
  FileText, Save, ExternalLink, Code
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
        title: post.title,
        slug: post.slug,
        meta_description: post.meta_description,
        content_html: post.content_html,
        keywords: post.keywords,
        read_time_minutes: post.read_time_minutes,
    });
  };

  const createNewPost = () => {
    const newPost: Partial<BlogPost> = {
        title: "Untitled Article",
        slug: "untitled-" + Math.random().toString(36).substring(7),
        meta_description: "Enter a meta description...",
        content_html: "<h1>New Article</h1><p>Start writing here...</p>",
        keywords: [],
        read_time_minutes: 5,
        published: false
    };
    
    setEditingPost(null); // Explicitly null for "new"
    setEditorContent(newPost as any);
    // Open the modal by setting an "ID" that we'll check later
    setEditingPost({ id: "new" } as any);
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
                                <div className="font-bold text-gray-900 truncate">{post.title}</div>
                                <div className="text-xs text-gray-400 truncate mt-1">/{post.slug}</div>
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
        <DialogContent className="max-w-[95vw] w-[1400px] max-h-[95vh] h-[900px] overflow-hidden rounded-3xl p-0 border-0 flex flex-col">
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Edit2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{editingPost?.id === "new" ? "Create New Article" : "Edit Article"}</h2>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button onClick={() => setViewMode("edit")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === "edit" ? "bg-white shadow-sm text-primary" : "text-gray-500"}`}>Code</button>
                                <button onClick={() => setViewMode("split")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === "split" ? "bg-white shadow-sm text-primary" : "text-gray-500"}`}>Split</button>
                                <button onClick={() => setViewMode("preview")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === "preview" ? "bg-white shadow-sm text-primary" : "text-gray-500"}`}>Preview</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setEditingPost(null)} variant="ghost" className="rounded-xl">Cancel</Button>
                    <Button onClick={savePost} disabled={isSaving} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white min-w-[120px] font-bold gap-2">
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? "Saving..." : "Save Article"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex bg-gray-50">
                {/* Editor Side */}
                {(viewMode === "edit" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} h-full overflow-y-auto p-6 space-y-6 border-r border-gray-100 bg-white`}>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Article Title</label>
                                <input 
                                    className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg"
                                    value={editorContent.title}
                                    onChange={e => setEditorContent({...editorContent, title: e.target.value})}
                                    placeholder="Enter title..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">URL Slug</label>
                                    <input 
                                        className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-sm font-mono"
                                        value={editorContent.slug}
                                        onChange={e => setEditorContent({...editorContent, slug: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Read Time (Mins)</label>
                                    <input 
                                        type="number"
                                        className="w-full h-11 px-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                                        value={editorContent.read_time_minutes}
                                        onChange={e => setEditorContent({...editorContent, read_time_minutes: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Meta Description (SEO)</label>
                                <textarea 
                                    className="w-full h-20 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-none"
                                    value={editorContent.meta_description}
                                    onChange={e => setEditorContent({...editorContent, meta_description: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block font-mono">HTML Content</label>
                                <textarea 
                                    className="w-full h-[400px] p-4 rounded-xl border border-gray-100 bg-slate-900 text-slate-300 font-mono text-sm focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
                                    value={editorContent.content_html}
                                    onChange={e => setEditorContent({...editorContent, content_html: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Side */}
                {(viewMode === "preview" || viewMode === "split") && (
                    <div className={`${viewMode === "split" ? "w-1/2" : "w-full"} h-full overflow-y-auto bg-gray-50 p-8`}>
                        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden min-h-full">
                            <div className="p-8 md:p-12 prose prose-gray prose-h1:text-3xl prose-h1:font-black prose-headings:font-bold prose-lg prose-a:text-primary">
                                <h4 className="text-primary text-xs font-black uppercase tracking-[0.2em] mb-4">Live Preview</h4>
                                <h1 className="mb-8">{editorContent.title}</h1>
                                <div dangerouslySetInnerHTML={{ __html: editorContent.content_html }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
