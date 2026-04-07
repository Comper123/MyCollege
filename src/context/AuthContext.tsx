"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserRole } from "@/lib/db/schema";

interface User {
  id: string;
  name: string;

  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Функция загрузки пользователя вынесена отдельно
  const loadUser = useCallback(() => {
    let isMounted = true;
    
    const loadFromStorage = () => {
      try {
        const token = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("user");
        
        if (token && savedUser && isMounted) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Используем setTimeout для асинхронной установки
    const timeoutId = setTimeout(loadFromStorage, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const cleanup = loadUser();
    return cleanup;
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string, role: string) => {
    setIsLoading(true);
    
    return new Promise<void>((resolve, reject) => {
      // Имитация API-запроса
      setTimeout(() => {
        if (email && password) {
          const userData: User = {
            id: Math.random().toString(36),
            name: email.split("@")[0],
            email: email,
            role: role as "admin" | "lab" | "teacher",
          };
          
          setUser(userData);
          localStorage.setItem("auth_token", "fake_token_123");
          localStorage.setItem("user", JSON.stringify(userData));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error("Неверный логин или пароль"));
        }
      }, 1000);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}