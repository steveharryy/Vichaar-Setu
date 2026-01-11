import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "student" | "investor";
}) => {
  const { isSignedIn, userRole, loading } = useAuth();

  if (loading) return null;

  if (!isSignedIn) return <Navigate to="/auth" replace />;

  if (role && userRole !== role) return <Navigate to="/auth" replace />;

  return children;
};
