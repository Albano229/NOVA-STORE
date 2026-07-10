import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { supabase } from "@/lib/supabase";

const PRIVATE_BUCKET = "nova-files";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Produit requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const productResult = await pool.query(
      `SELECT
        p.id, p."productType",
        row_to_json(df) AS "digitalFile"
      FROM "Product" p
      LEFT JOIN "DigitalFile" df ON df."productId" = p.id
      WHERE p.id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const product = productResult.rows[0];

    if (product.productType !== "DIGITAL" || !product.digitalFile) {
      return NextResponse.json({ error: "Produit digital non trouvé" }, { status: 404 });
    }

    const purchaseResult = await pool.query(
      `SELECT 1
       FROM "Order" o
       INNER JOIN "OrderItem" oi ON oi."orderId" = o.id
       WHERE o."userId" = $1
         AND o."paymentStatus" = 'COMPLETED'
         AND o.status != 'CANCELLED'
         AND oi."productId" = $2
       LIMIT 1`,
      [session.user.id, productId]
    );

    if (purchaseResult.rows.length === 0) {
      return NextResponse.json({ error: "Vous devez acheter ce produit pour le télécharger" }, { status: 403 });
    }

    const df = product.digitalFile;

    if (df.maxDownloads && df.downloadCount >= df.maxDownloads) {
      return NextResponse.json({ error: "Limite de téléchargements atteinte" }, { status: 403 });
    }

    await pool.query(
      `UPDATE "DigitalFile" SET "downloadCount" = "downloadCount" + 1 WHERE id = $1`,
      [df.id]
    );

    const isPrivateBucket = df.storageBucket === PRIVATE_BUCKET;

    if (isPrivateBucket && df.storagePath) {
      const { data: signedData, error: signError } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(df.storagePath, 3600);

      if (signError) {
        console.error("Signed URL error:", signError);
        return NextResponse.json({ error: "Erreur génération lien sécurisé" }, { status: 500 });
      }

      return NextResponse.json({
        url: signedData.signedUrl,
        fileName: df.fileName,
        fileType: df.fileType,
      });
    }

    const fileUrl = df.fileUrl || df.externalUrl;
    if (!fileUrl) {
      return NextResponse.json({ error: "Fichier non disponible" }, { status: 404 });
    }

    return NextResponse.json({
      url: fileUrl,
      fileName: df.fileName,
      fileType: df.fileType,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
