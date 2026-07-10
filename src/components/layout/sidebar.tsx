"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Users,
  DollarSign,
  BarChart3,
  ExternalLink,
  LifeBuoy,
  User,
  Store,
  Workflow,
  LogOut,
  Megaphone,
  AlertTriangle,
  Shield,
  Crown,
  FileText,
  Ticket,
  Lock,
  CreditCard,
  UserCog,
  Plus,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { BRAND } from "@/lib/brand";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { workspace, hasShop, currentShop, isOwner, isAdmin, isModerator, setWorkspace } = useWorkspace();
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || BRAND.name;

  const isStaff = isOwner || isAdmin || isModerator;
  const inShopMode = workspace === "shop" && hasShop;

  const adminLinks = [
    { href: "/admin", label: "Accueil", icon: LayoutDashboard },
    { href: "/admin/users", label: "Utilisateurs", icon: Users },
    { href: "/admin/stores", label: "Boutiques", icon: Store },
    { href: "/admin/products", label: "Produits", icon: Package },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/admin/payments", label: "Paiements", icon: CreditCard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/marketing", label: "Marketing", icon: Megaphone },
    { href: "/admin/coupons", label: "Codes Promo", icon: Tag },
    { href: "/admin/support", label: "Support", icon: Ticket },
    { href: "/admin/referrals", label: "Parrainage", icon: Users },
    { href: "/admin/logs", label: "Modération", icon: Shield },
    ...(isOwner ? [
      { href: "/admin/reports", label: "Rapports", icon: FileText },
      { href: "/admin/team", label: "Équipe", icon: UserCog },
      { href: "/admin/security", label: "Sécurité", icon: Lock },
      { href: "/admin/settings", label: "Paramètres Admin", icon: Settings },
      { href: "/owner/settings", label: "Paramètres Plateforme", icon: Crown },
    ] : []),
  ];

  const moderatorLinks = [
    { href: "/moderator", label: "Accueil", icon: LayoutDashboard },
    { href: "/moderator/products", label: "Produits à valider", icon: Package },
    { href: "/moderator/stores", label: "Boutiques", icon: Store },
    { href: "/moderator/users", label: "Utilisateurs", icon: Users },
    { href: "/moderator/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/moderator/transactions", label: "Transactions", icon: DollarSign },
    { href: "/moderator/fraud", label: "Alertes fraude", icon: AlertTriangle },
  ];

  const vendorLinks = [
    { href: "/vendor", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/stores", label: "Mes boutiques", icon: Store },
    { href: "/vendor/products", label: "Mes produits", icon: Package },
    { href: "/vendor/orders", label: "Mes commandes", icon: ShoppingCart },
    { href: "/vendor/clients", label: "Mes clients", icon: Users },
    { href: "/vendor/payouts", label: "Mes revenus", icon: DollarSign },
    { href: "/vendor/analytics", label: "Statistiques", icon: BarChart3 },
    { href: "/vendor/marketing", label: "Coupons & Offres", icon: Megaphone },
    { href: "/vendor/automatisation", label: "Automatisations", icon: Workflow },
    { href: "/vendor/settings", label: "Paramètres boutique", icon: Settings },
    { href: "/vendor/help", label: "Support", icon: LifeBuoy },
  ];

  let links: typeof adminLinks;
  let workspaceLabel: string;
  let workspaceIcon: typeof Crown;
  let roleBadge: { label: string; color: string; bgColor: string; icon: typeof Crown };

  if (inShopMode) {
    links = vendorLinks;
    workspaceLabel = currentShop?.name || "Ma Boutique";
    workspaceIcon = Store;
    roleBadge = { label: "Vendeur", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/50", icon: Store };
  } else if (isOwner) {
    links = adminLinks;
    workspaceLabel = "Plateforme";
    workspaceIcon = Crown;
    roleBadge = { label: "Propriétaire", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/50", icon: Crown };
  } else if (isModerator) {
    links = moderatorLinks;
    workspaceLabel = "Modération";
    workspaceIcon = ShieldCheck;
    roleBadge = { label: "Modérateur", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/50", icon: ShieldCheck };
  } else if (isAdmin) {
    links = adminLinks;
    workspaceLabel = "Administration";
    workspaceIcon = Shield;
    roleBadge = { label: "Administrateur", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/50", icon: Shield };
  } else {
    links = vendorLinks;
    workspaceLabel = currentShop?.name || "Ma Boutique";
    workspaceIcon = Store;
    roleBadge = { label: "Vendeur", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/50", icon: Store };
  }

  const RoleBadgeIcon = roleBadge.icon;
  const getShopUrl = () => currentShop ? `/shops/${currentShop.slug}` : "#";

  const sidebarContent = (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        {inShopMode && currentShop ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{currentShop.name}</p>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                    roleBadge.bgColor,
                    roleBadge.color
                  )}>
                    <RoleBadgeIcon className="h-2.5 w-2.5" />
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>
            {isStaff && (
              <button
                onClick={() => {
                  setWorkspace(isModerator ? "moderator" : "admin");
                  window.location.href = isModerator ? "/moderator" : "/admin";
                }}
                className="mt-3 flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Retour à l&apos;administration
              </button>
            )}
          </>
        ) : isOwner ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{siteName}</p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                roleBadge.bgColor,
                roleBadge.color
              )}>
                <RoleBadgeIcon className="h-2.5 w-2.5" />
                {roleBadge.label}
              </span>
            </div>
          </div>
        ) : isAdmin ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{siteName}</p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                roleBadge.bgColor,
                roleBadge.color
              )}>
                <RoleBadgeIcon className="h-2.5 w-2.5" />
                {roleBadge.label}
              </span>
            </div>
          </div>
        ) : isModerator ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
              <ShieldCheck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{siteName}</p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                roleBadge.bgColor,
                roleBadge.color
              )}>
                <RoleBadgeIcon className="h-2.5 w-2.5" />
                {roleBadge.label}
              </span>
            </div>
          </div>
        ) : null}

        {inShopMode && currentShop && (
          <a
            href={getShopUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ExternalLink className="h-4 w-4" />
            Visiter ma boutique
          </a>
        )}
      </div>

      {!hasShop && isStaff && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <Link
            href="/stores/create"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#5e1f99]"
          >
            <Plus className="h-4 w-4" />
            Créer ma boutique
          </Link>
        </div>
      )}

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => {
          const baseHref = inShopMode ? "/vendor" : isModerator ? "/moderator" : "/admin";
          const isActive =
            link.href === baseHref
              ? pathname === link.href || pathname.startsWith(baseHref + "/")
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-4 border-[#7126b6] bg-purple-50 text-[#7126b6] dark:bg-purple-900/30 dark:text-purple-400"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              )}
            >
              <link.icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <User className="h-5 w-5" />
          <span>Profil</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            isOwner && !inShopMode ? "bg-gradient-to-br from-amber-500 to-orange-600" : inShopMode ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-gray-200 dark:bg-gray-700"
          )}>
            {isOwner && !inShopMode ? (
              <Crown className="h-5 w-5 text-white" />
            ) : inShopMode ? (
              <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {session?.user.name || "Utilisateur"}
            </p>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
              roleBadge.bgColor,
              roleBadge.color
            )}>
              <RoleBadgeIcon className="h-2.5 w-2.5" />
              {roleBadge.label}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden h-dvh md:block">{sidebarContent}</div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex flex-col md:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
