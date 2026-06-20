//src/context/AuthContext.tsx
import { createContext, useState, useMemo, useCallback, useEffect } from "react";
import type { ReactNode } from "react"; 

// Imports de valores (funciones que se ejecutan en runtime)
import { getMeApi, loginApi, logoutApi } from "../modules/seguridad/services/authService";
import type { LoginRequest, UserResponse } from "../modules/seguridad/interfaces/userInterfaces";

export interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 Validar sesión al montar (llamar a /auth/me)
  const validateSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getMeApi();
      
      // ✅ Validar que el usuario esté activo (state_id !== 2)
      if (userData.metadata?.state_id === 2) {
        // Si está inactivo, cerrar sesión y redirigir
        await logoutApi();
        setUser(null);
        setError("Tu cuenta está inactiva. Contacta al administrador.");
        window.location.href = "/login";
        return;
      }
      
      setUser(userData);
    } catch (err: any) {
      setUser(null);
      setError(err.response?.data?.message || "Error al validar sesión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // 🔐 Login
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      await loginApi(credentials); // Cookie se setea automáticamente
      
      // ✅ Validar estado después del login
      const userData = await getMeApi();
      if (userData.metadata?.state_id === 2) {
        await logoutApi();
        throw new Error("Tu cuenta está inactiva. Contacta al administrador.");
      }
      
      await validateSession(); // Recargar datos del usuario
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error al iniciar sesión";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [validateSession]);

  // 🚪 Logout
  const logout = useCallback(async () => {
    try {
      await logoutApi(); // Invalida sesión en Redis + borra cookie
    } catch (err) {
      console.warn("Error en logout:", err);
    } finally {
      setUser(null);
      window.location.href = "/login"; // Forzar recarga para limpiar estado
    }
  }, []);

  // Valor del contexto (memoizado para evitar re-renders innecesarios)
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user && !loading,
  }), [user, loading, error, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};