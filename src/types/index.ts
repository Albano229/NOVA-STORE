export interface ProductWithImages {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  isActive: boolean;
  isFeatured: boolean;
  shop: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  images: {
    id: string;
    url: string;
    alt: string | null;
  }[];
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ShopWithProducts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  isActive: boolean;
  isVerified: boolean;
  _count: {
    products: number;
    followers: number;
  };
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  shop: {
    name: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
  }[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalVendors: number;
  recentOrders: OrderWithItems[];
  revenueByMonth: { month: string; revenue: number }[];
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    shop: {
      id: string;
      name: string;
    };
    images: {
      url: string;
      alt: string | null;
    }[];
  };
  quantity: number;
}
