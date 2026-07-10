"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Link2, Copy, Check, Users, Gift, Clock, Share2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ReferralStats {
  stats: {
    confirmed: string;
    pending: string;
    total_earned: string;
    total_referrals: string;
  };
  config: {
    rewardAmount: number;
    rewardType: string;
    minPurchaseAmount: number;
  } | null;
  referrals: Array<{
    id: string;
    status: string;
    rewardAmount: number;
    rewardGivenAt: string | null;
    createdAt: string;
    name: string;
    email: string;
  }>;
}

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReferralStats | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/referral/my-code").then((r) => r.json()),
      fetch("/api/referral/stats").then((r) => r.json()),
    ]).then(([codeRes, statsRes]) => {
      if (codeRes.code) setCode(codeRes.code);
      if (statsRes.stats) setData(statsRes);
    }).finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Rejoins NOVA STORE avec mon code de parrainage ${code} et bénéficie d'un avantage ! 🛍️\nhttps://nova-store-ashy.vercel.app/auth/register?ref=${code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareLink = () => {
    const url = `https://nova-store-ashy.vercel.app/auth/register?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié !");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  const stats = data?.stats;
  const config = data?.config;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mon lien de parrainage</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Partagez votre code et gagnez des récompenses
        </p>
      </div>

      {/* Code Card */}
      <div className="rounded-2xl border border-[#7126b6]/20 bg-gradient-to-br from-[#7126b6]/5 to-purple-50 p-6 dark:from-[#7126b6]/10 dark:to-purple-900/20">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#7126b6]">Votre code</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-xl bg-white px-5 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-[#7126b6] shadow-sm dark:bg-gray-800">
            {code}
          </div>
          <button
            onClick={copyCode}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7126b6] text-white shadow-lg transition-all hover:bg-[#5a1f94]"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={shareWhatsApp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-green-600"
          >
            <Share2 className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={shareLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
          >
            <Link2 className="h-4 w-4" />
            Copier le lien
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Parrainés" value={stats?.total_referrals || "0"} color="text-blue-500" />
        <StatCard icon={Check} label="Confirmés" value={stats?.confirmed || "0"} color="text-emerald-500" />
        <StatCard icon={Clock} label="En attente" value={stats?.pending || "0"} color="text-amber-500" />
        <StatCard icon={Gift} label="Gagné" value={`${Number(stats?.total_earned || 0).toLocaleString()} F`} color="text-[#7126b6]" />
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Comment ça marche ?</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Partagez votre code de parrainage avec vos amis" },
            { step: "2", text: "Ils s'inscrivent en utilisant votre code" },
            { step: "3", text: `Vous recevez ${config?.rewardAmount?.toLocaleString() || "500"} F de crédit pour chaque parrainage confirmé` },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7126b6]/10 text-xs font-bold text-[#7126b6]">
                {step}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      <div>
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Mes parrainages</h3>
        {data?.referrals && data.referrals.length > 0 ? (
          <div className="space-y-2">
            {data.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.name || r.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                    r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {r.status === "CONFIRMED" ? "Confirmé" : r.status === "PENDING" ? "En attente" : r.status}
                  </span>
                  {r.status === "CONFIRMED" && (
                    <span className="text-sm font-semibold text-[#7126b6]">+{r.rewardAmount.toLocaleString()} F</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800/50">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun parrainage pour l&apos;instant</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Partagez votre code pour commencer !</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
      <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
