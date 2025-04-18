
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase, keyStorage, MapData, KeyData } from "@/lib/supabase";
import { sendDiscordWebhook } from "@/lib/webhook";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ShoppingCart, 
  AlertCircle,
  PackageOpen
} from "lucide-react";

const StorePage = () => {
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [selectedMapData, setSelectedMapData] = useState<MapData | null>(null);
  const [keyCount, setKeyCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  
  useEffect(() => {
    loadUser();
    fetchMaps();
    fetchKeyCount();
  }, []);
  
  useEffect(() => {
    if (selectedMap) {
      fetchKeyCount();
    }
  }, [selectedMap]);

  // Fetch available maps from Supabase
  const fetchMaps = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("set_map")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMaps(data as MapData[]);
      }
    } catch (error) {
      console.error("Error fetching maps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available maps"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Count pending keys in key storage
  const fetchKeyCount = async () => {
    try {
      const { count, error } = await keyStorage
        .from("keys")
        .select("*", { count: 'exact', head: true })
        .eq("status", "Pending");
      
      if (error) {
        console.error("Error counting keys:", error);
        return;
      }
      
      setKeyCount(count || 0);
    } catch (error) {
      console.error("Error fetching key count:", error);
    }
  };

  // Handle map selection
  const handleMapSelect = (value: string) => {
    setSelectedMap(value);
    const mapData = maps.find(map => map.name === value) || null;
    setSelectedMapData(mapData);
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (!user || !selectedMapData) return;
    
    // Check if user has enough balance
    if (user.balance < selectedMapData.price) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `You need ${selectedMapData.price} credits, but you only have ${user.balance}.`
      });
      return;
    }
    
    // Check if keys are available
    if (keyCount <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: "No keys available for purchase at the moment."
      });
      return;
    }
    
    setIsBuying(true);
    
    try {
      // First check if the user already has a key
      const { data: userData, error: userError } = await supabase
        .from("user_id")
        .select("keys, maps")
        .eq("username", user.username)
        .single();
        
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }
      
      let userKey = "";
      let updatedMaps: string[] = [];
      let updatedKeys: string[] = [];
      
      // If user already has keys, update them
      if (userData && userData.keys && userData.keys.length > 0) {
        userKey = userData.keys[0]; // Use the first key
        updatedKeys = userData.keys;
        updatedMaps = [...(userData.maps || [])];
        
        if (!updatedMaps.includes(selectedMapData.name)) {
          updatedMaps.push(selectedMapData.name);
        }
        
        // Update the key in key storage to add the new map and place ID
        const { data: keyData, error: keyFetchError } = await keyStorage
          .from("keys")
          .select("*")
          .eq("key", userKey)
          .single();
          
        if (keyFetchError) {
          throw keyFetchError;
        }
        
        const key = keyData as KeyData;
        
        // Update maps array for the existing key
        let keyMaps = [...(key.maps || [])];
        if (!keyMaps.includes(selectedMapData.name)) {
          keyMaps.push(selectedMapData.name);
        }
        
        // Update place IDs array
        let updatedPlaceIds = [...(key.allowed_place_ids || [])];
        const gameIdNumber = parseInt(selectedMapData.gameid);
        if (!isNaN(gameIdNumber) && !updatedPlaceIds.includes(gameIdNumber)) {
          updatedPlaceIds.push(gameIdNumber);
        }
        
        // Update the key in key storage
        const { error: updateKeyError } = await keyStorage
          .from("keys")
          .update({
            maps: keyMaps,
            allowed_place_ids: updatedPlaceIds
          })
          .eq("key", userKey);
          
        if (updateKeyError) {
          throw updateKeyError;
        }
      }
      // User doesn't have a key yet, get a new one
      else {
        // Get a key from key storage
        const { data: keyData, error: keyError } = await keyStorage
          .from("keys")
          .select("*")
          .eq("status", "Pending")
          .limit(1)
          .single();
          
        if (keyError) {
          toast({
            variant: "destructive",
            title: "Purchase Failed",
            description: "No keys available or error fetching key."
          });
          return;
        }
        
        // Update the key status and map information
        const key = keyData as KeyData;
        userKey = key.key;
        updatedKeys = [userKey];
        updatedMaps = [selectedMapData.name];
        
        // Update place IDs array
        let updatedPlaceIds: number[] = [];
        const gameIdNumber = parseInt(selectedMapData.gameid);
        if (!isNaN(gameIdNumber)) {
          updatedPlaceIds.push(gameIdNumber);
        }
        
        // Update key in key storage
        const { error: updateKeyError } = await keyStorage
          .from("keys")
          .update({
            status: "PreActive",
            maps: updatedMaps,
            allowed_place_ids: updatedPlaceIds
          })
          .eq("id", key.id);
        
        if (updateKeyError) {
          throw updateKeyError;
        }
      }
      
      // Update user balance and store the key/maps info
      const { error: balanceError } = await supabase
        .from("user_id")
        .update({
          balance: user.balance - selectedMapData.price,
          keys: updatedKeys,
          maps: updatedMaps
        })
        .eq("username", user.username);
      
      if (balanceError) {
        throw balanceError;
      }
      
      // Log purchase
      await supabase
        .from("buy_log")
        .insert([{
          username: user.username,
          map: selectedMapData.name,
          price: selectedMapData.price,
          key: userKey,
          success: true
        }]);
      
      // Send webhook notification
      await sendDiscordWebhook(
        "Script Purchase Successful", 
        {
          "Discord User": user.username,
          "Map Name": selectedMapData.name,
          "Price": selectedMapData.price,
          "Key": userKey
        }
      );
      
      // Refresh user data and key count
      await loadUser();
      await fetchKeyCount();
      
      toast({
        title: "Purchase Successful!",
        description: `You have purchased ${selectedMapData.name} script. Your key: ${userKey}`
      });
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "An unexpected error occurred."
      });
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Script Store
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        <GlassCard className="mb-8 feature-card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-pink-pastel">Select Map</label>
              <Select
                value={selectedMap}
                onValueChange={handleMapSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-black/40 border-pink-pastel/40 focus:ring-ring h-12">
                  <SelectValue placeholder="Select a map" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1f] border-pink-pastel/40">
                  {maps.map(map => (
                    <SelectItem 
                      key={map.name} 
                      value={map.name}
                      className="focus:bg-pink-transparent focus:text-white"
                    >
                      {map.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedMapData && (
              <div className="p-6 bg-[#1a1a22]/70 rounded-lg animate-fade-in backdrop-blur-md border-t border-b border-pink-pastel/20">
                <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                  <h3 className="text-2xl font-semibold text-pink-DEFAULT">{selectedMapData.name}</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-DEFAULT to-pink-DEFAULT/70">
                      {selectedMapData.price} Credits
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMapData.function.map((func, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1.5 bg-black/40 text-xs rounded-full border border-pink-pastel/30"
                      >
                        {func}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="text-sm flex items-center gap-2">
                    <PackageOpen size={16} />
                    <span>In Stock: </span> 
                    <span className={
                      keyCount <= 0 ? "text-red-300" :
                      keyCount < 10 ? "text-pink-pastel" :
                      "text-green-300"
                    }>
                      {keyCount} keys
                    </span>
                  </div>
                  
                  {user ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm">
                        Your Balance: <span className={user.balance >= selectedMapData.price ? "text-green-400" : "text-red-400"}>
                          {user.balance} Credits
                        </span>
                      </div>
                      
                      <Button
                        onClick={handlePurchase}
                        disabled={
                          isBuying || 
                          !user || 
                          user.balance < selectedMapData.price || 
                          keyCount <= 0
                        }
                        className={`button-3d shine-effect ${
                          (!user || user.balance < selectedMapData.price || keyCount <= 0) ? 
                          'disabled-element' : ''
                        }`}
                      >
                        {isBuying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Purchase
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-3 bg-black/40 rounded-md text-pink-DEFAULT border border-pink-pastel/30">
                      <AlertCircle size={16} className="mr-2" />
                      Please login to purchase scripts
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default StorePage;
