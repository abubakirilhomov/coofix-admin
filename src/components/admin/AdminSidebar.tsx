import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Package,
  Layers,
  Tag,
  ShoppingCart,
  Users,
  Star,
  LogOut,
  Menu,
  X,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Главная', href: '/admin', icon: LayoutDashboard },
  { title: 'Товары', href: '/admin/products', icon: Package },
  { title: 'Категории', href: '/admin/categories', icon: Layers },
  { title: 'Дерево', href: '/admin/categories/tree', icon: FolderOpen },
  { title: 'Бренды', href: '/admin/brands', icon: Tag },
  { title: 'Заказы', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Пользователи', href: '/admin/users', icon: Users },
  { title: 'Отзывы', href: '/admin/reviews', icon: Star },
];

export const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-primary-foreground">
            Админ панель
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">
            Управление магазином
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/admin'}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              activeClassName="bg-sidebar-primary text-sidebar-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Админ'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 mt-2 rounded-lg text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>
    </>
  );
};
