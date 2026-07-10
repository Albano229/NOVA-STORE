"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  Mail,
  MailCheck,
  ShoppingCartIcon,
  BellRing,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";

interface Automation {
  id: string;
  key: string;
  title: string;
  description: string;
  enabled: boolean;
}

const defaultAutomations: Omit<Automation, "id">[] = [
  {
    key: "email_confirmation",
    title: "Email de confirmation",
    description: "Envoyer automatiquement un email de confirmation au client après chaque commande.",
    enabled: true,
  },
  {
    key: "abandoned_cart",
    title: "Relance panier abandonné",
    description: "Envoyer un email de relance 24h après qu'un client ait abandonné son panier.",
    enabled: false,
  },
  {
    key: "new_order_notification",
    title: "Notification nouvelle commande",
    description: "Recevoir une notification push et par email dès qu'une nouvelle commande est passée.",
    enabled: true,
  },
  {
    key: "weekly_report",
    title: "Rapport hebdomadaire",
    description: "Recevoir un résumé chaque semaine avec les ventes, revenus et statistiques de votre boutique.",
    enabled: false,
  },
];

const automationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  email_confirmation: MailCheck,
  abandoned_cart: ShoppingCartIcon,
  new_order_notification: BellRing,
  weekly_report: FileSpreadsheet,
};

const automationColors: Record<string, { bg: string; text: string; icon: string }> = {
  email_confirmation: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  abandoned_cart: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  new_order_notification: { bg: "bg-green-50", text: "text-green-600", icon: "text-green-500" },
  weekly_report: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
};

export default function AutomatisationPage() {
  const { data: session } = useSession();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/automations")
      .then((res) => res.json())
      .then((data) => {
        const saved = Array.isArray(data) ? data : [];
        const merged = defaultAutomations.map((def) => {
          const found = saved.find((s: Automation) => s.key === def.key);
          return {
            ...def,
            id: found?.id || def.key,
            enabled: found?.enabled ?? def.enabled,
          };
        });
        setAutomations(merged);
      })
      .catch(() => {
        setAutomations(
          defaultAutomations.map((def, i) => ({ ...def, id: `default-${i}` }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleAutomation = (key: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automations }),
      });
      if (res.ok) {
        toast.success("Automatisations sauvegardées !");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Automatisations</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurez les actions automatiques pour gagner du temps
        </p>
      </div>

      <div className="space-y-4">
        {automations.map((automation) => {
          const Icon = automationIcons[automation.key] || Mail;
          const colors = automationColors[automation.key] || {
            bg: "bg-gray-50 dark:bg-gray-800/50",
            text: "text-gray-600 dark:text-gray-400",
            icon: "text-gray-500 dark:text-gray-400",
          };

          return (
            <div
              key={automation.key}
              className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20 transition-all hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg}`}>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{automation.title}</h3>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {automation.description}
                </p>
              </div>

              <button
                onClick={() => toggleAutomation(automation.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  automation.enabled ? "bg-indigo-600" : "bg-gray-200"
                }`}
                role="switch"
                aria-checked={automation.enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-800 shadow ring-0 transition duration-200 ease-in-out ${
                    automation.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
