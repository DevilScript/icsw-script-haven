
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, CreditCard, Key, ShoppingBag, AlertCircle } from "lucide-react";

const ProfilePage = () => {
  const { user, isLoading, login, logout, loadUser } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [discordUsername, setDiscordUsername] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
  }, [user]);

  const fetchPurchaseHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("buy_log")
        .select("*")
        .eq("discord_username", user?.discord_username)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setPurchaseHistory(data || []);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
    }
  };

  const handleLogin = async () => {
    if (!discordUsername) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your Discord username"
      });
      return;
    }
    
    // Validate Discord username format (username#1234)
    // Simple validation - in a real app, you'd want more robust validation
    if (!discordUsername.includes('#')) {
      toast({
        variant: "destructive",
        title: "Invalid Format",
        description: "Please enter your Discord username in the format username#1234"
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      const success = await login(discordUsername);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${discordUsername}`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Unable to login with the provided credentials"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "An error occurred during login"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out"
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Profile
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-DEFAULT" />
          </div>
        ) : user ? (
          <div className="space-y-8">
            <GlassCard className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-DEFAULT to-purple-500 flex items-center justify-center text-3xl font-bold">
                  {user.discord_username.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2">{user.discord_username}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-black/30 p-4 rounded-md border border-pink-pastel">
                      <p className="text-sm text-gray-400">Balance</p>
                      <p className="text-3xl font-semibold text-pink-DEFAULT flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        {user.balance || 0} <span className="text-sm ml-1">Credits</span>
                      </p>
                    </div>
                    
                    {user.key && (
                      <div className="bg-black/30 p-4 rounded-md border border-pink-pastel">
                        <p className="text-sm text-gray-400">Your Key</p>
                        <p className="text-lg font-mono break-all flex items-center">
                          <Key className="mr-2 h-4 w-4 text-pink-DEFAULT flex-shrink-0" />
                          {user.key}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-transparent border-pink-pastel hover:bg-pink-transparent"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
              
              {user.maps && user.maps.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Your Purchased Maps</h3>
                  <div className="flex flex-wrap gap-3">
                    {user.maps.map((map, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1 bg-pink-transparent text-white rounded-full border border-pink-pastel"
                      >
                        {map}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
            
            {purchaseHistory.length > 0 && (
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-pink-DEFAULT" />
                  Purchase History
                </h3>
                
                <div className="space-y-3">
                  {purchaseHistory.map((purchase, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-black/30 rounded-md border border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-pink-DEFAULT">{purchase.map_name}</h4>
                        <div>
                          <span className="px-2 py-1 bg-black/50 rounded-full text-xs">
                            {purchase.price} Credits
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        {new Date(purchase.created_at).toLocaleString()}
                      </p>
                      
                      <div className="text-sm text-gray-300 flex items-center">
                        <Key className="mr-1 h-4 w-4" />
                        <span className="font-mono">{purchase.key}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        ) : (
          <GlassCard className="max-w-lg mx-auto">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Login to Your Account</h2>
                <p className="text-gray-400">
                  Use your Discord username to access your scripts and manage your account
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Discord Username</label>
                <Input
                  type="text"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  placeholder="username#1234"
                  className="bg-black/30 border-pink-pastel focus:ring-pink-DEFAULT"
                />
              </div>
              
              <Button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-pink-transparent hover:bg-pink-hover border border-pink-pastel shine-effect"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              
              <div className="pt-4 text-center">
                <div className="flex items-center justify-center text-sm text-gray-400 space-x-2">
                  <AlertCircle size={14} />
                  <span>No registration needed, just enter your Discord username</span>
                </div>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;
