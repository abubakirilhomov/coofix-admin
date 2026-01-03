// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  authApi,
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  User,
} from '@/lib/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Проверка сессии при старте
  useEffect(() => {
    const loadUser = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();

        if (response.success && response.user) {
          setUser(response.user);
        } else {
          clearAccessToken();
        }
      } catch (err) {
        clearAccessToken();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 🔐 Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.login(email, password);

      if (!response.success) {
        throw new Error('Ошибка входа');
      }

      // ✅ сохраняем ТОЛЬКО accessToken
      setAccessToken(response.accessToken);
      setUser(response.user);

      toast.success(`Добро пожаловать, ${response.user.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Неверный email или пароль');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await authApi.logout(); // 👈 backend очистит httpOnly cookie
    } catch {
      // даже если запрос упал — чистим локально
    } finally {
      clearAccessToken();
      setUser(null);
      toast.success('Вы вышли из аккаунта');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
