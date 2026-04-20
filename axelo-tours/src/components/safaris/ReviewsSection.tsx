"use client";

import { useEffect, useState } from "react";
import { Star, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_country: string | null;
  rating: number;
  body: string;
  created_at: string;
}

export function ReviewsSection({ packageId, packageName }: { packageId: string; packageName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!packageId) { setLoading(false); return; }
    fetch(`/api/reviews/${packageId}`)
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .finally(() => setLoading(false));
  }, [packageId]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  const count = reviews.length;

  return (
    <section className="mb-16">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Traveller Reviews</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-foreground">{avgRating}</span>
            {!loading && (
              <span className="text-muted-foreground font-medium">
                ({count} verified {count === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && count === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-3xl border border-border/40">
          <p className="text-muted-foreground font-medium">
            Be the first to review <strong>{packageName}</strong>.
          </p>
        </div>
      )}

      {/* Review grid */}
      {!loading && count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-white border border-border/40 rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Stars + Date */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {new Date(review.created_at).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Body */}
              <p className="text-foreground leading-relaxed mb-5 font-medium italic">
                &ldquo;{review.body}&rdquo;
              </p>

              {/* Reviewer */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {review.reviewer_name.charAt(0)}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-bold text-sm text-foreground leading-none truncate">
                    {review.reviewer_name}
                  </p>
                  {review.reviewer_country && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Globe className="w-3 h-3 shrink-0" />
                      {review.reviewer_country}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 shrink-0">
                  ✓ Verified
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
