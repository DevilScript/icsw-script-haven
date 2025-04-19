
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Clock, Package2, Wallet } from "lucide-react";
import { format, parseISO } from "date-fns";

// Type definitions
interface BuyLog {
  id: number;
  username: string;
  map: string;
  key: string;
  price: number;
  timestamp: string;
}

interface BalanceLog {
  id: number;
  username: string;
  amount: number;
  timestamp: string;
}

type HistoryItem = {
  type: 'purchase' | 'topup';
  timestamp: string;
  details: {
    map?: string;
    price?: number;
    amount?: number;
  };
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Fetch purchase history
  const { data: purchaseData, isLoading: isPurchaseLoading } = useQuery({
    queryKey: ["purchase-history"],
    queryFn: async () => {
      if (!user?.username) return [];
      
      const { data, error } = await supabase
        .from("buy_log")
        .select("*")
        .eq("username", user.username)
        .order("timestamp", { ascending: false });
      
      if (error) {
        console.error("Error fetching purchase history:", error);
        return [];
      }
      
      return data as BuyLog[];
    },
    enabled: !!user?.username,
    staleTime: 60000, // 1 minute
  });

  // Fetch topup history
  const { data: topupData, isLoading: isTopupLoading } = useQuery({
    queryKey: ["topup-history"],
    queryFn: async () => {
      if (!user?.username) return [];
      
      const { data, error } = await supabase
        .from("balance_log")
        .select("*")
        .eq("username", user.username)
        .order("timestamp", { ascending: false });
      
      if (error) {
        console.error("Error fetching topup history:", error);
        return [];
      }
      
      return data as BalanceLog[];
    },
    enabled: !!user?.username,
    staleTime: 60000, // 1 minute
  });

  // Combine and sort the purchase and topup histories
  useEffect(() => {
    if (!purchaseData && !topupData) return;
    
    const combinedHistory: HistoryItem[] = [];
    
    // Add purchase history items
    if (purchaseData) {
      purchaseData.forEach((item) => {
        combinedHistory.push({
          type: 'purchase',
          timestamp: item.timestamp,
          details: {
            map: item.map,
            price: item.price,
          },
        });
      });
    }
    
    // Add topup history items
    if (topupData) {
      topupData.forEach((item) => {
        combinedHistory.push({
          type: 'topup',
          timestamp: item.timestamp,
          details: {
            amount: item.amount,
          },
        });
      });
    }
    
    // Sort by timestamp (newest first)
    const sortedHistory = combinedHistory.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    setHistory(sortedHistory);
  }, [purchaseData, topupData]);

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPpp");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isPurchaseLoading && !isTopupLoading) {
      navigate("/auth");
    }
  }, [user, isPurchaseLoading, isTopupLoading, navigate]);

  const isLoading = isPurchaseLoading || isTopupLoading;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Clock className="mr-2 text-pink-DEFAULT" size={28} />
            <span>Transaction History</span>
          </h1>
          
          <GlassCard className="p-6">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-DEFAULT mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading your history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400">No transaction history found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-800/60 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        {item.type === 'purchase' ? (
                          <div className="h-10 w-10 bg-indigo-900/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <Package2 className="h-5 w-5 text-indigo-300" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-green-900/30 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <Wallet className="h-5 w-5 text-green-300" />
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-medium text-lg">
                            {item.type === 'purchase' 
                              ? `Purchased: ${item.details.map}` 
                              : 'Added funds'}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {formatDate(item.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-bold ${item.type === 'purchase' ? 'text-red-400' : 'text-green-400'}`}>
                          {item.type === 'purchase' 
                            ? `-${item.details.price} THB` 
                            : `+${item.details.amount} THB`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
};

export default HistoryPage;
