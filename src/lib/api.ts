const API_BASE = import.meta.env.VITE_API_URL;

// Token management
let accessToken: string | null = localStorage.getItem("accessToken");

export const setAccessToken = (token: string) => {
  accessToken = token;
  localStorage.setItem("accessToken", token);
};

export const clearAccessToken = () => {
  accessToken = null;
  localStorage.removeItem("accessToken");
};

export const getAccessToken = () => accessToken;

// API helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // 👈 КРИТИЧНО (cookie)
  });

  // 🔁 Access token expired
  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    // ❌ refresh token тоже умер → logout
    if (!refreshResponse.ok) {
      clearAccessToken();
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    const { accessToken: newAccessToken } = await refreshResponse.json();
    setAccessToken(newAccessToken);

    // 🔁 повтор запроса
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      },
      credentials: "include",
    });
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; user: User; accessToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

  register: (name: string, email: string, password: string) =>
    apiRequest<{ success: boolean; user: User }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }
    ),

  logout: () =>
    apiRequest<{ success: boolean }>("/auth/logout", {
      method: "POST",
    }),

  refresh: () =>
    apiRequest<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
    }),

  me: () =>
    apiRequest<{ success: boolean; user: User }>("/auth/me"),
};

export const statsApi = {
  overview: () => apiRequest<OverviewStats>('/stats/overview'),

  sales: () => apiRequest<{ name: string; sales: number; orders: number }[]>(
    '/stats/sales'
  ),

  byCategory: () =>
    apiRequest<{ name: string; value: number }[]>('/stats/by-category'),

  recentOrders: () =>
    apiRequest<
      { id: string; customer: string; total: number; status: string }[]
    >('/stats/recent-orders'),
};


// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiRequest<{
      products: Product[];
      total: number;
      page: number;
      pages: number;
    }>(
      `/products?${new URLSearchParams(
        params as Record<string, string>
      ).toString()}`
    ),
  getBySlug: (slug: string) => apiRequest<Product>(`/products/${slug}`),
  getNew: () => apiRequest<Product[]>("/products/new"),
  getSale: () => apiRequest<Product[]>("/products/sale"),
  search: (q: string) =>
    apiRequest<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),
  filter: (params: FilterParams) =>
    apiRequest<Product[]>(
      `/products/filter?${new URLSearchParams(
        params as Record<string, string>
      ).toString()}`
    ),
  create: (data: ProductInput) =>
    apiRequest<Product>("/admin/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<ProductInput>) =>
    apiRequest<Product>(`/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/admin/products/${id}`, {
      method: "DELETE",
    }),
  updateStock: (id: string, quantity: number) =>
    apiRequest<Product>(`/admin/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest<{ categories: Category[] }>("/categories"),
  getBySlug: (slug: string) => apiRequest<Category>(`/categories/${slug}`),
  create: (data: CategoryInput) =>
    apiRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<CategoryInput>) =>
    apiRequest<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/categories/${id}`, { method: "DELETE" }),
};

// Brands API
export const brandsApi = {
  getAll: () => apiRequest<{ brands: Brand[] }>("/brands"),
  getBySlug: (slug: string) => apiRequest<Brand>(`/brands/${slug}`),
  create: (data: BrandInput) =>
    apiRequest<Brand>("/brands", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<BrandInput>) =>
    apiRequest<Brand>(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/brands/${id}`, { method: "DELETE" }),
};

// Orders API
export const ordersApi = {
  getAll: () => apiRequest<{ orders: Order[] }>("/orders"),
  getMy: () => apiRequest<{ orders: Order[] }>("/orders/my"),
  create: (data: { address: string; phone: string }) =>
    apiRequest<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStatus: (orderId: string, status: string) =>
    apiRequest<Order>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// Reviews API
export const reviewsApi = {
  getAll: () => apiRequest<{ reviews: Review[] }>("/admin/reviews"),
  getByProduct: (productId: string) =>
    apiRequest<{ reviews: Review[] }>(`/admin/reviews/${productId}`),
  create: (data: { productId: string; rating: number; text: string }) =>
    apiRequest<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (reviewId: string) =>
    apiRequest<{ success: boolean }>(`/admin/reviews/${reviewId}`, {
      method: "DELETE",
    }),
  adminDelete: (reviewId: string) =>
    apiRequest<{ success: boolean }>(`/admin/reviews/admin/${reviewId}`, {
      method: "DELETE",
    }),
};

// Upload API
export const uploadApi = {
  single: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE}/upload/single`, {
      method: "POST",
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  },
  multiple: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(`${API_BASE}/upload/multiple`, {
      method: "POST",
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    return response.json();
  },
};

export const usersAdminApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = String(value);
          }
          return acc;
        },
        {} as Record<string, string>
      )
    ).toString();

    return apiRequest<{ success: boolean; users: AdminUser[]; total: number; page: number; pages: number }>(
      `/admin/users${query ? `?${query}` : ''}`
    );
  },
  getById: (id: string) =>
    apiRequest<{ success: boolean; user: AdminUser }>(
      `/admin/users/${id}`
    ),
  update: (
    id: string,
    data: {
      role?: 'customer' | 'admin';
      isVerified?: boolean;
    }
  ) =>
    apiRequest<{ success: boolean; user: AdminUser }>(
      `/admin/users/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),
  delete: (id: string) =>
    apiRequest<{ success: boolean }>(
      `/admin/users/${id}`,
      {
        method: 'DELETE',
      }
    ),
};

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: Category;
  brand: Brand;
  images: string[];
  characteristics: Record<string, string>;
  quantity: number;
  isNew: boolean;
  isSale: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  brand: string;
  images: string[];
  characteristics: Record<string, string>;
  quantity: number;
  isNew: boolean;
  isSale: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  parent?: Category;
}

export interface CategoryInput {
  name: string;
  image?: string;
  parent?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface BrandInput {
  name: string;
  logo?: string;
}

export interface Order {
  _id: string;
  user: User;
  items: { product: Product; quantity: number; price: number }[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  address: string;
  phone: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: User;
  product: Product;
  rating: number;
  text: string;
  createdAt: string;
}

export interface FilterParams {
  category?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface OverviewStats {
  totalProducts: number;
  totalOrders: number;
  newUsers: {
    value: number;
    percent: number;
    type: "positive" | "negative" | "neutral";
  };
  revenue: {
    value: number;
    percent: number;
    type: "positive" | "negative" | "neutral";
  };
}