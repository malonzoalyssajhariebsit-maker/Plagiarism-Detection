import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
const NotFound = () => {
  const [location] = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location);
  }, [location]);
  return <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-foreground" data-testid="text-404">404</h1>
        <p className="mb-6 text-2xl text-muted-foreground" data-testid="text-not-found">Oops! Page not found</p>
        <Button asChild data-testid="button-home">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>;
};
export default NotFound;