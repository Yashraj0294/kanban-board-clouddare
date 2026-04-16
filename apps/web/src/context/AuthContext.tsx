import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { IUser } from '@kanban-board/shared-types';

interface AuthUser extends IUser {}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isEditor: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): AuthUser {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { _id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    throw new Error('Invalid token');
  }
}

function getStoredUser(): { user: AuthUser; token: string } | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    return { user: decodeToken(token), token };
  } catch {
    localStorage.removeItem('token');
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = getStoredUser();
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [token, setToken] = useState<string | null>(stored?.token ?? null);

  const applyToken = useCallback((accessToken: string) => {
    localStorage.setItem('token', accessToken);
    const decoded = decodeToken(accessToken);
    setToken(accessToken);
    setUser(decoded);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string }>('/auth/login', { email, password });
    applyToken(res.data.accessToken);
  }, [applyToken]);

  const register = useCallback(async (email: string, password: string, role = 'viewer') => {
    const res = await api.post<{ accessToken: string }>('/auth/register', { email, password, role });
    applyToken(res.data.accessToken);
  }, [applyToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isEditor: user?.role === 'editor', login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
