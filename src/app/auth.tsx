import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type UserRole, type UserProfile, MOCK_USERS } from "../types/user";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  /** Current active role (switchable in demo mode) */
  role: UserRole;
  setRole: (role: UserRole) => void;
  /** Current user profile based on active role */
  user: UserProfile;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CREDENTIALS = {
  username: "admin",
  password: "270825",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [role, setRoleState] = useState<UserRole>("diplomiert");

  const login = useCallback((username: string, password: string): boolean => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    // Clear Anna caches so she re-generates with the new role context
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("anna_")) {
        sessionStorage.removeItem(key);
      }
    }
  }, []);

  const user = MOCK_USERS[role];

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, role, setRole, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCurrentRole(): UserRole {
  return useAuth().role;
}

export function useCurrentUser(): UserProfile {
  return useAuth().user;
}
