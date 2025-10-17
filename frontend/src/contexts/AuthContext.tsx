import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import { clearCache, invalidateCache } from '../utils/cache';

interface User {
  userid: number;
  email: string;
  firstname?: string;
  lastname?: string;
  profileimage?:string;
  role: string;
  status: string;
  teamid?: number;
  teamname?: string;
  teamlogo?: string;
  position?: string;
  jerseynumber?: number;
  preferredfoot?: string;
  height?: number;
  weight?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstname?: string,
    lastname?: string,
    options?: { position?: string; jerseynumber?: number; preferredfoot?: string; height?: number; weight?: number }
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Check if user is logged in on app start
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          // Fetch user data with the stored token
          const userData = await api.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Add a token refresh mechanism
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'access_token') {
        if (e.newValue) {
          setToken(e.newValue);
        } else {
          setToken(null);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also refresh user on window focus to reflect latest membership/team changes
    const handleFocus = async () => {
      const currentToken = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (currentToken) {
        try {
          const fresh = await api.getCurrentUser();
          setUser(fresh);
        } catch (e) {
          // ignore focus refresh errors
        }
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      // Immediately refresh full user from /auth/me to include latest team info/logo
      try {
        const fullUser = await api.getCurrentUser();
        setUser(fullUser);
      } catch {
        // Fallback to server-returned snapshot if /auth/me fails
        setUser(userData);
      }
      // Clear cached GETs as authenticated views may differ
      clearCache();
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstname?: string,
    lastname?: string,
    options?: { position?: string; jerseynumber?: number; preferredfoot?: string; height?: number; weight?: number }
  ) => {
    try {
      const response = await api.register(email, password, firstname, lastname, options);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      try {
        const fullUser = await api.getCurrentUser();
        setUser(fullUser);
      } catch {
        setUser(userData);
      }
      clearCache();
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    clearCache();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      // Invalidate caches that are user-specific
      invalidateCache('GET:/auth/me');
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
