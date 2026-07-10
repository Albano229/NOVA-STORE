"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type Workspace = "admin" | "moderator" | "shop";

interface ShopInfo {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextType {
  workspace: Workspace;
  setWorkspace: (ws: Workspace) => void;
  hasShop: boolean;
  setHasShop: (v: boolean) => void;
  shops: ShopInfo[];
  setShops: (shops: ShopInfo[]) => void;
  currentShop: ShopInfo | null;
  setCurrentShop: (shop: ShopInfo | null) => void;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isVendor: boolean;
  canSwitchWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: "admin",
  setWorkspace: () => {},
  hasShop: false,
  setHasShop: () => {},
  shops: [],
  setShops: () => {},
  currentShop: null,
  setCurrentShop: () => {},
  isOwner: false,
  isAdmin: false,
  isModerator: false,
  isVendor: false,
  canSwitchWorkspace: false,
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isOwner = role === "OWNER";
  const isAdmin = role === "ADMIN";
  const isModerator = role === "MODERATOR";
  const isVendor = role === "VENDOR";
  const isStaff = isOwner || isAdmin || isModerator;

  const [hasShop, setHasShop] = useState(false);
  const [shops, setShopsState] = useState<ShopInfo[]>([]);
  const [currentShop, setCurrentShopState] = useState<ShopInfo | null>(null);
  const [workspace, setWorkspaceState] = useState<Workspace>(
    isVendor ? "shop" : isModerator ? "moderator" : "admin"
  );

  const canSwitchWorkspace = isStaff && hasShop;

  useEffect(() => {
    if (!isStaff) return;
    const saved = localStorage.getItem("nova_workspace") as Workspace | null;
    if (saved && ["admin", "moderator", "shop"].includes(saved)) {
      if (saved === "shop" && !hasShop) {
        setWorkspaceState(isModerator ? "moderator" : "admin");
      } else {
        setWorkspaceState(saved);
      }
    } else {
      setWorkspaceState(isModerator ? "moderator" : "admin");
    }
  }, [isStaff, hasShop, isModerator]);

  useEffect(() => {
    if (!isVendor && !hasShop) return;
    const savedShop = localStorage.getItem("nova_current_shop");
    if (savedShop) {
      try {
        setCurrentShopState(JSON.parse(savedShop));
      } catch {
        localStorage.removeItem("nova_current_shop");
      }
    }
  }, [isVendor, hasShop]);

  const setWorkspace = useCallback(
    (ws: Workspace) => {
      setWorkspaceState(ws);
      localStorage.setItem("nova_workspace", ws);
    },
    []
  );

  const setShops = useCallback((newShops: ShopInfo[]) => {
    setShopsState(newShops);
    if (newShops.length > 0 && !currentShop) {
      const savedShopId = localStorage.getItem("nova_current_shop_id");
      const saved = savedShopId ? newShops.find((s) => s.id === savedShopId) : null;
      const shopToSet = saved || newShops[0];
      setCurrentShopState(shopToSet);
      localStorage.setItem("nova_current_shop", JSON.stringify(shopToSet));
      localStorage.setItem("nova_current_shop_id", shopToSet.id);
    }
  }, [currentShop]);

  const setCurrentShop = useCallback((shop: ShopInfo | null) => {
    setCurrentShopState(shop);
    if (shop) {
      localStorage.setItem("nova_current_shop", JSON.stringify(shop));
      localStorage.setItem("nova_current_shop_id", shop.id);
    } else {
      localStorage.removeItem("nova_current_shop");
      localStorage.removeItem("nova_current_shop_id");
    }
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        hasShop,
        setHasShop,
        shops,
        setShops,
        currentShop,
        setCurrentShop,
        isOwner,
        isAdmin,
        isModerator,
        isVendor,
        canSwitchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
