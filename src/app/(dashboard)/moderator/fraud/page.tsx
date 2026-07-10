"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, Shield, Eye, DollarSign } from "lucide-react";

export default function ModeratorFraudPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Alertes fraude</h1>
      <p className="mt-1 text-sm text-gray-500">Surveillance des paiements et activités suspectes</p>

      <div className="mt-8">
        <Card className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">Aucune alerte fraude</h3>
          <p className="mt-2 text-sm text-gray-500">Le système de surveillance automatique ne détecte aucune activité suspecte pour le moment.</p>
          <div className="mt-6 grid max-w-md mx-auto grid-cols-2 gap-4 text-left">
            <div className="rounded-lg border border-gray-200 p-3">
              <Eye className="h-4 w-4 text-blue-500" />
              <p className="mt-1 text-xs font-medium text-[#0f172a]">Surveillance 24/7</p>
              <p className="text-[10px] text-gray-500">Analyse automatique</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <DollarSign className="h-4 w-4 text-green-500" />
              <p className="mt-1 text-xs font-medium text-[#0f172a]">Paiements sécurisés</p>
              <p className="text-[10px] text-gray-500">Stripe + PayPal</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
