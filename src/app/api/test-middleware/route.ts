import { NextResponse } from "next/server";
import { jwtDecrypt } from "jose";

async function deriveKey(secret: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "HKDF",
    false,
    ["deriveBits"]
  );
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: enc.encode(""),
        info: enc.encode("NextAuth Session Token"),
      },
      keyMaterial,
      256
    )
  );
}

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  let token = "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...val] = part.trim().split("=");
    if (key === "next-auth.session-token" || key === "__Secure-next-auth.session-token") {
      token = val.join("=");
      break;
    }
  }

  if (!token) {
    return NextResponse.json({ error: "No token" });
  }

  const secret = process.env.NEXTAUTH_SECRET!;
  const results: Record<string, any> = { tokenLength: token.length };

  try {
    const key = await deriveKey(secret);
    results.keyLength = key.length;
    const { payload } = await jwtDecrypt(token, key);
    results.jwtDecrypt = { success: true, role: payload.role, email: payload.email };
  } catch (e: any) {
    results.jwtDecrypt = { success: false, error: e.message };
  }

  return NextResponse.json(results);
}
