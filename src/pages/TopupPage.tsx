
import { useState } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Gift
} from "lucide-react";

const TopupPage = () => {
  const { user, updateUserData } = useAuthStore();
  const { toast } = useToast();
  
  const [voucherLink, setVoucherLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const handleVoucherLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoucherLink(e.target.value);
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");
  };
  
  const extractVoucherCode = (link: string) => {
    try {
      // Extract the voucher code from the TrueMoney link
      // Example: https://gift.truemoney.com/campaign/?v=abc123def456ghi789
      const url = new URL(link);
      const params = new URLSearchParams(url.search);
      const voucherCode = params.get("v");
      
      if (!voucherCode) {
        throw new Error("Invalid voucher link format");
      }
      
      return voucherCode;
    } catch (error) {
      throw new Error("Invalid voucher link. Please check the format.");
    }
  };
  
  const handleTopup = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to topup your account"
      });
      return;
    }
    
    if (!voucherLink.trim()) {
      setErrorMessage("Please enter a valid TrueMoney Wallet Gift voucher link");
      return;
    }
    
    setIsProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const voucherCode = extractVoucherCode(voucherLink);
      
      // Use our Supabase Edge Function to handle TrueMoney redemption
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/truemoney-redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          voucher_code: voucherCode
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Topup API error:", errorData);
        throw new Error(errorData.message || "Failed to redeem voucher. Please check if the voucher is valid and not already used.");
      }
      
      const data = await response.json();
      console.log("TrueMoney redeem response:", data);
      
      // Extract amount from response
      const amount = data.amount || 0;
      
      if (amount <= 0) {
        throw new Error("Invalid voucher amount");
      }
      
      // Update user balance in Supabase
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amount;
      
      const { error: balanceError } = await supabase
        .from("user_id")
        .update({ balance: newBalance })
        .eq("username", user.username);
        
      if (balanceError) throw balanceError;
      
      // Log the transaction
      await supabase.from("balance_log").insert({
        username: user.username,
        amount: amount,
        success: true
      });
      
      // Refresh user data to update the displayed balance
      await updateUserData();
      
      // Show success message
      setSuccessMessage(`Successfully added ${amount} THB to your account!`);
      toast({
        title: "Top-up Successful",
        description: `${amount} THB has been added to your account`,
      });
      
      // Clear the input
      setVoucherLink("");
      
    } catch (error) {
      console.error("Topup error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to process voucher");
      
      toast({
        variant: "destructive",
        title: "Topup Failed",
        description: error instanceof Error ? error.message : "An error occurred during topup"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <GlassCard className="p-6">
          <div className="flex items-center mb-6">
            <Wallet className="h-6 w-6 text-pink-DEFAULT mr-2" />
            <h1 className="text-2xl font-bold">TrueMoney Wallet Topup</h1>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-pink-transparent/10 to-purple-600/10 p-4 rounded-lg border border-pink-DEFAULT/20">
              <p className="text-gray-300">
                Enter your TrueMoney Wallet Gift voucher link below to add funds to your account.
              </p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Voucher Link
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="https://gift.truemoney.com/campaign/?v=..." 
                    className="pl-10 bg-black/30 border-gray-700 focus:border-pink-DEFAULT focus:ring-pink-DEFAULT/20" 
                    value={voucherLink}
                    onChange={handleVoucherLinkChange}
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  onClick={handleTopup}
                  disabled={isProcessing || !voucherLink.trim() || !user}
                  className="bg-gray-800 hover:bg-gray-700 text-white shadow-lg hover:scale-105 transition-all duration-200"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Topup"
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Example: https://gift.truemoney.com/campaign/?v=abc123def456ghi789
              </p>
            </div>
            
            {errorMessage && (
              <div className="bg-red-900/20 border border-red-800/30 p-3 rounded flex items-start animate-fade-in">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-900/20 border border-green-800/30 p-3 rounded flex items-start animate-fade-in">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-green-200 text-sm">{successMessage}</p>
              </div>
            )}
            
            {!user && (
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-400">Login Required</h4>
                    <p className="text-gray-300 text-sm mt-1">
                      You need to be logged in to topup your account.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button 
                    asChild
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/20"
                  >
                    <a href="/auth">Login Now</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium mb-4">How to Get TrueMoney Gift</h3>
            <ol className="space-y-3 text-gray-300 list-decimal pl-5">
              <li>Open the TrueMoney Wallet app on your mobile device</li>
              <li>Select the "Gift" option</li>
              <li>Enter the amount you want to topup</li>
              <li>Select "Create Gift Link" and share it with us</li>
              <li>Paste the gift link in the field above and click "Topup"</li>
            </ol>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default TopupPage;
