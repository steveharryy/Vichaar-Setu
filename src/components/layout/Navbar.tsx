import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn, userRole } = useAuth();

  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/featured", label: "Featured" },
    { href: "/categories", label: "Categories" },
  ];

  const isActive = (path: string) => location.pathname === path;


const getDashboardLink = () => {
  if (!isSignedIn) return "/auth";

  if (userRole === "investor") {
    return "/investor-dashboard";
  }

  return "/student-dashboard"; // default for logged-in users
};




  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl border-b border-border/40" />
      
      <div className="container relative flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src={logo} 
            alt="Vichaar Setu" 
            className="h-10 w-10 object-contain rounded-lg"
          />
          <span className="font-display text-lg font-semibold tracking-tight hidden sm:block">
            Vichaar Setu
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center bg-secondary/50 rounded-full p-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                  isActive(link.href)
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {isSignedIn ? (
            <Button 
              variant="default" 
              size="sm" 
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 group"
            >
              <Link to={getDashboardLink()} className="gap-1.5">
                Dashboard
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 group"
              >
                <Link to="/auth" className="gap-1.5">
                  Get Started
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-2xl border-b border-border animate-fade-in">
          <nav className="container py-6 flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-base font-medium transition-colors animate-fade-up",
                  isActive(link.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-3 border-border/50" />
            {isSignedIn ? (
              <Link
                to={getDashboardLink()}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium bg-primary text-primary-foreground animate-fade-up"
                style={{ animationDelay: '0.2s' }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-base font-medium bg-primary text-primary-foreground animate-fade-up"
                style={{ animationDelay: '0.2s' }}
              >
                Get Started
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;