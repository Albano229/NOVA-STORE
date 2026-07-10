"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Crown,
  Shield,
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  X,
  CheckCircle,
  XCircle,
  MoreVertical,
  Trash2,
  Ban,
  Loader2,
  Plus,
  Lock,
  UserCog,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EligibleUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface TeamStats {
  totalAdmins: number;
  totalModerators: number;
  totalOwners: number;
  activeStaff: number;
  inactiveStaff: number;
}

interface RolePermissions {
  [key: string]: {
    permissions: string[];
  };
}

interface TeamData {
  members: TeamMember[];
  stats: TeamStats;
  roles: RolePermissions;
}

const roleBadgeColors: Record<string, string> = {
  OWNER: "bg-amber-100 text-amber-700 border-amber-200",
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MODERATOR: "bg-orange-100 text-orange-700 border-orange-200",
  VENDOR: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CLIENT: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

const roleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  VENDOR: "Vendeur",
  CLIENT: "Client",
};

const roleIcons: Record<string, React.ElementType> = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: ShieldCheck,
  VENDOR: UserPlus,
  CLIENT: Users,
};

const roleBgColors: Record<string, string> = {
  OWNER: "bg-amber-500",
  ADMIN: "bg-purple-500",
  MODERATOR: "bg-orange-500",
  VENDOR: "bg-indigo-500",
  CLIENT: "bg-gray-400",
};

const assignableRoles = [
  { value: "ADMIN", label: "Administrateur", desc: "Accès complet sauf suppression", color: "purple" },
  { value: "MODERATOR", label: "Modérateur", desc: "Gestion produits & commandes", color: "orange" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return email[0].toUpperCase();
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<EligibleUser | null>(null);
  const [assignRole, setAssignRole] = useState("ADMIN");
  const [assigning, setAssigning] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN" as "ADMIN" | "MODERATOR",
  });

  const fetchTeam = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/team?${params.toString()}`);
      const json: TeamData = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return document.removeEventListener("mousedown", handler);
  }, []);

  const fetchEligibleUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userRoleFilter !== "ALL") params.set("role", userRoleFilter);

      const res = await fetch(`/api/admin/team/users?${params.toString()}`);
      const json = await res.json();
      setEligibleUsers(json.users || []);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoadingUsers(false);
    }
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    if (showAssignModal) {
      fetchEligibleUsers();
    }
  }, [showAssignModal, fetchEligibleUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erreur lors de la création");
        return;
      }
      toast.success("Membre créé avec succès");
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", phone: "", password: "", role: "ADMIN" });
      fetchTeam();
    } catch {
      toast.error("Erreur");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, role: assignRole }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Erreur lors de l'assignation");
        return;
      }
      toast.success(`${selectedUser.name || selectedUser.email} est maintenant ${roleLabels[assignRole]}`);
      setShowAssignModal(false);
      setShowRoleConfirm(false);
      setSelectedUser(null);
      setAssignRole("ADMIN");
      setUserSearch("");
      fetchTeam();
    } catch {
      toast.error("Erreur");
    } finally {
      setAssigning(false);
    }
  };

  const updateMember = async (userId: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...body }),
      });
      if (res.ok) {
        await fetchTeam();
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

  const deleteMember = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/team?userId=${deleteConfirm.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTeam();
        toast.success("Membre supprimé");
        setDeleteConfirm(null);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setDeleting(false);
    }
  };

  const filteredMembers = (data?.members || []).filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q)
    );
  });

  const filteredEligible = eligibleUsers.filter((u) => {
    const isAlreadyTeam = ["OWNER", "ADMIN", "MODERATOR"].includes(u.role);
    return !isAlreadyTeam;
  });

  const stats = data?.stats;
  const roles = data?.roles;

  const roleFilterOptions = [
    { value: "ALL", label: "Tous les rôles" },
    { value: "OWNER", label: "Propriétaire" },
    { value: "ADMIN", label: "Administrateur" },
    { value: "MODERATOR", label: "Modérateur" },
  ];

  const userRoleFilterOptions = [
    { value: "ALL", label: "Tous les rôles" },
    { value: "CLIENT", label: "Clients" },
    { value: "VENDOR", label: "Vendeurs" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 lg:text-3xl">
            Équipe & Rôles
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les membres de votre équipe et leurs permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAssignModal(true)}
            variant="outline"
            className="gap-2"
          >
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Assigner un rôle</span>
            <span className="sm:hidden">Assigner</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Créer un membre</span>
            <span className="sm:hidden">Créer</span>
          </Button>
        </div>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Staff</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalOwners + stats.totalAdmins + stats.totalModerators}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Crown className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Propriétaires</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700">{stats.totalOwners}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Admins</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-purple-700">{stats.totalAdmins}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Modérateurs</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-orange-700">{stats.totalModerators}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Actifs / Inactifs</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
              <span className="text-green-600">{stats.activeStaff}</span>
              <span className="mx-1 text-gray-400 dark:text-gray-500">/</span>
              <span className="text-red-500">{stats.inactiveStaff}</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
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
          <div className="w-48">
            <Select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={roleFilterOptions}
            />
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Membre
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                  Téléphone
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">
                  Rôle
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell">
                  Statut
                </th>
                <th className="hidden px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 lg:table-cell">
                  Inscrit le
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name || ""}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white ${roleBgColors[member.role] || "bg-gray-400"}`}
                        >
                          {getInitials(member.name, member.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {member.name || "Sans nom"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-6 py-4 md:table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{member.phone || "—"}</span>
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeColors[member.role] || ""}`}
                    >
                      {roleLabels[member.role] || member.role}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 sm:table-cell">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          member.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {member.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 lg:table-cell">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(member.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2" ref={dropdownRef}>
                      {member.role === "OWNER" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Lock className="h-3 w-3" />
                          Non modifiable
                        </span>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === member.id ? null : member.id)
                            }
                            className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdown === member.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                              <div className="px-3 py-1.5">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                  Changer le rôle
                                </p>
                                <div className="space-y-0.5">
                                  {["ADMIN", "MODERATOR"].map((r) => (
                                    <button
                                      key={r}
                                      onClick={() => updateMember(member.id, { role: r })}
                                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                        member.role === r
                                          ? "bg-indigo-50 font-medium text-indigo-700"
                                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                      }`}
                                    >
                                      <span
                                        className={`h-2 w-2 rounded-full ${roleBgColors[r]}`}
                                      />
                                      {roleLabels[r]}
                                      {member.role === r && (
                                        <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                              <button
                                onClick={() =>
                                  updateMember(member.id, { isActive: !member.isActive })
                                }
                                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                {member.isActive ? (
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
                                  setDeleteConfirm(member);
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              Aucun membre trouvé
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {search ? "Essayez de modifier votre recherche" : "Ajoutez un membre à votre équipe"}
            </p>
          </div>
        )}
      </div>

      <div className="mb-6 md:hidden">
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name || ""}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-white ${roleBgColors[member.role] || "bg-gray-400"}`}
                    >
                      {getInitials(member.name, member.email)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {member.name || "Sans nom"}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                    {member.phone && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{member.phone}</p>
                    )}
                  </div>
                </div>
                {member.role !== "OWNER" && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === member.id ? null : member.id)
                      }
                      className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openDropdown === member.id && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                        <div className="px-3 py-1.5">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Changer le rôle
                          </p>
                          <div className="space-y-0.5">
                            {["ADMIN", "MODERATOR"].map((r) => (
                              <button
                                key={r}
                                onClick={() => updateMember(member.id, { role: r })}
                                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                                  member.role === r
                                    ? "bg-indigo-50 font-medium text-indigo-700"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${roleBgColors[r]}`}
                                />
                                {roleLabels[r]}
                                {member.role === r && (
                                  <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                        <button
                          onClick={() =>
                            updateMember(member.id, { isActive: !member.isActive })
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {member.isActive ? (
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
                            setDeleteConfirm(member);
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
                {member.role === "OWNER" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                    <Lock className="h-3 w-3" />
                    Protégé
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[member.role] || ""}`}
                >
                  {roleLabels[member.role] || member.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    member.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full ${
                      member.isActive ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {member.isActive ? "Actif" : "Inactif"}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatDate(member.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {roles && (
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">Permissions par rôle</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["OWNER", "ADMIN", "MODERATOR"] as const).map((roleKey) => {
              const RoleIcon = roleIcons[roleKey];
              const isOwner = roleKey === "OWNER";
              const isAdmin = roleKey === "ADMIN";
              const isModerator = roleKey === "MODERATOR";

              return (
                <div
                  key={roleKey}
                  className={`rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20 ${
                    isOwner
                      ? "border-amber-200"
                      : isAdmin
                      ? "border-purple-200"
                      : "border-orange-200"
                  }`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isOwner
                          ? "bg-amber-100"
                          : isAdmin
                          ? "bg-purple-100"
                          : "bg-orange-100"
                      }`}
                    >
                      <RoleIcon
                        className={`h-5 w-5 ${
                          isOwner
                            ? "text-amber-600"
                            : isAdmin
                            ? "text-purple-600"
                            : "text-orange-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {roleLabels[roleKey]}
                      </h3>
                      {isOwner && (
                        <p className="text-[10px] font-medium text-amber-600">
                          Accès complet
                        </p>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <div className="mb-4 rounded-xl bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-700">
                        Accès complet à tout. Ne peut pas être modifié.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {roles[roleKey]?.permissions.map((perm, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle
                          className={`h-4 w-4 flex-shrink-0 ${
                            isOwner
                              ? "text-amber-500"
                              : isAdmin
                              ? "text-purple-500"
                              : "text-orange-500"
                          }`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{perm}</span>
                      </div>
                    ))}

                    {isAdmin && (
                      <>
                        <div className="flex items-center gap-2.5">
                          <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                          <span className="text-sm text-gray-400 dark:text-gray-500">Gérer les admins</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                          <span className="text-sm text-gray-400 dark:text-gray-500">Suppression de comptes</span>
                        </div>
                      </>
                    )}

                    {isModerator && (
                      <>
                        <div className="flex items-center gap-2.5">
                          <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                          <span className="text-sm text-gray-400 dark:text-gray-500">Paiements & finances</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                          <span className="text-sm text-gray-400 dark:text-gray-500">Paramètres système</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                  <UserCog className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Assigner un rôle
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Transformez un utilisateur existant en membre d'équipe
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                  setUserSearch("");
                }}
                className="rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!selectedUser ? (
                <>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                      />
                      {userSearch && (
                        <button
                          onClick={() => setUserSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="w-44">
                      <Select
                        id="user-role-filter"
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        options={userRoleFilterOptions}
                      />
                    </div>
                  </div>

                  {loadingUsers ? (
                    <div className="py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
                    </div>
                  ) : filteredEligible.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Aucun utilisateur trouvé
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {userSearch ? "Essayez de modifier votre recherche" : "Aucun client ou vendeur disponible"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredEligible.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || ""}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${roleBgColors[user.role] || "bg-gray-400"}`}
                            >
                              {getInitials(user.name, user.email)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {user.name || "Sans nom"}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[user.role] || ""}`}
                            >
                              {roleLabels[user.role] || user.role}
                            </span>
                            <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400 dark:text-gray-500" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="flex items-center gap-3">
                      {selectedUser.image ? (
                        <img
                          src={selectedUser.image}
                          alt={selectedUser.name || ""}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white ${roleBgColors[selectedUser.role] || "bg-gray-400"}`}
                        >
                          {getInitials(selectedUser.name, selectedUser.email)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">
                          {selectedUser.name || "Sans nom"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeColors[selectedUser.role] || ""}`}
                        >
                          Rôle actuel : {roleLabels[selectedUser.role] || selectedUser.role}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-white dark:bg-gray-800 hover:text-gray-600 dark:text-gray-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nouveau rôle
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {assignableRoles.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setAssignRole(r.value)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                            assignRole === r.value
                              ? r.color === "purple"
                                ? "border-purple-500 bg-purple-50"
                                : "border-orange-500 bg-orange-50"
                              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300"
                          }`}
                        >
                          {r.value === "ADMIN" ? (
                            <Shield
                              className={`h-6 w-6 ${
                                assignRole === r.value ? "text-purple-600" : "text-gray-400 dark:text-gray-500"
                              }`}
                            />
                          ) : (
                            <ShieldCheck
                              className={`h-6 w-6 ${
                                assignRole === r.value ? "text-orange-600" : "text-gray-400 dark:text-gray-500"
                              }`}
                            />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              assignRole === r.value
                                ? r.color === "purple"
                                  ? "text-purple-700"
                                  : "text-orange-700"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {r.label}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{r.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedUser && (
              <div className="border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearch("");
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowRoleConfirm(true)}
                  >
                    <UserCog className="h-4 w-4" />
                    Confirmer l&apos;assignation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showRoleConfirm && selectedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <UserCog className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">
              Confirmer l&apos;assignation
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Vous êtes sur le point de transformer{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.name || selectedUser.email}
              </span>{" "}
              en{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {roleLabels[assignRole]}
              </span>.
            </p>
            <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Rôle actuel</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadgeColors[selectedUser.role] || ""}`}>
                  {roleLabels[selectedUser.role]}
                </span>
              </div>
              <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Nouveau rôle</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadgeColors[assignRole] || ""}`}>
                  {roleLabels[assignRole]}
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRoleConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleAssignRole}
                disabled={assigning}
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirmer
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
                  <UserPlus className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Créer un membre
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Créez un nouveau compte administrateur ou modérateur
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

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
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
                  label="Téléphone"
                  type="tel"
                  id="create-phone"
                  placeholder="+225 XX XX XX XX XX"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
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
                  minLength={6}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rôle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ADMIN", "MODERATOR"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCreateForm((p) => ({ ...p, role: r }))}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                        createForm.role === r
                          ? r === "ADMIN"
                            ? "border-purple-500 bg-purple-50"
                            : "border-orange-500 bg-orange-50"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300"
                      }`}
                    >
                      {r === "ADMIN" ? (
                        <Shield
                          className={`h-6 w-6 ${
                            createForm.role === r ? "text-purple-600" : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                      ) : (
                        <ShieldCheck
                          className={`h-6 w-6 ${
                            createForm.role === r ? "text-orange-600" : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          createForm.role === r
                            ? r === "ADMIN"
                              ? "text-purple-700"
                              : "text-orange-700"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {roleLabels[r]}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {r === "ADMIN"
                          ? "Accès complet sauf suppression"
                          : "Gestion produits & commandes"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
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
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Créer le membre
                </Button>
              </div>
            </form>
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
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {deleteConfirm.name || deleteConfirm.email}
              </span>{" "}
              ? Cette action est irréversible.
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
                className="flex-1 gap-2"
                onClick={deleteMember}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
