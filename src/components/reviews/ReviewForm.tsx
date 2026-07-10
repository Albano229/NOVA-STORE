"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import toast from "react-hot-toast";

interface ReviewFormProps {
  productId: string;
  hasPurchased: boolean;
  onReviewSubmitted: (review: any, stats: { avgRating: number; reviewCount: number }) => void;
}

export default function ReviewForm({
  productId,
  hasPurchased,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ratingLabels: Record<number, string> = {
    1: "Très mauvais",
    2: "Mauvais",
    3: "Correct",
    4: "Bien",
    5: "Excellent",
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la soumission.");
        return;
      }

      toast.success("Avis publié avec succès !");
      setRating(0);
      setComment("");
      setIsOpen(false);
      onReviewSubmitted(data.review, data.stats);
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#7126b6] hover:shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7126b6]/10">
            <Send className="h-5 w-5 text-[#7126b6]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">
              Laisser un avis
            </p>
            <p className="text-xs text-gray-500">
              {hasPurchased
                ? "Vous avez acheté ce produit — votre avis sera vérifié"
                : "Réservé aux acheteurs de ce produit"}
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Form */}
      {isOpen && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          {hasPurchased ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Achat vérifié
                </span>
              </div>

              {/* Star Selector */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">
                  Votre note
                </label>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} size="lg" />
                  {rating > 0 && (
                    <span className="text-sm font-medium text-[#7126b6]">
                      {ratingLabels[rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-[#0f172a]">
                  Votre commentaire{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre expérience avec ce produit..."
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-[#0f172a] placeholder-gray-400 focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] resize-none"
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {comment.length}/500
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="bg-[#7126b6] hover:bg-[#5e1f9a]"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Publier l&apos;avis
                  </span>
                )}
              </Button>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-500">
                Seuls les clients ayant acheté ce produit peuvent laisser un avis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
