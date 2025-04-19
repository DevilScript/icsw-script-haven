
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "./lib/auth";
import Index from "./pages/Index";
import ScriptPage from "./pages/ScriptPage";
import StorePage from "./pages/StorePage";
import TopupPage from "./pages/TopupPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import HistoryPage from "./pages/HistoryPage";
import ResetHWIDPage from "./pages/ResetHWIDPage";
import AuthCallback from "./pages/AuthCallback";

// Create a persistent query client with improved cache settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000, // Consider data fresh for 1 minute
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    },
  },
});

// RouteGuard component to check authentication and fetch user data when needed
const RouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { loadUser, user } = useAuthStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadUser();
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    initializeAuth();
  }, [loadUser]);

  // Add event listener for route changes to update user data
  useEffect(() => {
    if (isLoaded && location.pathname !== '/auth' && location.pathname !== '/auth/callback') {
      // Check if user data exists and trigger a refresh if needed
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['storeItems'] });
      }
    }
  }, [location.pathname, isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#151518]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">ICS</span>
            <span className="text-[rgb(255,179,209)] pink-glow animate-glow">W</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent mx-auto my-4"></div>
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/script" element={<ScriptPage />} />
              <Route path="/store" element={<StorePage />} />
              <Route path="/topup" element={<TopupPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/reset-hwid" element={<ResetHWIDPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RouteGuard>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
