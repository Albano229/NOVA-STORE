import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const pool = getAuthPool();

    const shopResult = await pool.query(
      `SELECT
        s.id, s.name, s.slug, s.description, s.logo, s.banner,
        s.phone, s.email, s.address, s.city, s.country,
        s."isVerified", s."createdAt"
      FROM "Shop" s
      WHERE s.slug = $1`,
      [slug]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const shop = shopResult.rows[0];

    const productsResult = await pool.query(
      `SELECT
        p.id, p.name, p.slug, p.price, p."comparePrice", p."isActive", p."requiresShippingAddress",
        p."productType", p."ctaText", p."ctaColor",
        COALESCE(
          (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt) ORDER BY pi."position" ASC)
           FROM "ProductImage" pi WHERE pi."productId" = p.id LIMIT 1),
          '[]'::json
        ) AS images
      FROM "Product" p
      WHERE p."shopId" = $1 AND p."isActive" = true
      ORDER BY p."createdAt" DESC`,
      [shop.id]
    );

    const reviewsResult = await pool.query(
      `SELECT
        r.id, r.rating, r.comment, r."createdAt",
        json_build_object('name', u.name, 'image', u.image) AS user
      FROM "Review" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."shopId" = $1
      ORDER BY r."createdAt" DESC`,
      [shop.id]
    );

    const countsResult = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM "Product" WHERE "shopId" = $1) AS "productCount",
        (SELECT COUNT(*)::int FROM "ShopFollow" WHERE "shopId" = $1) AS "followerCount"`,
      [shop.id]
    );

    const { productCount, followerCount } = countsResult.rows[0];

    const reviews = reviewsResult.rows;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

    let isFollowing = false;
    if (session?.user?.id) {
      const followResult = await pool.query(
        `SELECT 1 FROM "ShopFollow" WHERE "userId" = $1 AND "shopId" = $2`,
        [session.user.id, shop.id]
      );
      isFollowing = followResult.rows.length > 0;
    }

    return NextResponse.json({
      ...shop,
      products: productsResult.rows,
      reviews,
      _count: { products: productCount, followers: followerCount },
      averageRating,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
