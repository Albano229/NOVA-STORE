"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  Lock,
  Shield,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Store,
  CreditCard,
  Download,
  Trash2,
  AlertTriangle,
  Check,
  X,
  Bell,
  Globe,
  Palette,
  Activity,
  Clock,
  LogOut,
  KeyRound,
  Settings,
  ArrowRight,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Smartphone,
  MessageSquare,
  Monitor,
  Info,
  MapPin,
  Plus,
  Pencil,
  Trash2 as TrashIcon,
  Home,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  shops: Array<{
    id: string;
    name: string;
    slug: string;
    productCount: number;
    orderCount: number;
    revenue: number;
  }>;
  stats: {
    totalOrders: number;
    totalSpent: number;
    totalProducts: number;
    totalRevenue: number;
  };
  recentActivity: Array<{
    action: string;
    description: string;
    date: string;
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MODERATOR: "Modérateur",
  VENDOR: "Vendeur",
  CLIENT: "Client",
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
  MODERATOR: "bg-orange-100 text-orange-700",
  VENDOR: "bg-blue-100 text-blue-700",
  CLIENT: "bg-green-100 text-green-700",
};

const PERMISSIONS: Record<string, string[]> = {
  OWNER: ["Gérer les admins", "Gérer les vendeurs", "Gérer les produits", "Gérer les commandes", "Paramètres plateforme", "Finances"],
  ADMIN: ["Gérer les admins", "Gérer les vendeurs", "Gérer les produits", "Gérer les commandes", "Paramètres plateforme"],
  MODERATOR: ["Modérer les produits", "Modérer les commandes", "Gérer les signalements"],
  VENDOR: ["Gérer ses produits", "Gérer ses commandes", "Gérer sa boutique", "Voir ses analytics"],
  CLIENT: ["Passer des commandes", "Gérer son profil", "Voir ses commandes"],
};

const ACTIVITY_ICONS: Record<string, any> = {
  commande: Package,
  connexion: KeyRound,
  profil: User,
  produit: ShoppingBag,
  default: Activity,
};

const LANGUAGES = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
  { code: "ES", label: "Español" },
  { code: "PT", label: "Português" },
  { code: "WOL", label: "Wolof" },
];

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [language, setLanguage] = useState("FR");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState({
    label: "Domicile",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bénin",
    phone: "",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setImage(data.user.image || "");
      }
    } catch {
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, image }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => (prev ? { ...prev, user: data.user } : null));
        await updateSession();
        toast.success("Profil sauvegardé");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setEmailSending(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "changeEmail", newEmail, password: emailPassword }),
      });
      if (res.ok) {
        toast.success("Email de vérification envoyé");
        setNewEmail("");
        setEmailPassword("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setEmailSending(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        toast.success("Mot de passe modifié avec succès");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors du changement");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setChangingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteAccount", password: deletePassword }),
      });
      if (res.ok) {
        toast.success("Compte supprimé");
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  };

  const getPasswordStrength = (pw: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score, label: "Faible", color: "bg-red-500" };
    if (score <= 3) return { score, label: "Moyen", color: "bg-yellow-500" };
    return { score, label: "Fort", color: "bg-green-500" };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(amount);
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-[#0f172a]" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400">Impossible de charger le profil</p>
      </div>
    );
  }

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const method = editingAddress ? "PATCH" : "POST";
      const body = editingAddress ? { ...addressForm, id: editingAddress.id } : addressForm;
      const res = await fetch("/api/user/addresses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editingAddress ? "Adresse modifiée" : "Adresse ajoutée");
        setShowAddressModal(false);
        setEditingAddress(null);
        resetAddressForm();
        fetchAddresses();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Supprimer cette adresse ?")) return;
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Adresse supprimée");
        fetchAddresses();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Domicile",
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Bénin",
      phone: "",
      isDefault: false,
    });
  };

  const openEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label || "Domicile",
      firstName: addr.firstName,
      lastName: addr.lastName,
      address: addr.address,
      city: addr.city,
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country,
      phone: addr.phone || "",
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
  };

  const { user, shops, stats, recentActivity } = profile;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mon Profil</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gérez vos informations, sécurité et préférences</p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 overflow-hidden">
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-700 transition-colors">
              <User className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name || "Utilisateur"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <Badge variant={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500">Membre depuis</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Informations personnelles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nom complet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
          <Input
            label="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+229 52 00 00 00"
          />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </div>
            <Badge variant="info">Vérifié</Badge>
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Date d&apos;inscription</label>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400">
            {formatDate(user.createdAt)}
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <button
          onClick={() => setEmailExpanded(!emailExpanded)}
          className="flex w-full items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Changer d&apos;email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mettre à jour votre adresse email</p>
            </div>
          </div>
          {emailExpanded ? <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
        </button>
        {emailExpanded && (
          <div className="border-t border-gray-100 dark:border-gray-700/50 px-6 pb-6">
            <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">Un email de confirmation sera envoyé à la nouvelle adresse.</p>
            </div>
            <div className="mt-4 space-y-3">
              <Input
                label="Email actuel"
                value={user.email}
                disabled
              />
              <Input
                label="Nouvel email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouveau@email.com"
              />
              <Input
                label="Confirmer avec votre mot de passe"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Mot de passe actuel"
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleChangeEmail} disabled={emailSending}>
                {emailSending ? "Envoi..." : "Envoyer la vérification"}
              </Button>
              <Badge variant="warning">En attente de validation</Badge>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
            <Lock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mot de passe</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifier votre mot de passe</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Mot de passe actuel"
              type={showCurrentPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-[38px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
            >
              {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-[38px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
            >
              {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < passwordStrength.score ? passwordStrength.color : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Force: <span className="font-medium">{passwordStrength.label}</span>
              </p>
            </div>
          )}
          <div className="relative">
            <Input
              label="Confirmer le mot de passe"
              type={showConfirmPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              error={confirmPassword && newPassword !== confirmPassword ? "Les mots de passe ne correspondent pas" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-[38px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Le mot de passe doit contenir :</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                {newPassword.length >= 8 ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-300" />}
                8 caractères minimum
              </span>
              <span className="flex items-center gap-1">
                {/[A-Z]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-300" />}
                Une majuscule
              </span>
              <span className="flex items-center gap-1">
                {/[0-9]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-300" />}
                Un chiffre
              </span>
              <span className="flex items-center gap-1">
                {/[^A-Za-z0-9]/.test(newPassword) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-gray-300" />}
                Un caractère spécial
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={changingPw}>
              <Lock className="mr-2 h-4 w-4" />
              {changingPw ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sécurité du compte</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Protégez votre compte</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Authentification à deux facteurs</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bouclier de sécurité supplémentaire</p>
              </div>
            </div>
            <Badge variant="warning">Bientôt disponible</Badge>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Sessions actives</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Session actuelle</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Navigateur web — maintenant</p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Historique de connexion</p>
            <div className="space-y-2">
              {recentActivity.slice(0, 3).map((act, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{act.description}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(act.date)}</span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">Aucune activité récente</p>
              )}
            </div>
          </div>

          <Button variant="outline" className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion de tous les appareils
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mes adresses</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gérez vos adresses de livraison</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { resetAddressForm(); setEditingAddress(null); setShowAddressModal(true); }}>
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className={`rounded-xl border p-4 relative ${addr.isDefault ? "border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700" : "border-gray-200 dark:border-gray-700"}`}>
                {addr.isDefault && (
                  <Badge variant="warning" className="absolute top-2 right-2 text-[10px]">Par défaut</Badge>
                )}
                <div className="flex items-start gap-2 mb-2">
                  {addr.label === "Bureau" ? <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" /> : <Home className="h-4 w-4 text-gray-400 mt-0.5" />}
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{addr.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{addr.firstName} {addr.lastName}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{addr.address}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ""}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">{addr.country}</p>
                {addr.phone && <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">{addr.phone}</p>}
                <div className="flex gap-2 mt-3 ml-6">
                  <button onClick={() => openEditAddress(addr)} className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> Modifier
                  </button>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1">
                    <TrashIcon className="h-3 w-3" /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune adresse enregistrée</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => { resetAddressForm(); setEditingAddress(null); setShowAddressModal(true); }}>
              <Plus className="mr-1 h-3 w-3" /> Ajouter une adresse
            </Button>
          </div>
        )}
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingAddress ? "Modifier l'adresse" : "Nouvelle adresse"}
              </h3>
              <button onClick={() => { setShowAddressModal(false); setEditingAddress(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Label</label>
                <div className="flex gap-2 mt-1">
                  {["Domicile", "Bureau", "Autre"].map((l) => (
                    <button key={l} type="button" onClick={() => setAddressForm({ ...addressForm, label: l })}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${addressForm.label === l ? "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/20 dark:border-orange-600" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" value={addressForm.firstName} onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })} placeholder="Jean" />
                <Input label="Nom" value={addressForm.lastName} onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })} placeholder="Dupont" />
              </div>
              <Input label="Adresse" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="123 rue principale" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ville" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="Cotonou" />
                <Input label="Code postal" value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} placeholder="01000" />
              </div>
              <Input label="Pays" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="Bénin" />
              <Input label="Téléphone" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+229 52 00 00 00" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Définir comme adresse par défaut</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}>Annuler</Button>
                <Button onClick={handleSaveAddress} disabled={savingAddress}>
                  {savingAddress ? "Enregistrement..." : editingAddress ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
            <Settings className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Rôle & Permissions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Informations sur votre compte</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-1 min-w-[140px]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rôle</p>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${ROLE_COLORS[user.role] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-1 min-w-[140px]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Statut</p>
              <Badge variant={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(PERMISSIONS[user.role] || []).map((perm) => (
                <div key={perm} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {perm}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 p-3">
            <Info className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Les rôles et permissions sont définis par l&apos;administrateur et ne sont pas modifiables.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
            <Activity className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activité récente</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vos dernières actions</p>
          </div>
        </div>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((act, i) => {
              const Icon = ACTIVITY_ICONS[act.action] || ACTIVITY_ICONS.default;
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700/50 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{act.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(act.date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune activité récente</p>
          </div>
        )}
      </div>

      {user.role === "VENDOR" && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Store className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vendeur</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vos boutiques et statistiques</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Produits</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProducts}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Commandes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{shops.reduce((s, sh) => s + sh.orderCount, 0)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Revenus</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>

            {shops.length > 0 ? (
              <div className="space-y-2">
                {shops.map((shop) => (
                  <div key={shop.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-semibold text-sm">
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shop.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{shop.productCount} produits · {shop.orderCount} commandes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(shop.revenue)}</span>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-8 text-center">
                <Store className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune boutique</p>
              </div>
            )}

            <a
              href="/vendor"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
              <Store className="h-4 w-4" />
              Tableau de bord vendeur
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Paiements</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Historique des transactions</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total dépensé</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Transactions récentes</p>
            {stats.totalOrders > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <span className="text-gray-600 dark:text-gray-400">Achats totalisés</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stats.totalOrders} commande{stats.totalOrders > 1 ? "s" : ""}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-6 text-center">
                <CreditCard className="mx-auto h-6 w-6 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
            <Bell className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Préférences</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personnalisez votre expérience</p>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Notifications</p>
            <div className="space-y-2">
              {[
                { label: "Notifications par email", icon: Mail, value: notifEmail, onChange: setNotifEmail },
                { label: "Notifications push", icon: Bell, value: notifPush, onChange: setNotifPush },
                { label: "Notifications SMS", icon: MessageSquare, value: notifSms, onChange: setNotifSms },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </div>
                  <button
                    onClick={() => item.onChange(!item.value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.value ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-800 transition-transform ${item.value ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Langue</p>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Thème</p>
            <div className="flex gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    theme === t ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {t === "light" ? <Palette className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {t === "light" ? "Clair" : "Sombre"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actions de compte</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gestion avancée de votre compte</p>
          </div>
        </div>
        <div className="space-y-3">
          <button className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Télécharger mes données</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exportez toutes vos données personnelles</p>
            </div>
          </button>

          <button className="flex w-full items-center gap-3 rounded-xl border border-red-200 p-4 text-left hover:bg-red-50 transition-colors">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">Désactiver mon compte</p>
              <p className="text-xs text-red-500">Votre compte sera temporairement désactivé</p>
            </div>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-left hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">Supprimer mon compte</p>
              <p className="text-xs text-red-500">Cette action est irréversible</p>
            </div>
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Supprimer le compte</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible</p>
              </div>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-4">
              <p className="text-sm text-red-700">
                Toutes vos données seront définitivement supprimées. Vous ne pourrez pas récupérer votre compte.
              </p>
            </div>
            <Input
              label="Entrez votre mot de passe pour confirmer"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Mot de passe"
            />
            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Moon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
