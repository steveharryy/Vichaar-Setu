import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import { GraduationCap, TrendingUp, Sparkles, ArrowRight, User, Mail, ShieldAlert } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth, isMockMode } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ROLE_STORAGE_KEY = "vs_signup_role";

type Role = "student" | "investor";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mockSignIn } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(() => {
    const saved = sessionStorage.getItem(ROLE_STORAGE_KEY);
    return saved === "student" || saved === "investor" ? saved : null;
  });

  // Custom mock signup state
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  // Keep UI in sync with URL so Clerk's built-in "Sign up" / "Sign in" links work.
  useEffect(() => {
    const mode = new URLSearchParams(location.search).get("mode");
    const nextIsSignUp = mode === "sign-up";

    setIsSignUp(nextIsSignUp);

    // Only clear role when leaving sign-up mode.
    if (!nextIsSignUp) {
      setSelectedRole(null);
      sessionStorage.removeItem(ROLE_STORAGE_KEY);
    }
  }, [location.search]);

  const handleDemoLogin = (role: Role) => {
    if (mockSignIn) {
      mockSignIn(role);
      navigate(role === "student" ? "/student-dashboard" : "/investor-dashboard");
    }
  };

  const handleCustomSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (mockSignIn) {
      mockSignIn(selectedRole, customEmail, customName);
      navigate(selectedRole === "student" ? "/student-dashboard" : "/investor-dashboard");
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <AnimatedBackground />

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <motion.div 
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-10 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-colors" />
              <img
                src={logo}
                alt="Vichaar Setu"
                className="h-12 w-12 object-contain rounded-xl relative"
              />
            </div>
            <span className="font-display text-xl font-bold">Vichaar Setu</span>
          </Link>

          <div className="mb-8">
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {isMockMode ? "Mock Developer Mode Active" : (isSignUp ? "Join the community" : "Welcome back")}
              </span>
            </motion.div>
            <h1 className="font-display text-4xl font-bold mb-3">
              {isSignUp ? (
                <>
                  Create your <span className="gradient-text">account</span>
                </>
              ) : (
                <>
                  Sign in to <span className="gradient-text">continue</span>
                </>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isSignUp
                ? "Join builders and investors shaping tomorrow"
                : "Access your dashboard and explore opportunities"}
            </p>
          </div>

          {/* Role Selection (Sign Up only) */}
          {isSignUp && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="label-mono mb-4 block">Select your role</span>
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setSelectedRole("student");
                    sessionStorage.setItem(ROLE_STORAGE_KEY, "student");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedRole === "student"
                      ? "border-accent bg-accent/10"
                      : "border-border/60 hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 transition-opacity ${
                    selectedRole === "student" ? "opacity-100" : "group-hover:opacity-50"
                  }`} style={{ background: 'var(--gradient-student)', opacity: 0.05 }} />
                  <div
                    className={`inline-flex p-3 rounded-xl mb-3 transition-all relative ${
                      selectedRole === "student" 
                        ? "bg-accent/20" 
                        : "bg-secondary group-hover:bg-accent/10"
                    }`}
                  >
                    <GraduationCap
                      className={`h-5 w-5 ${
                        selectedRole === "student" ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                      }`}
                    />
                  </div>
                  <p className="font-display font-semibold relative">Student</p>
                  <p className="text-sm text-muted-foreground mt-1 relative">Pitch your ideas</p>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setSelectedRole("investor");
                    sessionStorage.setItem(ROLE_STORAGE_KEY, "investor");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedRole === "investor"
                      ? "border-primary bg-primary/10"
                      : "border-border/60 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 transition-opacity ${
                    selectedRole === "investor" ? "opacity-100" : "group-hover:opacity-50"
                  }`} style={{ background: 'var(--gradient-investor)', opacity: 0.05 }} />
                  <div
                    className={`inline-flex p-3 rounded-xl mb-3 transition-all relative ${
                      selectedRole === "investor" 
                        ? "bg-primary/20" 
                        : "bg-secondary group-hover:bg-primary/10"
                    }`}
                  >
                    <TrendingUp
                      className={`h-5 w-5 ${
                        selectedRole === "investor" ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      }`}
                    />
                  </div>
                  <p className="font-display font-semibold relative">Investor</p>
                  <p className="text-sm text-muted-foreground mt-1 relative">Discover startups</p>
                </motion.button>
              </div>
              {isSignUp && !selectedRole && (
                <p className="text-sm text-warning mt-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                  Please select a role to continue
                </p>
              )}
            </motion.div>
          )}

          {/* Authentication Container */}
          <motion.div 
            className="auth-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isMockMode ? (
              /* Local Mock Auth UI */
              <div className="space-y-6">
                {isSignUp ? (
                  /* Custom Demo Account Sign Up Form */
                  selectedRole ? (
                    <form onSubmit={handleCustomSignUp} className="space-y-4 glass-card p-6 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <Label htmlFor="customName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="customName"
                            placeholder="Jane Doe"
                            className="pl-9"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customEmail">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="customEmail"
                            type="email"
                            placeholder="jane@example.com"
                            className="pl-9"
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-primary-gradient h-12 rounded-xl text-base font-semibold">
                        Sign up & Launch Dashboard
                      </Button>
                    </form>
                  ) : (
                    <div className="glass-card rounded-2xl p-8 text-center border border-border/50">
                      <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Select your role above to create a demo profile</p>
                    </div>
                  )
                ) : (
                  /* Sign In (Quick Demo Links) */
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => handleDemoLogin("student")}
                        className="flex items-center justify-between p-4 rounded-xl border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors w-full group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-accent/20 text-accent">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">Sign in as Demo Student</div>
                            <div className="text-xs text-muted-foreground">Submit startups & ideas</div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                      </button>

                      <button
                        onClick={() => handleDemoLogin("investor")}
                        className="flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors w-full group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/20 text-primary">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">Sign in as Demo Investor</div>
                            <div className="text-xs text-muted-foreground">Explore and upvote ventures</div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2.5">
                      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        <strong>Note:</strong> You are running in Mock Auth Mode because no Clerk publishable key is configured in your environment. Demo profiles will persist locally in your browser.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Live Clerk Authentication */
              isSignUp ? (
                selectedRole ? (
                  <SignUp
                    afterSignUpUrl="/auth/callback"
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "bg-transparent shadow-none p-0 gap-4",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton:
                          "glass-card !rounded-xl border-border/60 hover:bg-secondary/50 text-foreground font-medium h-12",
                        socialButtonsBlockButtonText: "font-medium",
                        formFieldInput:
                          "glass-card !rounded-xl border-border/60 text-foreground placeholder:text-muted-foreground h-12 px-4",
                        formFieldLabel: "text-foreground font-medium mb-2",
                        formButtonPrimary:
                          "!rounded-xl h-12 font-semibold text-base bg-primary-gradient hover:opacity-90 transition-opacity",
                        footerActionLink: "text-primary hover:text-primary/80 font-medium",
                        dividerLine: "bg-border",
                        dividerText: "text-muted-foreground bg-background px-4",
                        formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                        identityPreviewEditButton: "text-primary",
                        formResendCodeLink: "text-primary hover:text-primary/80",
                        otpCodeFieldInput: "glass-card !rounded-xl border-border/60",
                      },
                    }}
                    signInUrl="/auth?mode=sign-in"
                    unsafeMetadata={{ role: selectedRole }}
                  />
                ) : (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Select your role above to continue</p>
                  </div>
                )
              ) : (
                <SignIn
                  afterSignInUrl="/auth/callback"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none p-0 gap-4",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "glass-card !rounded-xl border-border/60 hover:bg-secondary/50 text-foreground font-medium h-12",
                      socialButtonsBlockButtonText: "font-medium",
                      formFieldInput:
                        "glass-card !rounded-xl border-border/60 text-foreground placeholder:text-muted-foreground h-12 px-4",
                      formFieldLabel: "text-foreground font-medium mb-2",
                      formButtonPrimary:
                        "!rounded-xl h-12 font-semibold text-base bg-primary-gradient hover:opacity-90 transition-opacity",
                      footerActionLink: "text-primary hover:text-primary/80 font-medium",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground bg-background px-4",
                      formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                      identityPreviewEditButton: "text-primary",
                      formResendCodeLink: "text-primary hover:text-primary/80",
                      otpCodeFieldInput: "glass-card !rounded-xl border-border/60",
                    },
                  }}
                  signUpUrl="/auth?mode=sign-up"
                />
              )
            )}
          </motion.div>

          <motion.div 
            className="mt-8 pt-6 border-t border-border/40 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  const nextIsSignUp = !isSignUp;
                  navigate(nextIsSignUp ? "/auth?mode=sign-up" : "/auth?mode=sign-in", { replace: true });
                }}
                className="text-foreground font-semibold hover:text-primary transition-colors inline-flex items-center gap-1"
              >
                {isSignUp ? "Sign in" : "Sign up"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-card/80 to-card/40 border-l border-border/40 p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <motion.div 
          className="max-w-lg relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="mb-10">
            <div className="badge-featured mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              Join 1,200+ founders
            </div>
            <h2 className="font-display text-5xl font-bold mb-6 leading-tight">
              Build the future,
              <br />
              <span className="gradient-text">together</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Whether you're launching your first startup or looking to invest in the next
              unicorn, Vichaar Setu connects visionaries with opportunities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { number: "89%", label: "Projects funded", sublabel: "Success rate" },
              { number: "$2.1M", label: "Total raised", sublabel: "This year" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="glass-card p-6 hover-lift"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="display-number gradient-text mb-1">
                  {stat.number}
                </div>
                <div className="font-medium">{stat.label}</div>
                <div className="label-mono mt-1">{stat.sublabel}</div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div 
            className="mt-10 pt-8 border-t border-border/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="label-mono mb-4">Trusted by students from</p>
            <div className="flex items-center gap-6 opacity-60">
              {["IIT Delhi", "IIT Bombay", "BITS", "NIT"].map((uni) => (
                <span key={uni} className="text-sm font-medium">{uni}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
