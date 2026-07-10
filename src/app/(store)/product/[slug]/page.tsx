import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuthPool } from "@/lib/auth-pool";
import ProductDetailClient from "./ProductDetailClient";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  productType: string;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  brand: string | null;
  postPurchaseInstructions: string | null;
  warranty: string | null;
  returnPolicy: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  videoUrl: string | null;
  ctaText: string | null;
  ctaColor: string | null;
  shop: { id: string; name: string; slug: string; logo: string | null; isVerified: boolean };
  images: { id: string; url: string; alt: string | null; position: number }[];
  category?: { id: string; name: string; slug: string } | null;
  digitalFile?: { fileUrl: string | null; fileName: string | null; maxDownloads: number | null; downloadCount: number } | null;
  physicalOpt?: any;
  variants?: { id: string; name: string; sku: string | null; price: number; stock: number; image: string | null; options: any; isActive: boolean }[];
  variantOptionsRaw?: any[];
  similarProducts?: { id: string; name: string; slug: string; price: number; comparePrice: number | null; images: { url: string; alt: string | null }[]; avgRating: number; reviewCount: number }[];
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT
        p.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'logo', s.logo, 'isVerified', s."isVerified") AS shop,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'position', pi."position") ORDER BY pi."position" ASC)
           FROM "ProductImage" pi WHERE pi."productId" = p.id),
          '[]'::json
        ) AS images,
        (SELECT row_to_json(df) FROM "DigitalFile" df WHERE df."productId" = p.id) AS "digitalFile",
        (SELECT row_to_json(po) FROM "PhysicalOption" po WHERE po."productId" = p.id) AS "physicalOpt",
        COALESCE(
          (SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'sku', pv.sku, 'price', pv.price, 'stock', pv.stock, 'image', pv.image, 'options', pv.options, 'isActive', pv."isActive") ORDER BY pv."createdAt" ASC)
           FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv."isActive" = true),
          '[]'::json
        ) AS "variantOptions"
      FROM "Product" p
      LEFT JOIN "Shop" s ON s.id = p."shopId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p.slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

async function getSimilarProducts(shopId: string, categoryId: string | null, excludeId: string): Promise<Product["similarProducts"]> {
  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT
        p.id, p.name, p.slug, p.price, p."comparePrice", p."avgRating", p."reviewCount",
        COALESCE(
          (SELECT json_agg(json_build_object('url', pi.url, 'alt', pi.alt) ORDER BY pi."position" ASC)
           FROM "ProductImage" pi WHERE pi."productId" = p.id LIMIT 1),
          '[]'::json
        ) AS images
      FROM "Product" p
      WHERE p."shopId" = $1
        AND p.id != $2
        AND p."isActive" = true
        AND p.status = 'published'
      ORDER BY ${categoryId ? `CASE WHEN p."categoryId" = $3 THEN 0 ELSE 1 END,` : ""} p."soldCount" DESC
      LIMIT 6`,
      categoryId ? [shopId, excludeId, categoryId] : [shopId, excludeId]
    );
    return result.rows;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Produit non trouvé — NOVA Store" };
  }

  const title = product.seoTitle || product.name;
  const description =
    product.seoDescription ||
    product.description?.replace(/<[^>]*>/g, "").substring(0, 160) ||
    "";
  const url = `https://nova-store.vercel.app/product/${product.slug}`;
  const image = product.images[0]?.url || null;

  return {
    title: `${title} — NOVA Store`,
    description,
    keywords: product.seoKeywords || undefined,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "NOVA Store",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const similarProducts = await getSimilarProducts(
    product.shop.id,
    product.category?.id || null,
    product.id
  );

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-96 rounded-xl bg-gray-200" />
          </div>
        </div>
      }
    >
      <ProductDetailClient product={{ ...product, similarProducts }} />
    </Suspense>
  );
}
