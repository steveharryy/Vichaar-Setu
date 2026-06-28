import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Role = "student" | "investor";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { syncUser } = useAuth();
  const { user, isLoaded } = useUser();
  const { getToken } = useClerkAuth();

  const [status, setStatus] = useState("Loading...");
  const syncAttempted = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for Clerk to fully load
      if (!isLoaded) {
        setStatus("Loading authentication...");
        return;
      }

      // Not signed in - redirect to auth
      if (!user) {
        console.log("AuthCallback: No user, redirecting to /auth");
        navigate("/auth", { replace: true });
        return;
      }

      // Prevent duplicate attempts (Clerk can re-render callback)
      if (syncAttempted.current) return;
      syncAttempted.current = true;

      const publicRole = user.publicMetadata?.role as Role | undefined;
      const unsafeRole = user.unsafeMetadata?.role as Role | undefined;
      const sessionRoleRaw = sessionStorage.getItem("vs_signup_role") as Role | null;
      const sessionRole = sessionRoleRaw === "student" || sessionRoleRaw === "investor" ? sessionRoleRaw : undefined;

      console.log("AuthCallback: Roles detected", { publicRole, unsafeRole, sessionRole });

      // During sign-up, the chosen role lives in unsafeMetadata initially.
      // In some redirect flows, unsafeMetadata may be missing on the first load;
      // use sessionStorage as a last-resort source of truth to finalize persistence.
      const roleToPersist = unsafeRole ?? sessionRole;

      // We MUST persist role to publicMetadata via backend (always overwrite when we have a candidate).
      if (roleToPersist) {
        setStatus("Finalizing your account...");

        const synced = await persistRoleToClerkPublicMetadata(getToken, roleToPersist);
        if (synced) {
          try {
            await user.reload();
          } catch (e) {
            console.warn("AuthCallback: user.reload failed", e);
          }
        }
      }

      // After persistence attempt, prefer reloaded publicMetadata; fallback to role candidate.
      const role = (user.publicMetadata?.role as Role | undefined) ?? roleToPersist;

      if (!role) {
        console.log("AuthCallback: No role found anywhere; redirecting to sign-up");
        navigate("/auth?mode=sign-up", { replace: true });
        return;
      }

      await syncUser(role);

      // Clear signup role hint once role is persisted and context is synced.
      try {
        sessionStorage.removeItem("vs_signup_role");
      } catch {
        // ignore
      }

      console.log("AuthCallback: Redirecting to dashboard for role:", role);
      navigate(role === "investor" ? "/investor-dashboard" : "/student-dashboard", {
        replace: true,
      });
    };

    handleCallback();
  }, [getToken, isLoaded, navigate, syncUser, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

async function persistRoleToClerkPublicMetadata(
  getToken: () => Promise<string | null>,
  role: Role
): Promise<boolean> {
  const token = await getToken();
  if (!token) {
    console.warn("AuthCallback: Missing Clerk token, cannot persist role");
    return false;
  }

  // Prefer external API if configured; otherwise fall back to backend function.
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  try {
    if (apiUrl) {
      const res = await fetch(`${apiUrl}/api/sync-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error("AuthCallback: /api/sync-role failed", json);
        return false;
      }

      return true;
    }

    // Lovable Cloud fallback
    const { data, error } = await supabase.functions.invoke("sync-role", {
      body: { token, role },
    });

    if (error || !data?.success) {
      console.error("AuthCallback: sync-role function failed", error ?? data);
      return false;
    }

    return true;
  } catch (err) {
    console.error("AuthCallback: Exception persisting role:", err);
    return false;
  }
}


export default AuthCallback;
