import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import StartupDetail from "./pages/StartupDetail";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Featured from "./pages/Featured";
import Categories from "./pages/Categories";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import StudentDashboard from "./pages/StudentDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import About from "./pages/About";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const MissingClerkKey = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-xl">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3 text-white">Configuration Required</h1>
      <p className="text-gray-300 mb-4">
        Missing <code className="px-2 py-1 rounded bg-gray-700 text-red-400 font-mono text-sm">VITE_CLERK_PUBLISHABLE_KEY</code>
      </p>
      <p className="text-gray-400 text-sm">
        Add this environment variable to your Vercel project settings and redeploy.
      </p>
    </div>
  </div>
);

const App = () =>{
  const navigate = useNavigate();
 return CLERK_PUBLISHABLE_KEY ? (
   <ClerkProvider
  publishableKey={CLERK_PUBLISHABLE_KEY}
  routerPush={(to) => navigate(to)}
  routerReplace={(to) => navigate(to, { replace: true })}
>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/startup/:id" element={<StartupDetail />} />
                <Route path="/submit" element={<Submit />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/featured" element={<Featured />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<Categories />} />
                <Route path="/search" element={<Explore />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                <Route
                  path="/student-dashboard"
                  element={
                    <ProtectedRoute role="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/investor-dashboard"
                  element={
                    <ProtectedRoute role="investor">
                      <InvestorDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ClerkProvider>
  ) : (
    <MissingClerkKey />
  );
};
export default App;

