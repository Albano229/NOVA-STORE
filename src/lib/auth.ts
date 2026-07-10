import { NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getAuthPool } from "@/lib/auth-pool";

async function findUserByEmail(email: string) {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT id, name, email, password, image, role, "isActive" FROM "User" WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findUserById(id: string) {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT id, name, email, role FROM "User" WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        try {
          console.log("[AUTH] Looking up user:", credentials.email);
          const user = await findUserByEmail(credentials.email);
          console.log("[AUTH] User found:", !!user, user?.email, user?.role);

          if (!user || !user.password) {
            console.error("[AUTH] User not found:", credentials.email);
            throw new Error("Email ou mot de passe incorrect");
          }

          if (!user.isActive) {
            console.error("[AUTH] User inactive:", credentials.email);
            throw new Error("Compte désactivé");
          }

          console.log("[AUTH] Comparing password...");
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          console.log("[AUTH] Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.error("[AUTH] Password mismatch:", credentials.email);
            throw new Error("Email ou mot de passe incorrect");
          }

          console.log("[AUTH] Auth success for:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role as "OWNER" | "ADMIN" | "MODERATOR" | "VENDOR" | "CLIENT",
          };
        } catch (error: any) {
          console.error("[AUTH] Error:", error.message, error.stack);
          if (error.message?.includes("mot de passe") || error.message?.includes("désactivé") || error.message?.includes("requis")) {
            throw error;
          }
          throw new Error("Erreur de connexion au serveur");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const parsedUrl = new URL(url, baseUrl);
        if (parsedUrl.pathname === "/" || parsedUrl.pathname === "") {
          return `${baseUrl}/stores`;
        }
      } catch {}
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/stores`;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await findUserByEmail(user.email!);

          if (!existingUser) {
            const pool = getAuthPool();
            const result = await pool.query(
              `INSERT INTO "User" (id, email, name, image, role, "isActive", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, 'CLIENT', true, NOW(), NOW())
               RETURNING id, role`,
              [user.email!, user.name, user.image]
            );
            const newUser = result.rows[0];
            user.id = newUser.id;
            (user as any).role = newUser.role;
          } else {
            user.id = existingUser.id;
            (user as any).role = existingUser.role;
          }
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
