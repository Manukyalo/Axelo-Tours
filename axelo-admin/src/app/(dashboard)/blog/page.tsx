"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, 
  X, RefreshCw, Sparkles, BookOpen, Clock, Calendar, CheckCircle2,
  FileText
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
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);
  
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
        const res = await fetch("/api/blog/generate", { method: "POST" });
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
    await supabase.from("blog_posts").delete().eq("id", id);
    fetchPosts();
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
        <Button 
            onClick={generateAIArticle} 
            disabled={generating}
            className="gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg text-white font-bold h-12 px-6 rounded-2xl"
        >
            {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? "Zara is writing..." : "Generate AI Article"}
        </Button>
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
                                     <button onClick={() => setPreviewPost(post)} className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors tooltip-trigger" title="Preview & Edit">
                                        <FileText className="w-4 h-4" />
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
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-0">
            {previewPost && (
                <div className="bg-white">
                    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Article Preview</h2>
                            <p className="text-sm text-gray-500 mt-1">Review format before publishing to the main site.</p>
                        </div>
                        <Button onClick={() => setPreviewPost(null)} variant="outline" className="rounded-xl">Close</Button>
                    </div>
                    <div className="p-10 mx-auto max-w-3xl prose prose-gray prose-h1:text-4xl prose-h1:font-black prose-headings:font-bold prose-a:text-primary">
                        <h1>{previewPost.title}</h1>
                        <div dangerouslySetInnerHTML={{ __html: previewPost.content_html }} />
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
