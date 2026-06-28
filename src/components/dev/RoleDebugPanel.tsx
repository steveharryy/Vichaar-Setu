import { useUser } from "@clerk/clerk-react";
import { useAuth, isMockMode } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Bug, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Dev-only panel to debug Clerk role consistency.
 * Only renders in development mode and not in Mock Mode.
 */
const RoleDebugPanelContent = () => {
  const { user, isLoaded } = useUser();
  const { userRole, loading } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const publicRole = user?.publicMetadata?.role as string | undefined;
  const unsafeRole = user?.unsafeMetadata?.role as string | undefined;

  const currentDashboard = location.pathname.includes("student-dashboard")
    ? "student"
    : location.pathname.includes("investor-dashboard")
    ? "investor"
    : "none";

  const hasRoleMismatch =
    publicRole && unsafeRole && publicRole !== unsafeRole;
  const hasDashboardMismatch =
    publicRole && currentDashboard !== "none" && publicRole !== currentDashboard;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] p-2 rounded-full bg-amber-500 text-black shadow-lg hover:bg-amber-400 transition-colors"
        title="Open Role Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl text-xs font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-500 text-black">
        <div className="flex items-center gap-2 font-bold">
          <Bug className="h-4 w-4" />
          Role Debug (DEV)
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-amber-400 rounded"
          >
            {isMinimized ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-amber-400 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Loading State */}
          <div className="flex justify-between">
            <span className="text-zinc-400">Clerk Loaded:</span>
            <span className={isLoaded ? "text-green-400" : "text-yellow-400"}>
              {isLoaded ? "Yes" : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Auth Loading:</span>
            <span className={!loading ? "text-green-400" : "text-yellow-400"}>
              {loading ? "Yes" : "No"}
            </span>
          </div>

          <hr className="border-zinc-700" />

          {/* User Info */}
          <div className="flex justify-between">
            <span className="text-zinc-400">User ID:</span>
            <span className="text-zinc-200 truncate max-w-[140px]" title={user?.id}>
              {user?.id ?? "null"}
            </span>
          </div>

          <hr className="border-zinc-700" />

          {/* Role Sources */}
          <div className="space-y-2">
            <div className="text-zinc-500 uppercase tracking-wide">Role Sources</div>

            <div className="flex justify-between">
              <span className="text-zinc-400">publicMetadata.role:</span>
              <span className={publicRole ? "text-green-400 font-bold" : "text-red-400"}>
                {publicRole ?? "undefined"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">unsafeMetadata.role:</span>
              <span className={unsafeRole ? "text-blue-400" : "text-zinc-500"}>
                {unsafeRole ?? "undefined"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">AuthContext.userRole:</span>
              <span className={userRole ? "text-purple-400 font-bold" : "text-red-400"}>
                {userRole ?? "null"}
              </span>
            </div>
          </div>

          <hr className="border-zinc-700" />

          {/* Current Route */}
          <div className="flex justify-between">
            <span className="text-zinc-400">Current Route:</span>
            <span className="text-zinc-200 truncate max-w-[140px]">{location.pathname}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Detected Dashboard:</span>
            <span
              className={
                currentDashboard === "none"
                  ? "text-zinc-500"
                  : currentDashboard === "student"
                  ? "text-accent"
                  : "text-primary"
              }
            >
              {currentDashboard}
            </span>
          </div>

          {/* Warnings */}
          {(hasRoleMismatch || hasDashboardMismatch) && (
            <>
              <hr className="border-zinc-700" />
              <div className="space-y-1">
                {hasRoleMismatch && (
                  <div className="text-yellow-400 flex items-center gap-1">
                    ⚠️ publicMetadata ≠ unsafeMetadata
                  </div>
                )}
                {hasDashboardMismatch && (
                  <div className="text-red-400 flex items-center gap-1">
                    ❌ Dashboard mismatch with publicMetadata
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const RoleDebugPanel = () => {
  if (import.meta.env.PROD || isMockMode) return null;
  return <RoleDebugPanelContent />;
};

export default RoleDebugPanel;
