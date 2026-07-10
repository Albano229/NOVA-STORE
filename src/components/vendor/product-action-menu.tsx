"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Pencil,
  Eye,
  Copy,
  Share2,
  Link2,
  Pin,
  EyeOff,
  Trash2,
  ChevronRight,
  Globe,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductActionMenuProps {
  product: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    isFeatured?: boolean;
    price: number;
  };
  shopSlug: string;
  onToggleActive: (productId: string, newActive: boolean) => void;
  onDelete?: (productId: string) => void;
}

export function ProductActionMenu({
  product,
  shopSlug,
  onToggleActive,
  onDelete,
}: ProductActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShareOpen(false);
        setLinkOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.slug}`;

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        onToggleActive(product.id, !product.isActive);
        toast.success(product.isActive ? "Produit dépublié" : "Produit publié");
        setOpen(false);
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/vendor/products/${product.id}`);
      if (!res.ok) return toast.error("Erreur lors de la récupération");
      const data = await res.json();
      const { id, createdAt, updatedAt, slug, ...rest } = data;
      const createRes = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, name: `${rest.name} (copie)` }),
      });
      if (createRes.ok) {
        toast.success("Produit dupliqué !");
        setOpen(false);
        window.location.reload();
      } else {
        toast.error("Erreur lors de la duplication");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleToggleFeatured = async () => {
    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      });
      if (res.ok) {
        toast.success(product.isFeatured ? "Retiré des mise en avant" : "Mis en avant !");
        setOpen(false);
        window.location.reload();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast.success("Lien copié !");
      setLinkOpen(false);
      setOpen(false);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleGeneratePaymentLink = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/moneyfusion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: product.price,
          customerName: "Client",
          customerPhone: "00000000",
          items: [{ name: product.name, price: product.price, quantity: 1 }],
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Erreur");
      if (data.redirectUrl) {
        await navigator.clipboard.writeText(data.redirectUrl);
        toast.success("Lien de paiement copié !");
        setLinkOpen(false);
        setOpen(false);
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    const text = `Découvrez "${product.name}" sur notre boutique !`;
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + productUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`,
    };
    if (platform === "native" && navigator.share) {
      try { await navigator.share({ title: product.name, text, url: productUrl }); } catch {}
    } else if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=400");
    }
    setShareOpen(false);
    setOpen(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      const res = await fetch(`/api/vendor/products/${product.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Produit supprimé");
        setOpen(false);
        onDelete?.(product.id);
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        onClick={() => {
          if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setMenuAbove(spaceBelow < 420);
          }
          setOpen(!open);
          setShareOpen(false);
          setLinkOpen(false);
          setConfirmDelete(false);
        }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 active:bg-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div className={`absolute right-0 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${menuAbove ? "bottom-full mb-1" : "top-full mt-1"}`}>
          <Link
            href={`/vendor/products/${product.id}`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Pencil className="h-4 w-4 text-blue-500" />
            Modifier
          </Link>

          <a
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Eye className="h-4 w-4 text-green-500" />
            Voir
          </a>

          <button
            onClick={handleDuplicate}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Copy className="h-4 w-4 text-indigo-500" />
            Dupliquer
          </button>

          <div>
            <button
              onClick={() => { setShareOpen(!shareOpen); setLinkOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="flex items-center gap-3">
                <Share2 className="h-4 w-4 text-purple-500" />
                Partager
              </span>
              <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${shareOpen ? "rotate-90" : ""}`} />
            </button>
            {shareOpen && (
              <div className="border-t border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-700/50">
                <button onClick={() => handleShare("whatsapp")} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                  <span>💬</span> WhatsApp
                </button>
                <button onClick={() => handleShare("facebook")} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                  <span>📘</span> Facebook
                </button>
                <button onClick={() => handleShare("twitter")} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                  <span>🐦</span> Twitter / X
                </button>
                <button onClick={() => handleShare("telegram")} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                  <span>✈️</span> Telegram
                </button>
                {"share" in navigator && (
                  <button onClick={() => handleShare("native")} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                    <Share2 className="h-4 w-4" /> Partager...
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => { setLinkOpen(!linkOpen); setShareOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="flex items-center gap-3">
                <Link2 className="h-4 w-4 text-orange-500" />
                Lien
              </span>
              <ChevronRight className={`h-3.5 w-3.5 text-gray-400 transition-transform ${linkOpen ? "rotate-90" : ""}`} />
            </button>
            {linkOpen && (
              <div className="border-t border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-700/50">
                <button onClick={handleCopyLink} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600">
                  <Globe className="h-3.5 w-3.5" /> Lien du produit
                </button>
                <button onClick={handleGeneratePaymentLink} disabled={paymentLoading} className="flex w-full items-center gap-3 px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600">
                  <CreditCard className="h-3.5 w-3.5" /> {paymentLoading ? "Génération..." : "Lien de paiement"}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleFeatured}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Pin className={`h-4 w-4 ${product.isFeatured ? "text-yellow-500" : "text-gray-400"}`} />
            {product.isFeatured ? "Retirer la mise en avant" : "Mettre en avant"}
          </button>

          <button
            onClick={handleToggleActive}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {product.isActive ? (
              <>
                <EyeOff className="h-4 w-4 text-amber-500" />
                Dépublier
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 text-green-500" />
                Publier
              </>
            )}
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleDelete}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                confirmDelete
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? "Confirmer la suppression" : "Supprimer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
