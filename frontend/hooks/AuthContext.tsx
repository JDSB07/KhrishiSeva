"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../services/api";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "aew" | "officer" | "farmer";
  district: string;
  policyId?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string, role: string) => Promise<User>;
  signup: (data: any) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Fetch fresh user data from API
          const response = await api.get("/auth/me");
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string, role: string): Promise<User> => {
    try {
      const response = await api.post("/auth/login", { phone, password, role });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);

      // Redirect based on role
      if (newUser.role === "aew") router.push("/aew");
      else if (newUser.role === "officer") router.push("/officer");
      else if (newUser.role === "farmer") router.push("/farmer");

      return newUser;
    } catch (error: any) {
      throw error.response?.data?.message || "Login failed";
    }
  };

  const signup = async (data: any): Promise<User> => {
    try {
      const response = await api.post("/auth/signup", data);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);

      // Redirect based on role
      if (newUser.role === "aew") router.push("/aew");
      else if (newUser.role === "officer") router.push("/officer");
      else if (newUser.role === "farmer") router.push("/farmer");

      return newUser;
    } catch (error: any) {
      throw error.response?.data?.message || "Registration failed";
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
