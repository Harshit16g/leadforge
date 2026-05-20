"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  id: string;
  name: string;
  role: 'sales' | 'manager';
}

interface AuthContextType {
  role: 'sales' | 'manager' | null;
  user: UserProfile | null;
  loginAs: (user: UserProfile) => void;
  setRole: (role: 'sales' | 'manager') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<'sales' | 'manager' | null>(null);
  const [user, setUserState] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Load from local storage if exists
    const savedRole = localStorage.getItem('leadforge_role') as 'sales' | 'manager';
    const savedUser = localStorage.getItem('leadforge_user');
    
    if (savedRole) setRoleState(savedRole);
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch {
        // Safe fallback
      }
    }
  }, []);

  const loginAs = (profile: UserProfile) => {
    localStorage.setItem('leadforge_role', profile.role);
    localStorage.setItem('leadforge_user', JSON.stringify(profile));
    setRoleState(profile.role);
    setUserState(profile);
  };

  const setRole = (newRole: 'sales' | 'manager') => {
    localStorage.setItem('leadforge_role', newRole);
    setRoleState(newRole);
    
    // Auto-map placeholder user profiles for backward compatibility
    if (newRole === 'manager') {
      const defaultManager: UserProfile = {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Michael Chen',
        role: 'manager'
      };
      localStorage.setItem('leadforge_user', JSON.stringify(defaultManager));
      setUserState(defaultManager);
    } else {
      const defaultEmployee: UserProfile = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Sarah Jenkins',
        role: 'sales'
      };
      localStorage.setItem('leadforge_user', JSON.stringify(defaultEmployee));
      setUserState(defaultEmployee);
    }
  };

  return (
    <AuthContext.Provider value={{ role, user, loginAs, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
