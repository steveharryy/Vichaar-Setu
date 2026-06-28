import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="glass-card rounded-2xl p-8 text-center max-w-lg w-full">
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>

        <div className="mb-6 text-sm text-muted-foreground">
          <div className="font-medium text-foreground mb-1">Current URL</div>
          <code className="block whitespace-pre-wrap break-all rounded-xl bg-secondary px-3 py-2">
            {location.pathname}
            {location.search}
            {location.hash}
          </code>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Return to Home
          </Link>
          <Link to="/auth?mode=sign-in" className="text-primary underline hover:text-primary/90">
            Go to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
