import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT * FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [session.user.id]
    );

    return NextResponse.json({ addresses: result.rows });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await request.json();
    const { label, firstName, lastName, address, city, state, postalCode, country, phone, isDefault } = body;

    if (!firstName || !lastName || !address || !city || !country) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (isDefault) {
      await pool.query(
        `UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`,
        [session.user.id]
      );
    }

    const result = await pool.query(
      `INSERT INTO "Address" ("id", "userId", "label", "firstName", "lastName", "address", "city", "state", "postalCode", "country", "phone", "isDefault")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        session.user.id,
        label || "Domicile",
        firstName,
        lastName,
        address,
        city,
        state || null,
        postalCode || "",
        country,
        phone || "",
        isDefault || false,
      ]
    );

    return NextResponse.json({ address: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await request.json();
    const { id, label, firstName, lastName, address, city, state, postalCode, country, phone, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    if (isDefault) {
      await pool.query(
        `UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`,
        [session.user.id]
      );
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = { label, firstName, lastName, address, city, state, postalCode, country, phone, isDefault };
    for (const [key, val] of Object.entries(allowedFields)) {
      if (val !== undefined) {
        fields.push(`"${key}" = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    values.push(id, session.user.id);
    const result = await pool.query(
      `UPDATE "Address" SET ${fields.join(", ")} WHERE "id" = $${idx} AND "userId" = $${idx + 1} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Adresse non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ address: result.rows[0] });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM "Address" WHERE "id" = $1 AND "userId" = $2`,
      [id, session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
