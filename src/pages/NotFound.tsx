
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="max-w-md w-full text-center p-8">
          <h1 className="text-6xl font-bold text-pink-DEFAULT mb-4">404</h1>
          <p className="text-xl text-gray-300 mb-6">Oops! Page not found</p>
          <Button asChild className="bg-pink-transparent hover:bg-pink-hover border border-pink-pastel shine-effect">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default NotFound;
