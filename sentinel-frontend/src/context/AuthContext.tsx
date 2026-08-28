import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'security_analyst' | 'viewer';

export interface User {
  username: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export interface DemoCredential {
  username: string;
  password: string;
  user: User;
}

export const DEMO_CREDENTIALS: Record<string, DemoCredential> = {
  admin: {
    username: 'admin',
    password: 'sentinel2026!',
    user: {
      username: 'admin',
      name: 'SOC Lead Administrator',
      role: 'admin',
      email: 'admin@sentinel.sec',
    }
  },
  analyst: {
    username: 'analyst',
    password: 'soc2026!',
    user: {
      username: 'analyst',
      name: 'Senior SOC Analyst',
      role: 'security_analyst',
      email: 'analyst@sentinel.sec',
    }
  },
  viewer: {
    username: 'viewer',
    password: 'viewer2026!',
    user: {
      username: 'viewer',
      name: 'Compliance Auditor / Viewer',
      role: 'viewer',
      email: 'viewer@sentinel.sec',
    }
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  quickLogin: (roleKey: 'admin' | 'analyst' | 'viewer') => void;
  logout: () => void;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  canPerformAction: (action: 'simulate' | 'retrain' | 'respond' | 'feedback' | 'admin_settings') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sentinel_demo_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    // Default to admin for seamless evaluation
    return DEMO_CREDENTIALS.admin.user;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const login = (username: string, password: string): boolean => {
    const cred = Object.values(DEMO_CREDENTIALS).find(
      (c) => c.username.toLowerCase() === username.trim().toLowerCase() && c.password === password
    );

    if (cred) {
      setUser(cred.user);
      return true;
    }
    return false;
  };

  const quickLogin = (roleKey: 'admin' | 'analyst' | 'viewer') => {
    if (DEMO_CREDENTIALS[roleKey]) {
      setUser(DEMO_CREDENTIALS[roleKey].user);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    if (requiredRole === 'viewer') return true;
    if (requiredRole === 'security_analyst') return user.role === 'admin' || user.role === 'security_analyst';
    if (requiredRole === 'admin') return user.role === 'admin';
    return false;
  };

  const canPerformAction = (action: 'simulate' | 'retrain' | 'respond' | 'feedback' | 'admin_settings'): boolean => {
    if (!user) return false;
    switch (action) {
      case 'simulate':
      case 'retrain':
      case 'admin_settings':
        return user.role === 'admin';
      case 'respond':
      case 'feedback':
        return user.role === 'admin' || user.role === 'security_analyst';
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        quickLogin,
        logout,
        hasPermission,
        canPerformAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
