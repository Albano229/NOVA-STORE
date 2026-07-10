"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Package,
  Store,
  ShoppingCart,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface ModStats {
  pendingProducts: number;
  reportedStores: number;
  reportedOrders: number;
  reportedUsers: number;
  fraudAlerts: number;
}

export default function ModeratorDashboard() {
  const [stats, setStats] = useState<ModStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/moderator/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const queueCards = [
    { label: "Produits en attente", value: stats?.pendingProducts || 0, icon: Package, color: "bg-amber-100 text-amber-600", href: "/moderator/products" },
    { label: "Boutiques signalées", value: stats?.reportedStores || 0, icon: Store, color: "bg-red-100 text-red-600", href: "/moderator/stores" },
    { label: "Commandes signalées", value: stats?.reportedOrders || 0, icon: ShoppingCart, color: "bg-orange-100 text-orange-600", href: "/moderator/orders" },
    { label: "Utilisateurs signalés", value: stats?.reportedUsers || 0, icon: Users, color: "bg-purple-100 text-purple-600", href: "/moderator/users" },
    { label: "Alertes fraude", value: stats?.fraudAlerts || 0, icon: AlertTriangle, color: "bg-rose-100 text-rose-600", href: "/moderator/fraud" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Modération</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">File d&apos;attente et contrôles qualité</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {queueCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</span>
                <div className={`rounded-xl p-2.5 ${card.color.split(" ")[0]}`}>
                  <card.icon className={`h-5 w-5 ${card.color.split(" ")[1]}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{card.value}</p>
              {card.value > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Clock className="h-3 w-3" />
                  En attente
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0f172a]">Actions rapides</h2>
          </div>
          <div className="space-y-3">
            <Link href="/moderator/products" className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-[#0f172a]">Valider les produits</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Approuver ou refuser les nouveaux produits</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
            <Link href="/moderator/stores" className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Store className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-[#0f172a]">Examiner les boutiques</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vérifier les boutiques signalées</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
            <Link href="/moderator/fraud" className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-[#0f172a]">Alertes fraude</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Analyser les paiements suspects</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 text-gray-400 dark:text-gray-500" />
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Rôle du modérateur</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              <span>Approuver ou refuser les produits</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              <span>Examiner les boutiques signalées</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              <span>Analyser les commandes suspectes</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
              <span>Modifier les paiements (lecture seule)</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
              <span>Modifier les paramètres plateforme</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
              <span>Supprimer des comptes utilisateurs</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
