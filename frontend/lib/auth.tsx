import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Check if auth token exists in localStorage
    const savedAuth = localStorage.getItem('garmin_dashboard_authenticated') === 'true';
    setIsAuthenticated(savedAuth);
    setIsInitialized(true);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      const { data } = await api.post('/auth/login', { password });
      if (data.authenticated) {
        localStorage.setItem('garmin_dashboard_authenticated', 'true');
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('garmin_dashboard_authenticated');
    setIsAuthenticated(false);
  };

  // Prevent flash of unauthenticated UI during initialization
  if (!isInitialized) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm">Initializing dashboard...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
