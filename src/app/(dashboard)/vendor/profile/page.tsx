"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

export default function VendorProfile() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (res.ok) {
        toast.success("Profil sauvegardé");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Profil</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gérez vos informations personnelles</p>

      <div className="mt-6 max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8ff] text-xl font-bold text-[#7126b6]">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-[#0f172a]">{name || "Vendeur"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            value={email}
            disabled
          />
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+229 52 00 00 00"
          />
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </div>
  );
}
