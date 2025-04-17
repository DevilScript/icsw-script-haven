
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
  const [voucherUrl, setVoucherUrl] = useState("");
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
    
    if (!voucherUrl) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter your TrueMoney voucher URL"
      });
      return;
    }
    
    // Validate TrueMoney gift URL format
    const regex = /https:\/\/gift\.truemoney\.com\/campaign\/\?v=[a-zA-Z0-9]{18}/;
    if (!regex.test(voucherUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid TrueMoney voucher URL"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Extract voucher code from URL
      const voucherCode = voucherUrl.split('?v=')[1];
      
      // In a real implementation, this would call a server endpoint to redeem the voucher
      // For this mock implementation, we'll simulate a successful redemption
      
      // Mock implementation - would be replaced with actual API call
      const mockAmount = Math.floor(Math.random() * 500) + 50;
      const creditAmount = mockAmount;
      
      // In a real implementation, the server would make this call:
      // const response = await fetch(`https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`, {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     mobile: "0653835988",
      //     voucher_hash: voucherCode
      //   })
      // });
      
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
          wallet_url: voucherUrl,
          success: true
        }]);
        
      if (logError) throw logError;
      
      // Send webhook notification
      await sendDiscordWebhook(
        "Topup Successful", 
        {
          "Discord User": user.username,
          "Amount": creditAmount,
          "Voucher Code": voucherCode
        }
      );
      
      // Refresh user data and topup history
      await loadUser();
      await fetchTopupHistory();
      
      toast({
        title: "Topup Successful!",
        description: `${creditAmount} credits have been added to your account.`
      });
      
      setVoucherUrl("");
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
        
        <GlassCard className="mb-8 feature-card">
          <div className="space-y-6">
            {user ? (
              <>
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Your Current Balance</label>
                    <div className="px-6 py-4 bg-black/30 rounded-lg border-t border-b border-pink-pastel/20">
                      <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-DEFAULT to-pink-DEFAULT/70">{user.balance || 0}</span> 
                      <span className="ml-2 text-gray-300">Credits</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Enter TrueMoney Voucher URL</label>
                    <Input
                      type="text"
                      value={voucherUrl}
                      onChange={(e) => setVoucherUrl(e.target.value)}
                      placeholder="https://gift.truemoney.com/campaign/?v=..."
                      className="bg-black/30 border-pink-pastel/40 focus:border-pink-DEFAULT mb-2"
                    />
                    <p className="text-xs text-gray-400">
                      Paste the TrueMoney voucher URL (e.g., https://gift.truemoney.com/campaign/?v=abc123def456ghi789)
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleTopup}
                  disabled={isProcessing || !voucherUrl}
                  className={`button-3d shine-effect w-full md:w-auto md:ml-auto md:block ${
                    (!voucherUrl) ? 'disabled-element' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Redeem Voucher
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center p-5 bg-black/40 rounded-lg text-pink-DEFAULT border border-pink-pastel/30">
                <AlertCircle size={18} className="mr-2" />
                Please login to topup your account
              </div>
            )}
          </div>
        </GlassCard>
        
        {user && topupHistory.length > 0 && (
          <GlassCard className="feature-card">
            <h3 className="text-xl font-semibold mb-4 text-pink-DEFAULT">Recent Topup History</h3>
            <div className="space-y-2">
              {topupHistory.map((log, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-black/30 rounded-lg border-t border-b border-pink-pastel/20 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    <p className="text-pink-DEFAULT font-medium text-lg">
                      {log.amount} Credits
                    </p>
                  </div>
                  <div className="flex items-center">
                    {log.success ? (
                      <span className="px-3 py-1.5 bg-green-900/30 text-green-400 rounded-full text-xs border border-green-900/30 flex items-center">
                        <Check size={12} className="mr-1" /> 
                        Success
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-900/30">
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
    </Layout>
  );
};

export default TopupPage;
