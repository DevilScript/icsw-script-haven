
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase, keyStorage, MapData } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  ShoppingCart,
  Check, 
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface StoreItem extends MapData {
  stock: number;
  isLoading?: boolean;
}

const StorePage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchStoreItems();
  }, []);
  
  const fetchStoreItems = async () => {
    setIsLoading(true);
    try {
      // Fetch available maps from set_map table
      const { data: mapData, error: mapError } = await supabase
        .from("set_map")
        .select("*")
        .order("name");
        
      if (mapError) throw mapError;
      
      // For each map, check key availability from key storage DB
      const itemsWithStock = await Promise.all(
        (mapData || []).map(async (map) => {
          // Fetch pending keys count
          const { data: keysData, error: keysError } = await keyStorage
            .from("keys")
            .select("id")
            .eq("status", "Pending")
            .limit(100);
          
          if (keysError) {
            console.error(`Error fetching keys for ${map.name}:`, keysError);
            return {
              ...map,
              stock: 0
            };
          }
          
          return {
            ...map,
            stock: keysData?.length || 0
          };
        })
      );
      
      setStoreItems(itemsWithStock);
    } catch (error) {
      console.error("Error fetching store items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load store items"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePurchase = async (item: StoreItem) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to purchase items"
      });
      return;
    }
    
    if (user.balance < item.price) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need ${item.price} THB to purchase this item`
      });
      return;
    }
    
    if (item.stock <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "This item is currently unavailable"
      });
      return;
    }
    
    // Update the loading state for this specific item
    setStoreItems(prev => prev.map(storeItem => 
      storeItem.id === item.id ? { ...storeItem, isLoading: true } : storeItem
    ));
    
    try {
      // Step 1: Get a pending key from key storage
      const { data: keyData, error: keyError } = await keyStorage
        .from("keys")
        .select("key")
        .eq("status", "Pending")
        .limit(1)
        .single();
        
      if (keyError) throw keyError;
      
      const key = keyData.key;
      
      if (!key) {
        throw new Error("No available keys found");
      }
      
      // Step 2: Update user balance
      const newBalance = (user.balance || 0) - item.price;
      
      const { error: balanceError } = await supabase
        .from("user_id")
        .update({ balance: newBalance })
        .eq("id", user.id);
        
      if (balanceError) throw balanceError;
      
      // Step 3: Update key in key storage
      const { error: updateKeyError } = await keyStorage
        .from("keys")
        .update({
          status: "PreActive",
          allowed_place_ids: [parseInt(item.gameid)],
          maps: [item.name]
        })
        .eq("key", key);
        
      if (updateKeyError) throw updateKeyError;
      
      // Step 4: Log the purchase
      await supabase.from("buy_log").insert({
        username: user.username,
        map: item.name,
        key: key,
        price: item.price,
        success: true
      });
      
      // Step 5: Update user's maps and keys arrays
      let updatedMaps = user.maps ? [...user.maps] : [];
      let updatedKeys = user.keys ? [...user.keys] : [];
      
      if (!updatedMaps.includes(item.name)) {
        updatedMaps.push(item.name);
      }
      
      if (!updatedKeys.includes(key)) {
        updatedKeys.push(key);
      }
      
      await supabase
        .from("user_id")
        .update({ 
          maps: updatedMaps,
          keys: updatedKeys
        })
        .eq("id", user.id);
      
      // Step 6: Refresh store items
      await fetchStoreItems();
      
      // Notify user of successful purchase
      toast({
        title: "Purchase Successful",
        description: `You have purchased ${item.name}`,
      });
      
      // Update the local balance in the auth store
      // This will be handled by the auth state listener
      
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "An error occurred during purchase. Please try again."
      });
    } finally {
      // Reset loading state
      setStoreItems(prev => prev.map(storeItem => 
        storeItem.id === item.id ? { ...storeItem, isLoading: false } : storeItem
      ));
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto pt-8 flex justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-pink-DEFAULT" />
            <p className="text-gray-400 mt-4">Loading store items...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-10">
        <GlassCard className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {storeItems.length > 0 ? (
              storeItems.map((item) => (
                <AccordionItem 
                  key={item.id}
                  value={`item-${item.id}`}
                  className="border-b border-gray-700 last:border-b-0 overflow-hidden"
                >
                  <AccordionTrigger className="hover:bg-pink-transparent/5 px-4 py-5 rounded-t-md transition-all">
                    <div className="flex flex-1 items-center justify-between">
                      <h3 className="text-xl font-medium text-white">{item.name}</h3>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-pink-transparent/20 rounded-full text-pink-DEFAULT">
                          {item.price} THB
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          item.stock > 0 ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                        }`}>
                          {item.stock > 0 ? `Stock: ${item.stock}` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="animate-slide-in bg-black/20 px-4 py-4 rounded-b-md">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {item.function && item.function.map((func, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 bg-purple-600/10 text-purple-300 rounded-full text-sm border border-purple-600/20"
                          >
                            {func}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={!user || user.balance < item.price || item.stock <= 0 || item.isLoading}
                          className="button-3d shine-effect bg-gradient-to-r from-pink-DEFAULT/80 to-purple-600/80 hover:from-pink-DEFAULT hover:to-purple-600"
                        >
                          {item.isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Purchase for {item.price} THB
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No store items available</h3>
                <p className="text-gray-400 mt-2">Please check back later for new items.</p>
              </div>
            )}
          </Accordion>
          
          {!user && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-400">Login Required</h4>
                  <p className="text-gray-300 text-sm mt-1">
                    You need to be logged in to purchase items from the store.
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
        </GlassCard>
      </div>
    </Layout>
  );
};

export default StorePage;
