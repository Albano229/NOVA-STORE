"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface ReviewSectionProps {
  productId: string;
  initialAvgRating: number;
  initialReviewCount: number;
  hasPurchased: boolean;
}

export default function ReviewSection({
  productId,
  initialAvgRating,
  initialReviewCount,
  hasPurchased,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(initialAvgRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  const handleReviewSubmitted = (
    review: Review,
    stats: { avgRating: number; reviewCount: number }
  ) => {
    setReviews((prev) => [review, ...prev]);
    setAvgRating(stats.avgRating);
    setReviewCount(stats.reviewCount);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setAvgRating(data.stats.avgRating);
      setReviewCount(data.stats.reviewCount);
      toast.success("Avis supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getInitial = (name: string | null) =>
    name ? name.charAt(0).toUpperCase() : "?";

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-gray-200 text-gray-200"
        }`}
      />
    ));

  return (
    <div className="mt-8 sm:mt-12">
      {/* Summary Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-[#0f172a]">
          <MessageSquare className="h-5 w-5 text-[#7126b6]" />
          Avis clients
        </h2>

        {/* Summary */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Score moyen */}
          <div className="flex flex-col items-center gap-2 sm:min-w-[160px]">
            <span className="text-4xl font-bold text-[#0f172a]">
              {avgRating > 0 ? avgRating.toFixed(1) : "—"}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {reviewCount} avis
            </p>
          </div>

          {/* Barre de répartition */}
          {reviewCount > 0 && (
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(
                  (r) => Math.round(r.rating) === star
                ).length;
                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-3">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-yellow-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-7 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-gray-200" />
                      <div className="h-2.5 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="mt-2.5 h-3 w-full rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Aucun avis pour l&apos;instant. Soyez le premier !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl bg-gray-50 p-4 transition hover:bg-gray-100/50"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {review.user.image ? (
                      <img
                        src={review.user.image}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7126b6]/10 text-sm font-bold text-[#7126b6]">
                        {getInitial(review.user.name)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#0f172a]">
                          {review.user.name
                            ? review.user.name.split(" ")[0]
                            : "Anonyme"}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {renderStars(review.rating)}
                        </div>
                        {session?.user?.id && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="ml-auto rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                      {review.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      {session?.user && (
        <ReviewForm
          productId={productId}
          hasPurchased={hasPurchased}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {!session?.user && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            <a
              href="/auth/login"
              className="font-medium text-[#7126b6] hover:underline"
            >
              Connectez-vous
            </a>{" "}
            pour laisser un avis.
          </p>
        </div>
      )}
    </div>
  );
}
