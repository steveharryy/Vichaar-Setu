import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type Role = "student" | "investor";

/**
 * Centralized auth + role guard.
 * - Prevents dashboard components from getting stuck in infinite spinners.
 * - If user is signed in but has no persisted role yet, it routes them through /auth/callback
 *   to finalize role persistence.
 */
export default function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const location = useLocation();
  const { user, isSignedIn, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Signed in, but role not persisted (publicMetadata.role missing)
  if (userRole === null) {
    return <Navigate to="/auth/callback" replace />;
  }

  // Wrong dashboard for role
  if (userRole !== role) {
    return <Navigate to={userRole === "student" ? "/student-dashboard" : "/investor-dashboard"} replace />;
  }

  return <>{children}</>;
}
