import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
const { user, isLoaded } = useUser();
const { isSignedIn } = useClerkAuth();
const { syncUser, loading } = useAuth();

  const ran = useRef(false);

useEffect(() => {
  if (!isLoaded || loading) return;

  if (!isSignedIn || !user) {
    navigate("/auth", { replace: true });
    return;
  }

  const run = async () => {
    try {
      // Get role ONLY from unsafe metadata
      const role = user.unsafeMetadata?.role as "student" | "investor" | undefined;

      if (!role) {
        navigate("/auth?mode=sign-up", { replace: true });
        return;
      }

      // Send to backend to persist
      await fetch("/api/sync-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role,
        }),
      });

      // Reload Clerk so publicMetadata is updated
      await user.reload();

      // Read final role
      const finalRole = user.publicMetadata?.role as "student" | "investor";

      if (!finalRole) {
        throw new Error("Role not saved to Clerk");
      }

      // Sync to your app DB
      await syncUser(finalRole);

      // Redirect
      navigate(
        finalRole === "student"
          ? "/student-dashboard"
          : "/investor-dashboard",
        { replace: true }
      );
    } catch (e) {
      console.error(e);
      navigate("/auth", { replace: true });
    }
  };

  run();
}, [isLoaded, loading, isSignedIn, user]);


  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallback;
