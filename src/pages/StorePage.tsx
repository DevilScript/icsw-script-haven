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
  Check, 
  ShoppingCart, 
  Key, 
  AlertCircle
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
      
      // Update maps array
      let updatedMaps = [...(key.maps || [])];
      if (!updatedMaps.includes(selectedMapData.name)) {
        updatedMaps.push(selectedMapData.name);
      }
      
      // Update place IDs array - convert gameid to number if needed
      let updatedPlaceIds = [...(key.allowed_place_ids || [])];
      
      // Parse gameid to number if needed for allowed_place_ids
      // We're keeping it as a string in our code, but handling it properly for the API
      const gameIdNumber = parseInt(selectedMapData.gameid);
      if (!isNaN(gameIdNumber) && !updatedPlaceIds.includes(gameIdNumber)) {
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
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Error updating key status."
        });
        return;
      }
      
      // Update user balance
      const { error: balanceError } = await supabase
        .from("user_id")
        .update({
          balance: user.balance - selectedMapData.price,
          key: key.key,
          maps: updatedMaps
        })
        .eq("username", user.username);
      
      if (balanceError) {
        toast({
          variant: "destructive",
          title: "Purchase Failed",
          description: "Error updating user balance."
        });
        return;
      }
      
      // Log purchase
      await supabase
        .from("buy_log")
        .insert([{
          username: user.username,
          map: selectedMapData.name,
          price: selectedMapData.price,
          key: key.key,
          success: true
        }]);
      
      // Send webhook notification
      await sendDiscordWebhook(
        "Script Purchase Successful", 
        {
          "Discord User": user.username,
          "Map Name": selectedMapData.name,
          "Price": selectedMapData.price,
          "Key": key.key
        }
      );
      
      // Refresh user data and key count
      await loadUser();
      await fetchKeyCount();
      
      toast({
        title: "Purchase Successful!",
        description: `You have purchased ${selectedMapData.name} script. Your key: ${key.key}`
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
        
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-2 bg-black/30 rounded-full border border-pink-pastel">
            <div className="flex items-center space-x-2">
              <Key size={16} className="text-pink-DEFAULT" />
              <span>Keys in Stock: <span className={keyCount > 0 ? "text-green-400" : "text-red-400"}>{keyCount}</span></span>
            </div>
          </div>
        </div>
        
        <GlassCard className="mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Map</label>
              <Select
                value={selectedMap}
                onValueChange={handleMapSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-black/30 border-pink-pastel focus:ring-pink-DEFAULT">
                  <SelectValue placeholder="Select a map" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1f] border-pink-pastel">
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
              <div className="p-4 bg-black/20 rounded-md border border-pink-pastel animate-fade-in">
                <h3 className="text-xl font-semibold mb-3">{selectedMapData.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Price</p>
                    <p className="text-lg text-pink-DEFAULT">{selectedMapData.price} Credits</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-400 text-sm">Game ID</p>
                    <p className="text-lg">{selectedMapData.gameid}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-1">Functions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMapData.function.map((func, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-pink-transparent text-xs rounded-full border border-pink-pastel"
                      >
                        {func}
                      </span>
                    ))}
                  </div>
                </div>
                
                {user ? (
                  <div className="flex justify-between items-center pt-2">
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
                      className="bg-pink-transparent hover:bg-pink-hover border border-pink-pastel shine-effect"
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
                  <div className="flex items-center justify-center p-3 bg-black/40 rounded-md text-pink-DEFAULT border border-pink-pastel">
                    <AlertCircle size={16} className="mr-2" />
                    Please login to purchase scripts
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
        
        {/* Instructions */}
        <GlassCard>
          <h3 className="text-xl font-semibold mb-4">How to Purchase</h3>
          <ol className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">1</span>
              <span>Top up your account with TrueMoney Wallet in the Topup page</span>
            </li>
            <li className="flex items-start">
              <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">2</span>
              <span>Select the map script you want to purchase</span>
            </li>
            <li className="flex items-start">
              <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">3</span>
              <span>Click Purchase and receive your key</span>
            </li>
            <li className="flex items-start">
              <span className="bg-pink-transparent text-pink-DEFAULT rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">4</span>
              <span>Use your key in the Script page to access your purchased script</span>
            </li>
          </ol>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default StorePage;
