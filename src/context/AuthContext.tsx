import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "citizen" | "admin";
  token: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUser = localStorage.getItem("user");
      console.log("AuthContext: Checking localStorage for user", storedUser ? "Found" : "Not found");
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("AuthContext: Found user in localStorage:", parsedUser);
          
          // Validate user object has at least an ID and token
          if (parsedUser && parsedUser._id && parsedUser.token) {
            setUser(parsedUser);
            
            // Refresh user data from server to get latest info (like createdAt)
            try {
              console.log("AuthContext: Refreshing user profile from server...");
              const { data } = await api.get("/auth/profile");
              console.log("AuthContext: Received profile data from server:", data);
              const updatedUser = { ...parsedUser, ...data };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              console.log("AuthContext: User profile refreshed from server successfully");
            } catch (err: any) {
              console.error("AuthContext: Error refreshing user profile:", err.response?.data || err.message);
              // If token is invalid, logout
              if (err.response?.status === 401) {
                console.warn("AuthContext: Token failed, logging out");
                logout();
              }
            }
          } else {
            console.warn("AuthContext: Stored user object is invalid, clearing localStorage");
            localStorage.removeItem("user");
            setUser(null);
          }
        } catch (e) {
          console.error("AuthContext: Error parsing user from localStorage", e);
          localStorage.removeItem("user");
          setUser(null);
        }
      } else {
        console.log("AuthContext: No user found in localStorage");
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = (userData: User) => {
    console.log("AuthContext: Logging in user", userData.name);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
