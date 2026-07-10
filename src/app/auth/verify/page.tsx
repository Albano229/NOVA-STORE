"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteLogo } from "@/components/ui/site-logo";
import { ArrowLeft, Mail, KeyRound, Loader2, Sun, Moon } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTheme } from "@/contexts/theme-context";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const redirectTo = searchParams.get("redirect") || "/account/purchases";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      toast.success("Code envoyé à " + email);
      setStep("code");
    } catch (err: any) {
      toast.error(err.message || "Impossible d'envoyer le code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Code invalide");
      }

      toast.success("Connexion réussie !");
      window.location.href = redirectTo;
    } catch (err: any) {
      toast.error(err.message || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          title="Changer de thème"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
      <div className="mb-8 flex justify-center">
        <SiteLogo size="lg" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#7126b6] dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Retrouvez vos achats</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Entrez votre e-mail pour recevoir un code de connexion.
        </p>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#7126b6] focus:ring-2 focus:ring-[#7126b6]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7126b6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5e1f99] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Envoyer le code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Un code à 6 chiffres a été envoyé à <span className="font-medium text-gray-900 dark:text-gray-100">{email}</span>
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Code de vérification</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-center text-lg font-mono tracking-[0.5em] outline-none transition-colors focus:border-[#7126b6] focus:ring-2 focus:ring-[#7126b6]/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7126b6] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5e1f99] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Vérifier et se connecter
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="w-full text-center text-sm text-gray-500 hover:text-[#7126b6] dark:text-gray-400"
            >
              Changer d&apos;adresse e-mail
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
