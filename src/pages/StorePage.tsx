
// This file is a complete rewrite to improve UI, loading experience and add key management
// src/pages/StorePage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, keyStorage, MapData } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronDown, 
  Loader2, 
  PackageOpen, 
  ShoppingBag 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

interface KeyData {
  id: number;
  key: string;
  maps: string[];
  allowexec: string[];
  status: string;
}

const StorePage = () => {
  const { user, updateUserData } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [purchasingMap, setPurchasingMap] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string | null>(null);
  
  // Fetch available maps from Supabase
  const { data: maps, isLoading: isMapsLoading } = useQuery({
    queryKey: ["storeItems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("set_map")
        .select("*")
        .order("price", { ascending: true });
      
      if (error) throw error;
      return data as MapData[];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: false,
  });
  
  // Fetch available keys (for stock display)
  const { data: keysData, isLoading: isKeysLoading } = useQuery({
    queryKey: ["availableKeys"],
    queryFn: async () => {
      const { data, error } = await keyStorage
        .from("keys")
        .select("id, key, status")
        .eq("status", "Pending");
      
      if (error) throw error;
      return data as { id: number; key: string; status: string }[];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: false,
  });
  
  // Get user's key if they have one
  const { data: userKeyData } = useQuery({
    queryKey: ["userKey", user?.id],
    queryFn: async () => {
      if (!user?.keys || user.keys.length === 0) {
        return null;
      }
      
      // Get the first key in the user's keys array
      const key = user.keys[0];
      
      const { data, error } = await keyStorage
        .from("keys")
        .select("*")
        .eq("key", key)
        .single();
      
      if (error) {
        console.error("Error fetching user key:", error);
        return null;
      }
      
      setUserKey(key);
      return data as KeyData;
    },
    staleTime: 60000, // 1 minute
    enabled: !!user?.keys && user.keys.length > 0,
  });
  
  const handlePurchase = async (selectedMap: MapData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to purchase maps",
      });
      navigate("/auth");
      return;
    }
    
    if (user.balance < selectedMap.price) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "Please top up your account to purchase this map",
      });
      return;
    }
    
    setPurchasingMap(selectedMap.name);
    
    try {
      // Check if the user already has this map
      if (user.maps && user.maps.includes(selectedMap.name)) {
        toast({
          variant: "destructive",
          title: "Already Purchased",
          description: "You already own this map",
        });
        setPurchasingMap(null);
        return;
      }
      
      // Start a transaction
      const newBalance = user.balance - selectedMap.price;
      
      // Update user balance and add map to their maps array
      const currentMaps = user.maps || [];
      const updatedMaps = [...currentMaps, selectedMap.name];
      
      const { error: updateError } = await supabase
        .from("user_id")
        .update({
          balance: newBalance,
          maps: updatedMaps,
        })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      
      // Log the purchase
      await supabase.from("buy_log").insert({
        username: user.username,
        map: selectedMap.name,
        price: selectedMap.price,
        key: userKey || "none",
        success: true,
      });
      
      // Check if user already has a key or needs a new key
      if (userKeyData) {
        // User already has a key, update their key to include the new map
        const updatedMaps = [...(userKeyData.maps || [])];
        if (!updatedMaps.includes(selectedMap.name)) {
          updatedMaps.push(selectedMap.name);
        }
        
        const { error: keyUpdateError } = await keyStorage
          .from("keys")
          .update({
            maps: updatedMaps,
            allowed_place_ids: [...(userKeyData.allowed_place_ids || []), parseInt(selectedMap.gameid)]
          })
          .eq("key", userKey);
        
        if (keyUpdateError) throw keyUpdateError;
        
        toast({
          title: "Purchase Successful",
          description: `${selectedMap.name} has been added to your account`,
        });
      } else {
        // User doesn't have a key yet, assign one
        if (keysData && keysData.length > 0) {
          const newKey = keysData[0].key;
          
          // Update the key status and assign it to the user
          const { error: keyUpdateError } = await keyStorage
            .from("keys")
            .update({
              status: "PreActive",
              maps: [selectedMap.name],
              allowed_place_ids: [parseInt(selectedMap.gameid)]
            })
            .eq("key", newKey);
          
          if (keyUpdateError) throw keyUpdateError;
          
          // Update user with the new key
          const { error: userKeyError } = await supabase
            .from("user_id")
            .update({
              keys: [newKey],
            })
            .eq("id", user.id);
          
          if (userKeyError) throw userKeyError;
          
          // Show key to the user
          toast({
            title: "Purchase Successful",
            description: `Your key: ${newKey}`,
            duration: 10000,
          });
          
          // Store the key locally for easy access
          setUserKey(newKey);
          localStorage.setItem("userKey", JSON.stringify({
            key: newKey,
            maps: [selectedMap.name],
            allowexec: []
          }));
        } else {
          throw new Error("No keys available");
        }
      }
      
      // Update user data in the store
      await updateUserData();
      
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setPurchasingMap(null);
    }
  };
  
  const isLoading = isMapsLoading || isKeysLoading;
  const stockCount = keysData?.length || 0;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold mb-2 md:mb-0 flex items-center">
              <ShoppingBag className="mr-2 text-pink-DEFAULT" size={28} />
              <span>Store</span>
            </h1>
            
            <div className="flex items-center space-x-4">
              {userKey ? (
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-0.5 rounded-lg">
                  <div className="bg-black/40 px-3 py-1 rounded-lg flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    <span className="text-gray-300 font-medium">Key Active</span>
                  </div>
                </div>
              ) : null}
              
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-0.5 rounded-lg">
                <div className="bg-black/40 px-3 py-1 rounded-lg flex items-center">
                  <PackageOpen className="h-4 w-4 text-amber-400 mr-2" />
                  <span className="text-gray-300">
                    <span className="font-medium">{stockCount}</span> in stock
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {!user ? (
            <GlassCard className="p-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-yellow-400 mb-4" />
              <h2 className="text-xl font-medium mb-2">Authentication Required</h2>
              <p className="text-gray-400 mb-4">Please log in to browse and purchase maps.</p>
              <Button asChild className="bg-gray-800 hover:bg-gray-700 text-white mt-2 hover:scale-105 transition-all duration-200">
                <a href="/auth">Login</a>
              </Button>
            </GlassCard>
          ) : isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 text-pink-DEFAULT animate-spin mb-4" />
              <p className="text-gray-400">Loading store items...</p>
            </div>
          ) : !maps || maps.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-gray-400">No maps available at the moment.</p>
            </GlassCard>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {maps.map((map) => {
                const isOwned = user.maps && user.maps.includes(map.name);
                const isPurchasing = purchasingMap === map.name;
                
                return (
                  <AccordionItem 
                    key={map.id}
                    value={map.name}
                    className="border-none"
                  >
                    <GlassCard className={`overflow-hidden transition-all duration-300 ${isOwned ? 'border-green-500/30' : ''}`}>
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            {isOwned && (
                              <div className="bg-green-900/30 rounded-full p-1 mr-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                              </div>
                            )}
                            <h3 className="text-xl font-medium">{map.name}</h3>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-xl font-bold text-pink-DEFAULT">
                              {map.price} THB
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border-t border-gray-800/80">
                        <div className="p-6">
                          <h4 className="text-lg font-medium mb-2">Features:</h4>
                          <ul className="space-y-2 mb-6">
                            {map.function && map.function.length > 0 ? (
                              map.function.map((func, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="h-2 w-2 bg-pink-DEFAULT rounded-full mr-2"></div>
                                  <span>{func}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-gray-400">No features listed</li>
                            )}
                          </ul>
                          
                          <div className="flex justify-end">
                            <Button 
                              onClick={() => handlePurchase(map)}
                              disabled={isOwned || isPurchasing || user.balance < map.price}
                              className="bg-gray-800 hover:bg-gray-700 text-white shadow-lg hover:scale-105 transition-all duration-200"
                            >
                              {isPurchasing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : isOwned ? (
                                "Owned"
                              ) : user.balance < map.price ? (
                                "Insufficient Balance"
                              ) : (
                                "Purchase"
                              )}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </GlassCard>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StorePage;
