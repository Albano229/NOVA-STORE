"use client";

import { useEffect, useState } from "react";
import { DollarSign, CreditCard, ArrowUpRight, Wallet, Percent, TrendingUp, ArrowDownRight, Clock, Filter } from "lucide-react";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface ShopBalance {
  totalEarned: number;
  totalPaid: number;
  pendingPayout: number;
  availableBalance: number;
}

interface Payout {
  id: string;
  amount: number;
  commission: number;
  method: string;
  status: string;
  createdAt: string;
  shop: { name: string };
  orderNumber?: string;
}

interface Transaction {
  type: "SALE" | "PAYOUT";
  id: string;
  reference: string;
  amount: number;
  commission: number;
  netAmount: number;
  method: string;
  status: string;
  customer: string | null;
  createdAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VendorPayoutsPage() {
  const [balance, setBalance] = useState<ShopBalance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("BANK_TRANSFER");
  const [submitting, setSubmitting] = useState(false);
  const [txFilter, setTxFilter] = useState("ALL");

  useEffect(() => {
    Promise.all([
      fetch("/api/vendor/balance").then((r) => r.json()),
      fetch("/api/vendor/payouts").then((r) => r.json()),
      fetch("/api/vendor/transactions").then((r) => r.json()),
    ])
      .then(([b, p, t]) => {
        if (!b.error) setBalance(b);
        if (Array.isArray(p)) setPayouts(p);
        if (t.transactions) setTransactions(t.transactions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
        }),
      });
      if (res.ok) {
        toast.success("Demande de retrait soumise");
        setShowWithdraw(false);
        setWithdrawAmount("");
        const p = await fetch("/api/vendor/payouts").then((r) => r.json());
        setPayouts(p);
        const b = await fetch("/api/vendor/balance").then((r) => r.json());
        setBalance(b);
        const t = await fetch("/api/vendor/transactions").then((r) => r.json());
        if (t.transactions) setTransactions(t.transactions);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  const totalCommission = balance ? balance.totalEarned * 0.05 : 0;
  const filteredTransactions = txFilter === "ALL" ? transactions : transactions.filter((t) => t.type === txFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Revenus & Portefeuille</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Suivez vos revenus, transactions et gérez vos retraits
          </p>
        </div>
      </div>

      {balance && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-8 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-sm font-medium text-indigo-100">Solde disponible</p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {formatPrice(balance.availableBalance)}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => setShowWithdraw(true)}
                className="bg-white text-indigo-700 hover:bg-indigo-50"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Retirer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWithdraw && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#0f172a]">Nouveau retrait</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Montant (FCFA)"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="0"
              placeholder="0"
            />
            <Select
              label="Méthode"
              id="withdraw-method"
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              options={[
                { value: "BANK_TRANSFER", label: "Virement bancaire" },
                { value: "MOBILE_MONEY", label: "Mobile Money" },
              ]}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleWithdraw} disabled={submitting}>
              {submitting ? "En cours..." : "Confirmer"}
            </Button>
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {balance && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={DollarSign} label="Revenus totaux" value={formatPrice(balance.totalEarned)} color="text-emerald-600" />
          <StatCard icon={Percent} label="Commission (5%)" value={formatPrice(totalCommission)} color="text-orange-600" />
          <StatCard icon={TrendingUp} label="Disponible" value={formatPrice(balance.availableBalance)} color="text-green-600" />
          <StatCard icon={ArrowUpRight} label="Déjà retiré" value={formatPrice(balance.totalPaid)} color="text-blue-600" />
        </div>
      )}

      {/* Transaction History */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white">Historique des transactions</h2>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">Toutes</option>
              <option value="SALE">Ventes</option>
              <option value="PAYOUT">Retraits</option>
            </select>
          </div>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">Aucune transaction</p>
            <p className="mt-1 text-xs text-gray-400">
              Vos transactions apparaîtront ici après vos premières ventes
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700/50 dark:bg-gray-800/30 dark:text-gray-400">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Référence</th>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Méthode</th>
                    <th className="px-6 py-3 text-right">Montant</th>
                    <th className="px-6 py-3 text-right">Commission</th>
                    <th className="px-6 py-3 text-right">Net</th>
                    <th className="px-6 py-3 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredTransactions.map((tx) => (
                    <tr key={`${tx.type}-${tx.id}`} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === "SALE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {tx.type === "SALE" ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {tx.type === "SALE" ? "Vente" : "Retrait"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#0f172a]">
                        {tx.reference}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {tx.customer || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {tx.method}
                      </td>
                      <td className="px-6 py-4 text-right text-[#0f172a]">
                        {formatPrice(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {tx.commission > 0 ? `−${formatPrice(tx.commission)}` : "—"}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.netAmount >= 0 ? "+" : ""}{formatPrice(Math.abs(tx.netAmount))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge
                          variant={
                            tx.status === "COMPLETED" || tx.status === "DELIVERED"
                              ? "success"
                              : tx.status === "CANCELLED" || tx.status === "FAILED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 px-4 py-4 lg:hidden">
              {filteredTransactions.map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === "SALE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {tx.type === "SALE" ? <TrendingUp className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {tx.type === "SALE" ? "Vente" : "Retrait"}
                        </span>
                        <Badge
                          variant={
                            tx.status === "COMPLETED" || tx.status === "DELIVERED"
                              ? "success"
                              : tx.status === "CANCELLED" || tx.status === "FAILED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {getStatusLabel(tx.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium text-[#0f172a] dark:text-white">
                        {tx.reference}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatDate(tx.createdAt)}</span>
                        {tx.customer && <span>{tx.customer}</span>}
                        <span>{tx.method}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0f172a] dark:text-white">{formatPrice(tx.amount)}</p>
                      {tx.commission > 0 && (
                        <p className="text-xs text-gray-500">−{formatPrice(tx.commission)}</p>
                      )}
                      <p className={`mt-0.5 text-xs font-bold ${tx.netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.netAmount >= 0 ? "+" : ""}{formatPrice(Math.abs(tx.netAmount))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
