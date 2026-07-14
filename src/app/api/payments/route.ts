import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

function isFCFA(currency?: string): boolean {
  return currency === "XOF" || currency === "XAF";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds, paymentMethod, currency, amount, customerEmail, customerName, customerPhone, items } = body;

    if (!orderIds?.length || !paymentMethod || !amount) {
      return NextResponse.json({ error: "Données de paiement invalides" }, { status: 400 });
    }

    const pool = getAuthPool();

    for (const orderId of orderIds) {
      await pool.query(
        `INSERT INTO "Payment" ("id", "orderId", "amount", "currency", "method", "status", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING', NOW(), NOW())
         ON CONFLICT ("orderId") DO UPDATE SET "method" = $4, "currency" = $3, "updatedAt" = NOW()`,
        [orderId, amount / orderIds.length, currency || "XOF", paymentMethod]
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";

    switch (paymentMethod) {
      case "STRIPE": {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
          return NextResponse.json({
            redirectUrl: null,
            message: "Paiement en attente — configuration Stripe en cours",
            status: "PENDING",
          });
        }

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "payment_method_types[]": "card",
            "line_items[0][price_data][currency]": (currency || "xof").toLowerCase(),
            "line_items[0][price_data][product_data][name]": `Commande NOVA #${orderIds[0]}`,
            "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
            "line_items[0][quantity]": "1",
            mode: "payment",
            customer_email: customerEmail || "",
            success_url: `${siteUrl}/account/orders?success=true`,
            cancel_url: `${siteUrl}/checkout?cancelled=true`,
            metadata: JSON.stringify({ orderIds: orderIds.join(",") }),
          }).toString(),
        });

        if (stripeRes.ok) {
          const session = await stripeRes.json();
          for (const orderId of orderIds) {
            await pool.query(
              `UPDATE "Payment" SET "transactionId" = $1, "metadata" = $2 WHERE "orderId" = $3`,
              [session.id, JSON.stringify({ stripeSessionId: session.id }), orderId]
            );
          }
          return NextResponse.json({ redirectUrl: session.url, status: "REDIRECT" });
        }
        break;
      }

      case "FLUTTERWAVE": {
        const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!flutterwaveKey) {
          return NextResponse.json({
            redirectUrl: null,
            message: "Paiement en attente — configuration Flutterwave en cours",
            status: "PENDING",
          });
        }

        const fwCurrency = isFCFA(currency) ? "XOF" : (currency || "USD");

        const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${flutterwaveKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tx_ref: `nova-${orderIds[0]}-${Date.now()}`,
            amount,
            currency: fwCurrency,
            redirect_url: `${siteUrl}/api/payments/flutterwave/verify`,
            webhook_url: `${siteUrl}/api/webhooks/flutterwave`,
            customer: {
              email: customerEmail || "",
              name: customerName || "",
              phone_number: customerPhone || "",
            },
            meta: {
              orderIds: orderIds.join(","),
              userId: session.user.id,
            },
            payment_options: "card,mobilemoney,ussd,banktransfer,applepay,googlepay",
          }),
        });

        if (flutterwaveRes.ok) {
          const data = await flutterwaveRes.json();
          if (data.status === "success") {
            for (const orderId of orderIds) {
              await pool.query(
                `UPDATE "Payment" SET "transactionId" = $1, "metadata" = $2 WHERE "orderId" = $3`,
                [
                  data.data.link,
                  JSON.stringify({ flutterwaveTxRef: data.data.tx_ref, flutterwaveLinkId: data.data.link }),
                  orderId
                ]
              );
            }
            return NextResponse.json({ redirectUrl: data.data.link, status: "REDIRECT" });
          }
        }
        break;
      }

      case "FEDAPAY": {
        const fedaKey = process.env.FEDAPAY_SECRET_KEY;
        if (!fedaKey) {
          return NextResponse.json({
            redirectUrl: null,
            message: "Paiement en attente — configuration FedaPay en cours",
            status: "PENDING",
          });
        }

        const fdRes = await fetch("https://api.fedapay.com/v1/transactions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${fedaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            currency: { iso: currency || "XOF" },
            description: `Commande NOVA #${orderIds[0]}`,
            callback_url: `${siteUrl}/api/webhooks/fedapay`,
            customer: {
              email: customerEmail || "",
              lastname: customerName?.split(" ").slice(1).join(" ") || "",
              firstname: customerName?.split(" ")[0] || "",
              phone_number: customerPhone || "",
            },
            meta: {
              orderIds: orderIds.join(","),
              userId: session.user.id,
            },
          }),
        });

        if (fdRes.ok) {
          const data = await fdRes.json();
          if (data.token) {
            for (const orderId of orderIds) {
              await pool.query(
                `UPDATE "Payment" SET "transactionId" = $1 WHERE "orderId" = $2`,
                [data.token, orderId]
              );
            }
            const fedaPublicKey = process.env.FEDAPAY_PUBLIC_KEY || "";
            return NextResponse.json({
              redirectUrl: `https://checkout.fedapay.com/${data.token}?key=${fedaPublicKey}`,
              status: "REDIRECT",
            });
          }
        }
        break;
      }

      case "MONEYFUSION": {
        const mfApiUrl = process.env.MONEYFUSION_API_URL;
        if (!mfApiUrl) {
          return NextResponse.json({
            redirectUrl: null,
            message: "Paiement en attente — configuration Money Fusion en cours",
            status: "PENDING",
          });
        }

        const articles = items?.length
          ? items.map((item: any) => ({
              [item.name || "Article"]: item.price * item.quantity,
            }))
          : [{ "Commande NOVA": amount }];

        const personalInfo = orderIds.map((orderId: string) => ({
          userId: session.user.id,
          orderId,
        }));

        const mfRes = await fetch(mfApiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalPrice: amount,
            article: articles,
            personal_Info: personalInfo,
            numeroSend: customerPhone || "00000000",
            nomclient: customerName || session.user.name || "Client",
            return_url: `${siteUrl}/api/payments/moneyfusion/verify`,
            webhook_url: `${siteUrl}/api/webhook/moneyfusion`,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (mfRes.ok) {
          const mfData = await mfRes.json();
          if (mfData.statut && mfData.url) {
            for (const orderId of orderIds) {
              await pool.query(
                `UPDATE "Payment" SET "transactionId" = $1, "metadata" = $2 WHERE "orderId" = $3`,
                [
                  mfData.token,
                  JSON.stringify({
                    moneyFusionToken: mfData.token,
                    moneyFusionUrl: mfData.url,
                  }),
                  orderId,
                ]
              );
            }
            return NextResponse.json({
              redirectUrl: mfData.url,
              status: "REDIRECT",
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json({ redirectUrl: null, status: "PENDING" });
    }

    return NextResponse.json({
      redirectUrl: null,
      message: "Paiement enregistré. Le vendeur traitera votre commande.",
      status: "PENDING",
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Erreur lors du paiement" }, { status: 500 });
  }
}
