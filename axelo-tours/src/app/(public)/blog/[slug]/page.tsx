import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Share2, Compass } from "lucide-react";
import Script from "next/script";

export const revalidate = 3600;

async function getPost(slug: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return data;
}

// Generate Dynamic Metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Article Not Found | Axelo Tours" };

  return {
    title: `${post.title} | Axelo Tours`,
    description: post.meta_description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: "article",
      publishedTime: post.published_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
    }
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.meta_description,
    "datePublished": post.published_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "Axelo Tours & Safari Ltd",
      "url": "https://axelotours.co.ke" // Update if domain changes
    },
    "publisher": {
      "@type": "Organization",
      "name": "Axelo Tours & Safari Ltd",
      "logo": {
        "@type": "ImageObject",
        "url": "https://axelotours.co.ke/logo.png"
      }
    }
  };

  return (
    <>
      <Script
        id={`jsonld-blog-${post.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      
      <div className="bg-white min-h-screen pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
            
            {/* Back Link */}
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-gray-400 hover:text-primary transition-colors mb-12">
                <ArrowLeft className="w-4 h-4" /> Back to Journal
            </Link>

            {/* Header */}
            <header className="mb-16">
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 tracking-wider uppercase mb-6 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full"><Calendar className="w-4 h-4 text-primary" /> {new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4 text-primary" /> {post.read_time_minutes} min read</span>
                  <button className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"><Share2 className="w-4 h-4" /> Share</button>
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-8">
                    {post.title}
                </h1>
                {/* Optional Top Tags */}
                {post.keywords && post.keywords.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {post.keywords.map((kw: string) => (
                            <span key={kw} className="text-xs font-bold uppercase tracking-widest text-primary/80 border border-primary/20 px-3 py-1 rounded-full">
                                {kw}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* Content & Sidebar Layout */}
            <div className="flex flex-col lg:flex-row gap-16">
                
                {/* Main Article Content */}
                <article className="lg:w-2/3 prose prose-lg prose-gray prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-3xl prose-img:shadow-lg">
                    <div dangerouslySetInnerHTML={{ __html: post.content_html }} />
                </article>

                {/* Sidebar Sticky Panel */}
                <aside className="lg:w-1/3">
                    <div className="sticky top-32 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <Compass className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-gray-900 mb-4">Inspired by this article?</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Turn inspiration into reality. Our expert safari concierges are ready to craft your perfect luxury African itinerary.
                        </p>
                        <Link href="/safaris" className="flex items-center justify-center w-full bg-gray-900 hover:bg-gray-800 text-white font-bold h-14 rounded-xl transition-all shadow-lg hover:shadow-xl mb-4">
                            Explore Packages
                        </Link>
                        <Link href="/contact" className="flex items-center justify-center w-full border-2 border-gray-200 hover:border-gray-900 text-gray-900 font-bold h-14 rounded-xl transition-all">
                            Talk to an Expert
                        </Link>
                    </div>
                </aside>
            </div>

        </div>
      </div>
    </>
  );
}
