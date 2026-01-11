import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";

type UserRole = "student" | "investor" | null;

interface AuthContextType {
  user: ReturnType<typeof useUser>["user"];
  isSignedIn: boolean;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  syncUser: (role?: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Sync user role (will sync to database if VITE_API_URL is set)
  const syncUser = useCallback(async (role?: UserRole) => {
    if (!user) return;

    try {
      // Get role from Clerk metadata or passed parameter
      const roleToUse = role || (user.unsafeMetadata?.role as UserRole) || (user.publicMetadata?.role as UserRole);

      if (roleToUse) {
        // Always set the role in state
        setUserRole(roleToUse);
        
        // Try to sync to database if API is configured
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl) {
          try {
            const { createOrUpdateUser } = await import("@/lib/database");
            await createOrUpdateUser({
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress || "",
              full_name: user.fullName || user.firstName || "",
              role: roleToUse,
              avatar_url: user.imageUrl,
            });
          } catch (dbError) {
            console.error("Error syncing to database:", dbError);
            // Don't fail - role is already set from Clerk metadata
          }
        }
      }
    } catch (error) {
      console.error("Error syncing user:", error);
    }
  }, [user]);

  // Fetch user role from Clerk metadata on mount
  useEffect(() => {
    const fetchRole = async () => {
      if (!isLoaded) {
        return;
      }
      
      if (!isSignedIn || !user) {
        setRoleLoading(false);
        return;
      }

      try {
        // Get role from Clerk metadata
      const clerkRole = user.publicMetadata?.role as UserRole;

        
        if (clerkRole) {
          setUserRole(clerkRole);
          
          // Optionally sync to database if API is configured
          const apiUrl = import.meta.env.VITE_API_URL;
          if (apiUrl) {
            try {
              const { createOrUpdateUser } = await import("@/lib/database");
              await createOrUpdateUser({
                clerk_id: user.id,
                email: user.primaryEmailAddress?.emailAddress || "",
                full_name: user.fullName || user.firstName || "",
                role: clerkRole,
                avatar_url: user.imageUrl,
              });
            } catch (dbError) {
              console.error("Error syncing to database:", dbError);
            }
          }
        } else {
          // Try to get from database if API is configured and no Clerk role
          const apiUrl = import.meta.env.VITE_API_URL;
          if (apiUrl) {
            try {
              const { getUserRole } = await import("@/lib/database");
              const dbRole = await getUserRole(user.id);
              if (dbRole) {
                setUserRole(dbRole);
              }
            } catch (dbError) {
              console.error("Error fetching from database:", dbError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRole();
  }, [isLoaded, isSignedIn, user]);

  const signOut = async () => {
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
