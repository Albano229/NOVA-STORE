import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

interface MoneyFusionArticle {
  name: string;
  price: number;
  quantity: number;
}

interface MoneyFusionRequest {
  totalPrice: number;
  article: Record<string, number>[];
  personal_Info: { userId: string; orderId: string }[];
  numeroSend: string;
  nomclient: string;
  return_url: string;
  webhook_url: string;
}

interface MoneyFusionResponse {
  statut: boolean;
  token: string;
  message: string;
  url: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const apiUrl = process.env.MONEYFUSION_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "Money Fusion non configuré" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { orderIds, amount, customerName, customerPhone, items } = body as {
      orderIds: string[];
      amount: number;
      customerName: string;
      customerPhone: string;
      items?: MoneyFusionArticle[];
    };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";

    const articles: Record<string, number>[] =
      items?.map((item) => ({ [item.name]: item.price * item.quantity })) || [
        { "Commande NOVA": amount },
      ];

    const personalInfo = orderIds.map((orderId) => ({
      userId: session.user.id,
      orderId,
    }));

    const paymentData: MoneyFusionRequest = {
      totalPrice: amount,
      article: articles,
      personal_Info: personalInfo,
      numeroSend: customerPhone || "00000000",
      nomclient: customerName || session.user.name || "Client",
      return_url: `${siteUrl}/api/payments/moneyfusion/verify`,
      webhook_url: `${siteUrl}/api/webhook/moneyfusion`,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Money Fusion API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Erreur lors de la communication avec Money Fusion" },
        { status: 502 }
      );
    }

    const result: MoneyFusionResponse = await response.json();

    if (!result.statut || !result.url) {
      return NextResponse.json(
        {
          error: result.message || "Échec de la création du paiement",
        },
        { status: 400 }
      );
    }

    if (orderIds?.length) {
      for (const orderId of orderIds) {
        await pool.query(
          `UPDATE "Payment"
           SET "transactionId" = $1, "metadata" = $2, "updatedAt" = NOW()
           WHERE "orderId" = $3`,
          [
            result.token,
            JSON.stringify({
              moneyFusionToken: result.token,
              moneyFusionUrl: result.url,
            }),
            orderId,
          ]
        );
      }
    }

    return NextResponse.json({
      redirectUrl: result.url,
      token: result.token,
      status: "REDIRECT",
    });
  } catch (error: any) {
    if (error?.name === "TimeoutError" || error?.code === "ABORT_ERR") {
      return NextResponse.json(
        { error: "Money Fusion ne répond pas — veuillez réessayer" },
        { status: 504 }
      );
    }
    console.error("Money Fusion payment error:", error);
    return NextResponse.json(
      { error: "Erreur lors du paiement" },
      { status: 500 }
    );
  }
}
