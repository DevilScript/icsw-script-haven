
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import ScriptPage from "./pages/ScriptPage";
import StorePage from "./pages/StorePage";
import SupportPage from "./pages/SupportPage";
import TopupPage from "./pages/TopupPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#1a1a1f]">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">ICS</span>
            <span className="text-pink-DEFAULT animate-glow">W</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent mx-auto my-4"></div>
          <p className="text-gray-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/script" element={<ScriptPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/topup" element={<TopupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
