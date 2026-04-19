import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safari & Travel Blog | Axelo Tours Kenya",
  description: "Read the latest guides, tips, and insights on luxury African safaris, the Great Wildebeest Migration, and Kenyan coastal retreats from the experts at Axelo Tours.",
};

export const revalidate = 3600; // Revalidate every hour

async function getPosts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase
    .from("blog_posts")
    .select("slug, title, meta_description, read_time_minutes, created_at, keywords")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
            The Safari <span className="text-primary italic">Journal</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert guides, travel tips, and stories from the heart of the wild. Discover everything you need to know before your African adventure.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post: any) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col h-full">
              {/* Optional: If we had a cover_image in DB, we'd put it here. For now a gradient placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative overflow-hidden">
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                   {post.keywords && post.keywords.length > 0 && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 uppercase tracking-widest shadow-lg">
                            {post.keywords[0]}
                        </div>
                   )}
              </div>
              <div className="p-8 flex-grow flex flex-col">
                <div className="flex items-center gap-4 text-xs font-bold text-gray-400 tracking-wider uppercase mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {post.read_time_minutes} min read</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                </h2>
                <p className="text-gray-500 mb-8 line-clamp-3 leading-relaxed">
                    {post.meta_description}
                </p>
                <div className="mt-auto flex items-center text-primary font-bold text-sm tracking-wide uppercase gap-2 group-hover:gap-3 transition-all">
                    Read Article <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
          
          {posts.length === 0 && (
            <div className="col-span-full py-20 text-center">
                <p className="text-gray-500 text-lg">No articles currently published. Check back soon for new content!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
