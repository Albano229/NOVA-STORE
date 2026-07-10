"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Percent, Plus, Trash2, Save, Loader2, Globe } from "lucide-react";

interface TaxRule {
  id: string;
  name: string;
  country: string;
  rate: number;
  active: boolean;
}

export default function AdminTaxesPage() {
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [formName, setFormName] = useState("");
  const [formCountry, setFormCountry] = useState("");
  const [formRate, setFormRate] = useState(0);

  useEffect(() => {
    fetch("/api/admin/taxes")
      .then((r) => r.json())
      .then((data) => {
        setTaxRules(data.taxRules || []);
        setDefaultTaxRate(data.defaultTaxRate || 0);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erreur lors du chargement");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/taxes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxRules, defaultTaxRate }),
      });
      if (res.ok) {
        toast.success("Paramètres fiscaux sauvegardés");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSaving(false);
  };

  const handleAddRule = () => {
    if (!formName || !formCountry || formRate <= 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const newRule: TaxRule = {
      id: `tax_${Date.now()}`,
      name: formName,
      country: formCountry,
      rate: formRate,
      active: true,
    };
    setTaxRules([...taxRules, newRule]);
    setShowForm(false);
    setFormName("");
    setFormCountry("");
    setFormRate(0);
  };

  const handleEditRule = (rule: TaxRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormCountry(rule.country);
    setFormRate(rule.rate);
    setShowForm(true);
  };

  const handleUpdateRule = () => {
    if (!editingRule) return;
    setTaxRules(
      taxRules.map((r) =>
        r.id === editingRule.id ? { ...r, name: formName, country: formCountry, rate: formRate } : r
      )
    );
    setShowForm(false);
    setEditingRule(null);
    setFormName("");
    setFormCountry("");
    setFormRate(0);
  };

  const handleDeleteRule = (id: string) => {
    setTaxRules(taxRules.filter((r) => r.id !== id));
  };

  const toggleRuleActive = (id: string) => {
    setTaxRules(
      taxRules.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Gestion des taxes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez les règles fiscales de la plateforme
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="rounded-lg bg-amber-100 p-2">
            <Percent className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-[#0f172a]">Taux par défaut</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Taux applicable pour les pays sans règle spécifique
        </p>
        <div className="max-w-xs">
          <Input
            label="Taux par défaut (%)"
            id="defaultTaxRate"
            type="number"
            value={String(defaultTaxRate)}
            onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
            min="0"
            max="100"
            step="0.1"
          />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Globe className="h-5 w-5 text-[#7126b6]" />
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Règles par pays</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingRule(null);
              setFormName("");
              setFormCountry("");
              setFormRate(0);
              setShowForm(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 rounded-xl border border-[#7126b6]/30 bg-[#7126b6]/5 p-4">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">
              {editingRule ? "Modifier la règle" : "Nouvelle règle"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Nom"
                id="ruleName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="TVA France"
              />
              <Input
                label="Pays / Région"
                id="ruleCountry"
                value={formCountry}
                onChange={(e) => setFormCountry(e.target.value)}
                placeholder="FR, CI, SN..."
              />
              <Input
                label="Taux (%)"
                id="ruleRate"
                type="number"
                value={String(formRate)}
                onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={editingRule ? handleUpdateRule : handleAddRule}
              >
                {editingRule ? "Mettre à jour" : "Ajouter"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {taxRules.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Aucune règle fiscale configurée. Le taux par défaut sera utilisé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nom
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Pays / Région
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Taux
                  </th>
                  <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {taxRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50/50">
                    <td className="py-3 text-sm font-medium text-[#0f172a]">{rule.name}</td>
                    <td className="py-3 text-sm text-gray-600">{rule.country}</td>
                    <td className="py-3 text-sm font-semibold text-[#0f172a]">{rule.rate}%</td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleRuleActive(rule.id)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          rule.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rule.active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="rounded-lg px-2 py-1 text-xs text-[#7126b6] hover:bg-[#7126b6]/10"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
