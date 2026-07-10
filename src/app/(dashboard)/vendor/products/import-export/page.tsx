"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileUp,
  FileDown,
  Check,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface ImportResult {
  created: number;
  skipped: number;
  total: number;
  errors: string[];
}

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/vendor/products/export");
      if (!res.ok) throw new Error("Erreur export");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produits.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé !");
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Veuillez sélectionner un fichier CSV");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/vendor/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created} produit(s) importé(s) !`);
      }
      if (data.skipped > 0) {
        toast(`${data.skipped} ligne(s) ignorée(s)`, { icon: "⚠️" });
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImport(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Import / Export CSV
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Importez ou exportez vos produits en format CSV
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/20">
              <FileDown className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exporter
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Télécharger vos produits
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Génère un fichier CSV contenant tous vos produits avec leurs informations (nom, prix, stock, catégorie, etc.)
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Export en cours..." : "Télécharger CSV"}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <FileUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Importer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajouter des produits en masse
              </p>
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {importing ? "Import en cours..." : "Glissez un CSV ici ou cliquez"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Formats acceptés : .csv
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
            }}
          />
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Résultat de l&apos;import
            </h3>
            <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{result.created}</p>
              <p className="text-xs text-green-600/70">Créés</p>
            </div>
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
              <p className="text-xs text-yellow-600/70">Ignorés</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-center">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{result.total}</p>
              <p className="text-xs text-gray-500">Total lignes</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Erreurs</p>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-400">
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.created > 0 && (
            <div className="flex items-center gap-2 mt-4 text-green-600">
              <Check className="h-4 w-4" />
              <p className="text-sm">Import terminé avec succès !</p>
            </div>
          )}
        </div>
      )}

      {/* CSV Template */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Format CSV attendu
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Le fichier CSV doit contenir ces colonnes (les noms de colonnes en français sont acceptés) :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Colonne</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obligatoire</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exemple</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {[
                { name: "name / nom", required: true, example: "T-shirt NOVA" },
                { name: "price / prix", required: true, example: "15000" },
                { name: "description", required: false, example: "T-shirt 100% coton" },
                { name: "stock / quantité", required: false, example: "50" },
                { name: "category / catégorie", required: false, example: "Vêtements" },
                { name: "sku / référence", required: false, example: "TS-001" },
                { name: "brand / marque", required: false, example: "NOVA" },
                { name: "isActive / actif", required: false, example: "oui / non" },
              ].map((col) => (
                <tr key={col.name}>
                  <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{col.name}</td>
                  <td className="px-3 py-2">
                    {col.required ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Oui</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500">Non</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => {
            const headers = "name,description,price,stock,category,sku,brand,isActive";
            const example = 'T-shirt NOVA,"T-shirt 100% coton",15000,50,Vêtements,TS-001,NOVA,oui';
            const csv = `${headers}\n${example}`;
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "template-produits.csv";
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Template téléchargé !");
          }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4" />
          Télécharger le template
        </button>
      </div>
    </div>
  );
}
