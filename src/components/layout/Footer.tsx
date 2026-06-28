import { forwardRef, HTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { Github, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => {
    return (
      <footer ref={ref} className={`border-t border-border/50 bg-card/30 ${className || ""}`} {...props}>
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img 
                  src={logo} 
                  alt="Vichaar Setu" 
                  className="h-10 w-10 object-contain rounded-lg"
                />
                <span className="font-display text-lg font-bold">Vichaar Setu</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Where students pitch, investors discover, and ideas become ventures.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link></li>
                <li><Link to="/featured" className="hover:text-foreground transition-colors">Featured</Link></li>
                <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
                <li><Link to="/submit" className="hover:text-foreground transition-colors">Submit Startup</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">Guidelines</Link></li>
                <li><Link to="/" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
              <div className="flex gap-3 mt-6">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Vichaar Setu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export default Footer;
