/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { createOrUpdateUser } from "@/lib/database";
import { syncClerkUserToSupabase } from "@/lib/supabase-db";

type UserRole = "student" | "investor" | null;

interface AuthContextType {
  user: any;
  isSignedIn: boolean;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  syncUser: (role: UserRole) => Promise<void>;
  mockSignIn?: (role: "student" | "investor", email?: string, name?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Detect if we should use local Mock Auth Mode
export const isMockMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === 'pk_test_Y2xlcmsubW9jay5kZXYk';

// Provider that handles local testing auth
const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  const [mockUser, setMockUser] = useState<any>(() => {
    const saved = localStorage.getItem("vs_mock_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mockUser) {
      setUserRole(mockUser.role);
    } else {
      setUserRole(null);
    }
  }, [mockUser]);

  const syncUser = useCallback(async (role: UserRole) => {
    if (!mockUser || !role) return;
    const updatedUser = { ...mockUser, role };
    localStorage.setItem("vs_mock_user", JSON.stringify(updatedUser));
    setMockUser(updatedUser);
    setUserRole(role);

    try {
      await syncClerkUserToSupabase({
        clerkId: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: role,
        avatarUrl: mockUser.imageUrl
      });
    } catch(e) {
      console.warn("Mock sync to Supabase failed:", e);
    }
  }, [mockUser]);

  const signOut = async () => {
    console.log("MockAuth: Signing out");
    localStorage.removeItem("vs_mock_user");
    setMockUser(null);
    setUserRole(null);
  };

  const mockSignIn = (role: "student" | "investor", email = "", name = "") => {
    const defaultEmail = email || `${role}@example.com`;
    const defaultName = name || (role === "student" ? "Jane Student" : "John Investor");
    const newUser = {
      id: `mock_${role}_${Math.random().toString(36).substr(2, 9)}`,
      fullName: defaultName,
      email: defaultEmail,
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName}`,
      role: role
    };
    localStorage.setItem("vs_mock_user", JSON.stringify(newUser));
    setMockUser(newUser);
    setUserRole(role);
  };

  const userObj = mockUser ? {
    id: mockUser.id,
    fullName: mockUser.fullName,
    firstName: mockUser.fullName?.split(" ")[0] || "User",
    imageUrl: mockUser.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mockUser.fullName}`,
    primaryEmailAddress: { emailAddress: mockUser.email },
    publicMetadata: { role: mockUser.role },
    reload: async () => {},
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user: userObj,
        isSignedIn: !!mockUser,
        userRole,
        loading,
        signOut,
        syncUser,
        mockSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Provider that handles Clerk Live Auth
const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Sync user role - sets local state and optionally syncs to database
  const syncUser = useCallback(async (role: UserRole) => {
    if (!user || !role) return;

    console.log("ClerkAuth: syncUser called with role:", role);

    setUserRole(role);
    setRoleLoading(false);

    // Dual Sync to databases
    try {
      // 1. Sync to Supabase
      await syncClerkUserToSupabase({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        fullName: user.fullName || user.firstName || "",
        role: role,
        avatarUrl: user.imageUrl,
      });
      console.log("ClerkAuth: Synced user to Supabase");

      // 2. Sync to Neon (if API is configured)
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        await createOrUpdateUser({
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          full_name: user.fullName || user.firstName || "",
          role: role,
          avatar_url: user.imageUrl,
        });
        console.log("ClerkAuth: Synced user to Neon");
      }
    } catch (syncError) {
      console.error("ClerkAuth: Error syncing to databases:", syncError);
    }
  }, [user]);

  // On mount/user change: role comes ONLY from Clerk publicMetadata.role
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    const role = user.publicMetadata?.role as UserRole;
    console.log("ClerkAuth: Initializing with metadata role:", role);

    setUserRole(role ?? null);
    setRoleLoading(false);

    // If role exists, ensure databases are synced with latest profile info
    if (role) {
      syncUser(role);
    }
  }, [isLoaded, isSignedIn, user, syncUser]);

  const signOut = async () => {
    console.log("ClerkAuth: Signing out");
    setUserRole(null);
    await clerkSignOut();
  };

  const loading = !isLoaded || roleLoading;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isSignedIn: isSignedIn ?? false,
        userRole,
        loading,
        signOut,
        syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (isMockMode) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
};
