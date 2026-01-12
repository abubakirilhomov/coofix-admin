import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import CategoriesTree from "./pages/admin/CategoriesTree";
import Brands from "./pages/admin/Brands";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Reviews from "./pages/admin/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Redirect root to admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminLayout>
                  <Products />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories/tree"
              element={
                <AdminLayout>
                  <CategoriesTree />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminLayout>
                  <Categories />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/brands"
              element={
                <AdminLayout>
                  <Brands />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminLayout>
                  <Orders />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminLayout>
                  <Users />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <AdminLayout>
                  <Reviews />
                </AdminLayout>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
