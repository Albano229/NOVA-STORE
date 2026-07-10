import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecrypt } from "jose";

const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/auth/callback", "/auth/verify", "/cart", "/checkout"];
const PUBLIC_API_ROUTES = ["/api/auth", "/api/products", "/api/categories", "/api/upload", "/api/shops", "/api/ai", "/api/support", "/api/notifications", "/api/user", "/api/push"];
const PUBLIC_STATIC = ["/_next", "/favicon", "/logo", "/public"];

async function deriveKey(secret: string, salt = ""): Promise<Uint8Array> {
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
        salt: enc.encode(salt),
        info: enc.encode(`NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`),
      },
      keyMaterial,
      256
    )
  );
}

async function getUserFromToken(token: string): Promise<{ role: string } | null> {
  try {
    const key = await deriveKey(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtDecrypt(token, key);
    return { role: payload.role as string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_STATIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (PUBLIC_API_ROUTES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("next-auth.session-token")?.value
    || request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const user = await getUserFromToken(token);

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { role } = user;

  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "OWNER" && role !== "MODERATOR") {
    return NextResponse.redirect(new URL("/stores", request.url));
  }

  if (pathname.startsWith("/moderator") && role !== "ADMIN" && role !== "MODERATOR") {
    return NextResponse.redirect(new URL("/stores", request.url));
  }

  if (pathname.startsWith("/vendor") && role !== "VENDOR" && role !== "ADMIN" && role !== "MODERATOR" && role !== "OWNER") {
    return NextResponse.redirect(new URL("/stores", request.url));
  }

  if (pathname === "/stores") {
    if (role === "OWNER" || role === "ADMIN" || role === "MODERATOR") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/stores/admin")) {
    if (role !== "OWNER" && role !== "ADMIN" && role !== "MODERATOR") {
      return NextResponse.redirect(new URL("/stores", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/moderator/:path*",
    "/vendor/:path*",
    "/stores",
    "/stores/:path*",
    "/profile",
    "/account/:path*",
    "/api/admin/:path*",
    "/api/moderator/:path*",
    "/api/vendor/:path*",
    "/api/user/:path*",
    "/api/support/:path*",
    "/api/ai/:path*",
    "/api/notifications/:path*",
  ],
};
