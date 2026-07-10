"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users,
  UserCheck,
  Store,
  Shield,
  ShieldCheck,
  UserPlus,
  Calendar,
  Activity,
  UserX,
  Search,
  ChevronDown,
  X,
  Package,
  ShoppingCart,
  TrendingUp,
  Eye,
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  Clock,
  MoreVertical,
  ArrowUpDown,
  Filter,
  Plus,
  LayoutGrid,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Shop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shops: Shop[];
  productCount: number;
  orderCount: number;
  totalSpent: number;
}

interface Stats {
  total: number;
  clients: number;
  vendors: number;
  admins: number;
  moderators: number;
  owners: number;
  today: number;
  thisMonth: number;
  active: number;
  inactive: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
}

interface ApiResponse {
  users: User[];
  stats: Stats;
  recent: RecentUser[];
}

const roleOptions = [
  { value: "ALL", label: "Tous les rôles" },
  { value: "OWNER", label: "Propriétaire" },
  { value: "ADMIN", label: "Admin" },
  { value: "MODERATOR", label: "Modérateur" },
  { value: "VENDOR", label: "Vendeur" },
  { value: "CLIENT", label: "Client" },
];

const statusOptions = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
];

const sortOptions = [
  { value: "newest", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "name", label: "Nom" },
  { value: "email", label: "Email" },
];

const roleBadgeColors: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700 border-amber-200",
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MODERATOR: "bg-orange-100 text-orange-700 border-orange-200",
  VENDOR: "bg-blue-100 text-blue-700 border-blue-200",
  CLIENT: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

const roleColors: Record<string, string> = {
  OWNER: "bg-amber-500",
  ADMIN: "bg-purple-500",
  MODERATOR: "bg-orange-500",
  VENDOR: "bg-blue-500",
  CLIENT: "bg-gray-400",
};

const roleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  MODERATOR: "Modérateur",
  VENDOR: "Vendeur",
  CLIENT: "Client",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

export default function AdminUsersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    phone: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateUser = async (userId: string, body: Record<string, unknown>) => {
    const user = data?.users.find((u) => u.id === userId);
    if (user?.role === "OWNER") {
      toast.error("Impossible de modifier le compte du propriétaire");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchUsers();
        toast.success("Mis à jour avec succès");
        setOpenDropdown(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchUsers();
        toast.success("Utilisateur supprimé");
        setDeleteConfirm(null);
        setDetailUser(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erreur lors de la création");
        return;
      }
      toast.success("Administrateur créé avec succès");
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", role: "ADMIN", phone: "" });
      fetchUsers();
    } catch {
      toast.error("Erreur");
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const stats = data?.stats;
  const users = data?.users || [];
  const recent = data?.recent || [];

  const roleCounts: Record<string, number> = {
    OWNER: stats?.owners || 0,
    ADMIN: stats?.admins || 0,
    MODERATOR: stats?.moderators || 0,
    VENDOR: stats?.vendors || 0,
    CLIENT: stats?.clients || 0,
  };
  const maxRoleCount = Math.max(...Object.values(roleCounts), 1);

  const kpiCards = [
    {
      label: "Total",
      value: stats?.total || 0,
      icon: Users,
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-700",
    },
    {
      label: "Clients",
      value: stats?.clients || 0,
      icon: UserCheck,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      label: "Vendeurs",
      value: stats?.vendors || 0,
      icon: Store,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-700",
    },
    {
      label: "Admins",
      value: stats?.admins || 0,
      icon: Shield,
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
      valueColor: "text-purple-700",
    },
    {
      label: "Modérateurs",
      value: stats?.moderators || 0,
      icon: ShieldCheck,
      bg: "bg-orange-50",
      iconColor: "text-orange-600",
      valueColor: "text-orange-700",
    },
    {
      label: "Nouveaux aujourd'hui",
      value: stats?.today || 0,
      icon: UserPlus,
      bg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      valueColor: "text-cyan-700",
    },
    {
      label: "Ce mois",
      value: stats?.thisMonth || 0,
      icon: Calendar,
      bg: "bg-pink-50",
      iconColor: "text-pink-600",
      valueColor: "text-pink-700",
    },
    {
      label: "Actifs",
      value: stats?.active || 0,
      icon: Activity,
      bg: "bg-green-50",
      iconColor: "text-green-600",
      valueColor: "text-green-700",
    },
    {
      label: "Inactifs",
      value: stats?.inactive || 0,
      icon: UserX,
      bg: "bg-red-50",
      iconColor: "text-red-600",
      valueColor: "text-red-700",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-5">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 lg:text-3xl">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {users.length} résultat{users.length !== 1 ? "s" : ""} trouvé{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm dark:shadow-gray-800/20">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "table"
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-indigo-100 text-indigo-600"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Créer admin
          </Button>
        </div>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3 lg:grid-cols-5 xl:grid-cols-9">
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              className={`${kpi.bg} rounded-2xl p-4 shadow-sm dark:shadow-gray-800/20 transition-transform hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{kpi.label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold ${kpi.valueColor}`}>
                {kpi.value.toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="w-44">
              <Select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={roleOptions}
              />
            </div>
            <div className="w-40">
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
            <div className="w-40">
              <Select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Utilisateur
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                    Téléphone
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">
                    Rôle
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">
                    Statut
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:table-cell">
                    Produits
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 xl:table-cell">
                    Commandes
                  </th>
                  <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                    Inscrit le
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || ""}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white ring-2 ring-white">
                            {getInitials(user.name, user.email)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user.name || "Sans nom"}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.phone || "—"}</span>
                    </td>
                    <td className="hidden px-6 py-4 sm:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[user.role] || ""}`}
                      >
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 sm:table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        {user.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 xl:table-cell">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.productCount}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 xl:table-cell">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.orderCount}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" ref={dropdownRef}>
                        <button
                          onClick={() => setDetailUser(user)}
                          className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                          title="Voir le profil"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {user.role !== "OWNER" && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenDropdown(openDropdown === user.id ? null : user.id)
                              }
                              className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openDropdown === user.id && (
                              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                                <div className="px-3 py-1.5">
                                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Changer le rôle
                                  </p>
                                  <div className="space-y-0.5">
                                    {["ADMIN", "MODERATOR", "VENDOR", "CLIENT"].map((r) => (
                                      <button
                                        key={r}
                                        onClick={() => updateUser(user.id, { role: r })}
                                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                          user.role === r
                                            ? "bg-indigo-50 font-medium text-indigo-700"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                      >
                                        <span
                                          className={`h-2 w-2 rounded-full ${roleColors[r]}`}
                                        />
                                        {roleLabels[r]}
                                        {user.role === r && (
                                          <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                                <button
                                  onClick={() =>
                                    updateUser(user.id, { isActive: !user.isActive })
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  {user.isActive ? (
                                    <>
                                      <Ban className="h-3.5 w-3.5 text-orange-500" />
                                      Suspendre
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                      Réactiver
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    if (!user.isActive) {
                                      updateUser(user.id, { isActive: false });
                                    }
                                    setDeleteConfirm(user.id);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {user.role === "OWNER" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Shield className="h-3 w-3" />
                            Protégé
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-16 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || ""}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white ring-2 ring-white">
                      {getInitials(user.name, user.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {user.name || "Sans nom"}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                {user.role !== "OWNER" ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === user.id ? null : user.id)
                      }
                      className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openDropdown === user.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                        <div className="px-3 py-1.5">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Changer le rôle
                          </p>
                          <div className="space-y-0.5">
                            {["ADMIN", "MODERATOR", "VENDOR", "CLIENT"].map((r) => (
                              <button
                                key={r}
                                onClick={() => updateUser(user.id, { role: r })}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                  user.role === r
                                    ? "bg-indigo-50 font-medium text-indigo-700"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${roleColors[r]}`}
                                />
                                {roleLabels[r]}
                                {user.role === r && (
                                  <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                        <button
                          onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {user.isActive ? (
                            <>
                              <Ban className="h-3.5 w-3.5 text-orange-500" />
                              Suspendre
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              Réactiver
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm(user.id);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                    <Shield className="h-3 w-3" />
                    Protégé
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[user.role] || ""}`}
                >
                  {roleLabels[user.role] || user.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    user.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full ${
                      user.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {user.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-2.5 text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.productCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Produits</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-2.5 text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.orderCount}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Commandes</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-2.5 text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(user.totalSpent)}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Dépensé</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-3">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  Inscrit le {formatDate(user.createdAt)}
                </span>
                <button
                  onClick={() => setDetailUser(user)}
                  className="text-[10px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Voir le profil →
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dernières inscriptions</h2>
          </div>
          <div className="space-y-3">
            {recent.slice(0, 8).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || ""}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                    {getInitials(user.name, user.email)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user.name || "Sans nom"}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[user.role] || ""}`}
                  >
                    {roleLabels[user.role] || user.role}
                  </span>
                  <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucune inscription récente
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
          <div className="mb-4 flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Répartition par rôle
            </h2>
          </div>
          <div className="space-y-4">
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${roleColors[role]}`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {roleLabels[role]}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${roleColors[role]} transition-all duration-500`}
                    style={{ width: `${(count / maxRoleCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailUser(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md animate-in slide-in-from-right bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex h-full w-full flex-col overflow-y-auto">
              <div className="sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700/50 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Profil utilisateur</h2>
                  <button
                    onClick={() => setDetailUser(null)}
                    className="rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-6">
                <div className="flex flex-col items-center text-center">
                  {detailUser.image ? (
                    <img
                      src={detailUser.image}
                      alt={detailUser.name || ""}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white ring-4 ring-gray-100">
                      {getInitials(detailUser.name, detailUser.email)}
                    </div>
                  )}
                  <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
                    {detailUser.name || "Sans nom"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{detailUser.email}</p>
                  {detailUser.phone && (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{detailUser.phone}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${roleBadgeColors[detailUser.role] || ""}`}
                    >
                      {roleLabels[detailUser.role] || detailUser.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        detailUser.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          detailUser.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {detailUser.isActive ? "Compte actif" : "Compte inactif"}
                    </span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-indigo-50 p-4 text-center">
                    <Package className="mx-auto h-5 w-5 text-indigo-500" />
                    <p className="mt-2 text-xl font-bold text-indigo-700">
                      {detailUser.productCount}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-indigo-600">
                      Produits
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                    <ShoppingCart className="mx-auto h-5 w-5 text-emerald-500" />
                    <p className="mt-2 text-xl font-bold text-emerald-700">
                      {detailUser.orderCount}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-emerald-600">
                      Commandes
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-center">
                    <TrendingUp className="mx-auto h-5 w-5 text-amber-500" />
                    <p className="mt-2 text-lg font-bold text-amber-700">
                      {formatCurrency(detailUser.totalSpent)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                      Dépensé
                    </p>
                  </div>
                </div>

                {detailUser.shops.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Boutiques
                    </h4>
                    <div className="space-y-2">
                      {detailUser.shops.map((shop) => (
                        <div
                          key={shop.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/50 p-3"
                        >
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {shop.name}
                            </span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              shop.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {shop.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Informations
                  </h4>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Inscrit le</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(detailUser.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 py-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Dernière mise à jour</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date(detailUser.updatedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-6">
                <div className="flex gap-3">
                  {detailUser.role !== "OWNER" && (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          updateUser(detailUser.id, { isActive: !detailUser.isActive })
                        }
                      >
                        {detailUser.isActive ? "Suspendre" : "Réactiver"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteConfirm(detailUser.id)}
                      >
                        Supprimer
                      </Button>
                    </>
                  )}
                  {detailUser.role === "OWNER" && (
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-medium text-amber-700">
                      <Shield className="h-4 w-4" />
                      Compte propriétaire protégé
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Confirmer la suppression
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est
              irréversible et toutes les données associées seront perdues.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deleteUser(deleteConfirm)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <Plus className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Créer un administrateur
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ajoutez un nouveau modérateur ou administrateur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Nom complet"
                  id="create-name"
                  placeholder="Jean Dupont"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  id="create-email"
                  placeholder="jean@example.com"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Mot de passe"
                  type="password"
                  id="create-password"
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, password: e.target.value }))
                  }
                  required
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  id="create-phone"
                  placeholder="+225 XX XX XX XX XX"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="create-role"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Rôle
                </label>
                <div className="flex gap-3">
                  {(["ADMIN", "MODERATOR"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, role: r }))}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        createForm.role === r
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 dark:border-gray-700 bg-white text-gray-600 dark:text-gray-400 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {r === "ADMIN" ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {roleLabels[r]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 gap-2" disabled={creating}>
                  {creating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
