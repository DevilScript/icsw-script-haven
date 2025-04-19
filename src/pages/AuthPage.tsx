
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check for auth error in URL
    const url = new URL(window.location.href);
    const errorDescription = url.searchParams.get('error_description');
    
    if (errorDescription) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorDescription.replace(/\+/g, ' '),
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // If user is already logged in, redirect to home
    if (user) {
      navigate("/");
    }
  }, [user, navigate, toast]);
  
  const handleDiscordLogin = async () => {
    try {
      setIsLoading(true);
      // Open a popup window for Discord auth
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        'about:blank',
        'discord-login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Popup Blocked",
          description: "Please allow popups and try again",
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          skipBrowserRedirect: true, // Prevent main page redirection
          redirectTo: import.meta.env.VITE_SUPABASE_SITE_URL || 'http://localhost:5173/auth/callback',
          scopes: 'identify email',
        },
      });
      
      if (error) {
        setIsLoading(false);
        popup.close();
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return;
      }
      
      if (data?.url) {
        popup.location.href = data.url;
        
        // Check if popup is closed or redirected back
        const checkPopupClosed = setInterval(async () => {
          try {
            // Check if popup is still open
            if (popup.closed) {
              clearInterval(checkPopupClosed);
              setIsLoading(false);
              
              // Check for session after popup is closed
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                toast({
                  title: "Login Successful",
                  description: "You have been logged in successfully",
                });
                navigate('/');
              }
              return;
            }
            
            // Try to access popup location to see if it's completed auth
            // This will throw an error if popup is on a different domain
            const currentUrl = popup.location.href;
            
            // Check if the URL contains our callback
            if (currentUrl.includes('/auth/callback')) {
              clearInterval(checkPopupClosed);
              setIsLoading(false);
              
              // Close the popup immediately after successful authentication
              popup.close();
              
              // Check for session
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                toast({
                  title: "Login Successful",
                  description: "You have been logged in successfully",
                });
                navigate('/');
              }
            }
          } catch (e) {
            // Error accessing popup location - still on Discord domain
            console.log("Waiting for auth to complete...");
          }
        }, 500);
      } else {
        setIsLoading(false);
        popup.close();
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to initiate Discord login",
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An unexpected error occurred.",
      });
    }
  };
  
  return (
    <Layout>
      <div className="max-w-md mx-auto my-12">
        <GlassCard className="text-center py-10 feature-card">
          <h1 className="text-3xl font-bold mb-6">
            <span className="relative">
              Authentication
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
            </span>
          </h1>
          
          <p className="text-gray-300 mb-8">
            Login with your Discord account to access exclusive scripts and features.
          </p>
          
          <Button
            className="discord-button-3d px-6 py-6 text-lg rounded-md shine-effect w-full hover:scale-105 transition-transform duration-200"
            onClick={handleDiscordLogin}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Login with Discord"}
          </Button>
        </GlassCard>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1a1a1f] border border-pink-pastel help-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl text-pink-DEFAULT">Discord Authentication</DialogTitle>
            <DialogDescription className="text-gray-300">
              Connect your Discord account to continue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <p className="text-sm text-gray-400 mb-6">
              By connecting your Discord account, you'll be able to:
            </p>
            
            <ul className="space-y-2 text-sm text-gray-300 mb-6">
              <li className="flex items-center">
                <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                <span>Purchase and access premium scripts</span>
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                <span>Get support from our team</span>
              </li>
              <li className="flex items-center">
                <span className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></span>
                <span>Receive updates about new features</span>
              </li>
            </ul>
            
            <Button 
              onClick={handleDiscordLogin} 
              className="discord-button-3d w-full bg-[#5865F2] hover:bg-[#4752c4] hover:scale-105 transition-transform duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Authorize with Discord"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AuthPage;
