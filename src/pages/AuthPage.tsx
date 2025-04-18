
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
  const { user, login } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: 'https://ifmrpxcnhebocyvcbcpn.supabase.co/auth/v1/callback'
        }
      });
      
      if (error) {
        console.error("Discord login error:", error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
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
            className="button-3d px-6 py-6 text-lg rounded-md shine-effect w-full"
            onClick={() => setIsDialogOpen(true)}
          >
            Login with Discord
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
              className="button-3d shine-effect w-full bg-[#5865F2] hover:bg-[#4752c4]"
            >
              Authorize with Discord
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AuthPage;
