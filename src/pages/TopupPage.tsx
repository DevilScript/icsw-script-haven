
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendDiscordWebhook } from "@/lib/webhook";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CreditCard, 
  AlertCircle,
  Check
} from "lucide-react";

const TopupPage = () => {
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const { toast } = useToast();
  const [walletUrl, setWalletUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  
  useEffect(() => {
    loadUser();
    if (user) {
      fetchTopupHistory();
    }
  }, [user]);

  const fetchTopupHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("balance_log")
        .select("*")
        .eq("username", user.username)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      setTopupHistory(data || []);
    } catch (error) {
      console.error("Error fetching topup history:", error);
    }
  };

  const handleTopup = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please login before topping up"
      });
      return;
    }
    
    if (!walletUrl) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your TrueMoney Wallet URL"
      });
      return;
    }
    
    // Check if it's a valid TrueMoney Wallet URL
    if (!walletUrl.includes("wallet.truemoney.com/payment")) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid TrueMoney Wallet gift URL"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Extract amount from URL (in a real system this would be done server-side)
      // This is a mock implementation - in a real scenario you'd verify this server-side
      const mockAmount = Math.floor(Math.random() * 500) + 50;
      const creditAmount = mockAmount; // 1:1 ratio for simplicity
      
      // Update user balance
      const { error: updateError } = await supabase
        .from("user_id")
        .update({
          balance: (user.balance || 0) + creditAmount
        })
        .eq("username", user.username);
        
      if (updateError) throw updateError;
      
      // Log the topup
      const { error: logError } = await supabase
        .from("balance_log")
        .insert([{
          username: user.username,
          amount: creditAmount,
          wallet_url: walletUrl,
          success: true
        }]);
        
      if (logError) throw logError;
      
      // Send webhook notification
      await sendDiscordWebhook(
        "Topup Successful", 
        {
          "Discord User": user.username,
          "Amount": creditAmount,
          "Wallet URL": walletUrl
        }
      );
      
      // Refresh user data and topup history
      await loadUser();
      await fetchTopupHistory();
      
      toast({
        title: "Topup Successful!",
        description: `${creditAmount} credits have been added to your account.`
      });
      
      setWalletUrl("");
    } catch (error) {
      console.error("Topup error:", error);
      toast({
        variant: "destructive",
        title: "Topup Failed",
        description: "An error occurred while processing your payment."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Topup Credits
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GlassCard className="mb-8">
              <h2 className="text-xl font-semibold mb-6">TrueMoney Wallet Topup</h2>
              
              {user ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Current Balance</label>
                    <div className="px-4 py-2 bg-black/30 rounded-md border border-pink-pastel">
                      <span className="text-2xl font-semibold text-pink-DEFAULT">{user.balance || 0}</span> Credits
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter TrueMoney Wallet URL</label>
                    <Input
                      type="text"
                      value={walletUrl}
                      onChange={(e) => setWalletUrl(e.target.value)}
                      placeholder="https://wallet.truemoney.com/payment/?v=xxx"
                      className="bg-black/30 border-pink-pastel focus:ring-pink-DEFAULT mb-2"
                    />
                    <p className="text-xs text-gray-400">
                      Paste the TrueMoney Wallet gift URL you received
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleTopup}
                    disabled={isProcessing || !walletUrl}
                    className="w-full bg-pink-transparent hover:bg-pink-hover border border-pink-pastel shine-effect"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Topup Now
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center p-5 bg-black/40 rounded-md text-pink-DEFAULT border border-pink-pastel">
                  <AlertCircle size={18} className="mr-2" />
                  Please login to topup your account
                </div>
              )}
            </GlassCard>
            
            {user && topupHistory.length > 0 && (
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Recent Topup History</h3>
                <div className="space-y-2">
                  {topupHistory.map((log, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-black/30 rounded-md border border-gray-700 flex justify-between"
                    >
                      <div>
                        <p className="text-sm text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                        <p className="text-pink-DEFAULT font-medium">
                          {log.amount} Credits
                        </p>
                      </div>
                      <div className="flex items-center">
                        {log.success ? (
                          <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs border border-green-900 flex items-center">
                            <Check size={12} className="mr-1" /> 
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-900">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
          
          <div className="md:col-span-1">
            <GlassCard className="md:h-full">
              <h3 className="text-lg font-semibold mb-4">How to Topup</h3>
              <ol className="space-y-4 text-gray-300">
                <li className="flex items-start">
                  <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
                  <span>Open your TrueMoney Wallet app</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
                  <span>Select "Send Gift" and choose the amount</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
                  <span>Copy the generated gift URL</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span>
                  <span>Paste the URL here and click Topup</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">5</span>
                  <span>Credits will be added to your account upon verification</span>
                </li>
              </ol>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-pink-DEFAULT font-medium mb-2">Credits to THB Ratio</h4>
                <p className="text-gray-300">1 THB = 1 Credit</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TopupPage;
