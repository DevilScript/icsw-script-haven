
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Clock, 
  Copy, 
  Check,
  History as HistoryIcon,
  ShoppingCart,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HistoryItem {
  id: number;
  timestamp: string;
  map?: string;
  key?: string;
  price?: number;
  amount?: number;
  success: boolean;
  username: string;
}

const HistoryPage = () => {
  const { user, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  useEffect(() => {
    loadUser();
    if (user) {
      fetchHistory();
    }
  }, [user]);
  
  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch all history types in one query
      const [buyResponse, accessResponse, balanceResponse] = await Promise.all([
        // Purchase history
        supabase
          .from("buy_log")
          .select("*")
          .eq("username", user.username)
          .order("timestamp", { ascending: false }),
          
        // Script access history
        supabase
          .from("active_log")
          .select("*")
          .eq("username", user.username)
          .order("timestamp", { ascending: false }),
          
        // Balance topup history
        supabase
          .from("balance_log")
          .select("*")
          .eq("username", user.username)
          .order("timestamp", { ascending: false })
      ]);
      
      const buyData = buyResponse.data || [];
      const accessData = accessResponse.data || [];
      const balanceData = balanceResponse.data || [];
      
      // Combine all histories and sort by timestamp
      const combinedHistory = [
        ...buyData.map((item: any) => ({ ...item, type: 'buy' })),
        ...accessData.map((item: any) => ({ ...item, type: 'access' })),
        ...balanceData.map((item: any) => ({ ...item, type: 'balance' }))
      ].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setHistory(combinedHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your history"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    
    toast({
      title: "Copied!",
      description: "Key copied to clipboard"
    });
    
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'buy': 
        return <ShoppingCart className="h-5 w-5 text-pink-DEFAULT" />;
      case 'access': 
        return <Clock className="h-5 w-5 text-blue-400" />;
      case 'balance': 
        return <Wallet className="h-5 w-5 text-green-400" />;
      default: 
        return <HistoryIcon className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const getHistoryTitle = (item: any) => {
    switch (item.type) {
      case 'buy': 
        return `Purchased ${item.map}`;
      case 'access': 
        return `Used script for ${item.map}`;
      case 'balance': 
        return `Topup ${item.amount} THB`;
      default: 
        return "History Event";
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <GlassCard>
            <p className="text-xl text-gray-300">Please log in to view your history</p>
            <Button
              onClick={() => window.location.href = "/auth"}
              className="mt-6 button-3d shine-effect"
            >
              Go to Login
            </Button>
          </GlassCard>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-10">
        <GlassCard className="p-6">
          <div className="flex items-center mb-6">
            <HistoryIcon className="h-6 w-6 text-pink-DEFAULT mr-2" />
            <h2 className="text-2xl font-bold">History</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-pink-DEFAULT" />
                <p className="text-gray-400 mt-4">Loading your history...</p>
              </div>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item: any) => (
                <div 
                  key={`${item.type}-${item.id}`} 
                  className="history-item bg-black/20 p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className="h-10 w-10 rounded-full bg-gray-800/50 flex items-center justify-center mr-3">
                        {getHistoryIcon(item.type)}
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-medium text-white">{getHistoryTitle(item)}</h4>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(item.timestamp)}
                        </div>
                        
                        {/* Additional details based on type */}
                        {item.type === 'buy' && (
                          <div className="mt-2 text-sm">
                            <span className="text-gray-300">Price: </span>
                            <span className="text-pink-DEFAULT">{item.price} THB</span>
                          </div>
                        )}
                        
                        {item.type === 'balance' && (
                          <div className="mt-2 text-sm">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                            }`}>
                              {item.success ? 'Successful' : 'Failed'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Key display for buy and access types */}
                    {(item.type === 'buy' || item.type === 'access') && item.key && (
                      <div className="flex items-center">
                        <div className="text-xs bg-black/50 px-2 py-1 rounded mr-2 font-mono text-gray-300">
                          {item.key}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 hover:bg-pink-transparent"
                          onClick={() => handleCopyKey(item.key)}
                        >
                          {copiedKey === item.key ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-300" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800/30 rounded-full h-16 w-16 mx-auto flex items-center justify-center mb-4">
                <HistoryIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-300">No history found</h3>
              <p className="text-gray-400 mt-2">Your activity history will appear here</p>
            </div>
          )}
        </GlassCard>
      </div>
    </Layout>
  );
};

export default HistoryPage;
