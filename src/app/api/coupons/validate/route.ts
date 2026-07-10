import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { code, orderTotal, shopId, productIds } = body;

    if (!code) {
      return NextResponse.json({ error: "Code promo requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT * FROM "Coupon" WHERE code = $1 AND "isActive" = true`,
      [code.toUpperCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Code promo invalide ou expiré", valid: false },
        { status: 400 }
      );
    }

    const coupon = result.rows[0];

    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return NextResponse.json(
        { error: "Ce code promo n'est pas encore actif", valid: false },
        { status: 400 }
      );
    }

    if (coupon.endsAt && new Date(coupon.endsAt) < new Date()) {
      return NextResponse.json(
        { error: "Ce code promo a expiré", valid: false },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Ce code promo a atteint sa limite d'utilisation", valid: false },
        { status: 400 }
      );
    }

    if (coupon.shopId && shopId && coupon.shopId !== shopId) {
      return NextResponse.json(
        { error: "Ce code promo n'est pas valable pour cette boutique", valid: false },
        { status: 400 }
      );
    }

    if (coupon.minOrderAmount && orderTotal && orderTotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Montant minimum requis: ${coupon.minOrderAmount}`,
          valid: false,
          minOrderAmount: coupon.minOrderAmount,
        },
        { status: 400 }
      );
    }

    const userUsages = await pool.query(
      `SELECT COUNT(*) FROM "CouponUsage" WHERE "couponId" = $1 AND "userId" = $2`,
      [coupon.id, session.user.id]
    );

    if (coupon.perUserLimit && parseInt(userUsages.rows[0].count) >= coupon.perUserLimit) {
      return NextResponse.json(
        { error: "Vous avez déjà utilisé ce code promo", valid: false },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (orderTotal || 0) * (coupon.discountValue / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
    });
  } catch (error) {
    console.error("[Coupon Validate] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
