
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Clock, 
  ArrowDownToLine, 
  Copy, 
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HistoryItem {
  id: number;
  timestamp: string;
  map: string;
  key: string;
  price?: number;
}

const HistoryPage = () => {
  const { user, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [buyHistory, setBuyHistory] = useState<HistoryItem[]>([]);
  const [accessHistory, setAccessHistory] = useState<HistoryItem[]>([]);
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
      // Fetch purchase history
      const { data: buyData, error: buyError } = await supabase
        .from("buy_log")
        .select("*")
        .eq("username", user.username)
        .order("timestamp", { ascending: false });
        
      if (buyError) throw buyError;
      
      // Fetch script access history
      const { data: accessData, error: accessError } = await supabase
        .from("active_log")
        .select("*")
        .eq("username", user.username)
        .order("timestamp", { ascending: false });
        
      if (accessError) throw accessError;
      
      setBuyHistory(buyData || []);
      setAccessHistory(accessData || []);
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
  
  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-6">
            <span className="relative">
              Account History
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
            </span>
          </h1>
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Account History
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-DEFAULT" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Purchase History */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <ArrowDownToLine className="mr-2 h-5 w-5 text-pink-DEFAULT" />
                Purchase History
              </h2>
              
              <GlassCard>
                {buyHistory.length > 0 ? (
                  <div className="space-y-3">
                    {buyHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="history-item"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <h4 className="text-lg font-medium text-pink-DEFAULT">{item.map}</h4>
                            <div className="flex items-center text-gray-400 text-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(item.timestamp)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium">{item.price} Credits</div>
                            <div className="flex items-center justify-end mt-1">
                              <div className="text-xs bg-black/30 px-2 py-1 rounded mr-2 font-mono text-gray-300">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No purchase history found
                  </div>
                )}
              </GlassCard>
            </section>
            
            {/* Access History */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-pink-DEFAULT" />
                Script Access History
              </h2>
              
              <GlassCard>
                {accessHistory.length > 0 ? (
                  <div className="space-y-3">
                    {accessHistory.map((item) => (
                      <div 
                        key={item.id} 
                        className="history-item"
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <h4 className="text-lg font-medium text-pink-DEFAULT">{item.map}</h4>
                            <div className="flex items-center text-gray-400 text-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(item.timestamp)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center justify-end mt-1">
                              <div className="text-xs bg-black/30 px-2 py-1 rounded mr-2 font-mono text-gray-300">
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No access history found
                  </div>
                )}
              </GlassCard>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;
