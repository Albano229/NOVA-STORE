"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Search, Shield, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function ModeratorUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/moderator/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = (Array.isArray(users) ? users : []).filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    MODERATOR: "bg-amber-100 text-amber-700",
    VENDOR: "bg-blue-100 text-blue-700",
    CLIENT: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Utilisateurs</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Consultation seule — signalez les comptes suspects à l&apos;admin</p>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input id="search" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#0f172a]">{user.name || "Sans nom"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[user.role] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                {user.role}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {user.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
