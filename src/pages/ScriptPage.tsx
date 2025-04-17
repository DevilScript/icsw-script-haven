
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendDiscordWebhook } from "@/lib/webhook";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, FileLock, FileCheck } from "lucide-react";
import { CopyBlock, dracula } from "react-code-blocks";

interface ScriptData {
  id: number;
  name: string;
  script: string;
  is_free: boolean;
  game_id: number;
  created_at: string;
}

const ScriptPage = () => {
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [maps, setMaps] = useState<{ name: string; game_id: number }[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFreeScript, setIsFreeScript] = useState(false);
  
  // Load maps data
  useEffect(() => {
    loadUser();
    fetchMaps();
  }, []);

  // Fetch available maps from Supabase
  const fetchMaps = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("set_map")
        .select("name, gameid");
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setMaps(data.map(item => ({ 
          name: item.name, 
          game_id: item.gameid 
        })));
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

  // Handle map selection
  const handleMapSelect = async (value: string) => {
    setSelectedMap(value);
    setScriptContent("");
    
    // Check if the selected script is free
    try {
      const selectedGameId = maps.find(map => map.name === value)?.game_id;
      
      if (!selectedGameId) return;
      
      const { data, error } = await supabase
        .from("scripts")
        .select("is_free")
        .eq("name", value)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking script:", error);
        return;
      }
      
      setIsFreeScript(data?.is_free || false);
      
      // If it's free, get the script content immediately
      if (data?.is_free) {
        fetchScriptContent(value, "");
      }
    } catch (error) {
      console.error("Error checking if script is free:", error);
    }
  };

  // Fetch script content
  const fetchScriptContent = async (mapName: string, scriptKey: string) => {
    if (!mapName) return;
    
    try {
      setIsLoading(true);
      
      const selectedGameId = maps.find(map => map.name === mapName)?.game_id;
      
      if (!selectedGameId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Map not found"
        });
        return;
      }
      
      // For free scripts, no key needed
      if (isFreeScript) {
        const { data, error } = await supabase
          .from("scripts")
          .select("script")
          .eq("name", mapName)
          .eq("is_free", true)
          .single();
          
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load script content"
          });
          return;
        }
        
        if (data?.script) {
          setScriptContent(data.script);
          
          // Log for free script view
          await sendDiscordWebhook(
            "Free script viewed", 
            {
              "Discord User": user?.discord_username || "Guest",
              "Script Name": mapName
            }
          );
        }
        return;
      }
      
      // For paid scripts, verify key
      if (!scriptKey) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter your script key"
        });
        return;
      }
      
      // First check if the user owns this key
      if (user) {
        // Check if user owns valid key
        const { data: userData, error: userError } = await supabase
          .from("user_id")
          .select("key, maps")
          .eq("discord_username", user.discord_username)
          .single();
          
        if (userError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify user ownership"
          });
          return;
        }
        
        // If user has a key, validate it has access to this map
        if (userData?.key === scriptKey && userData.maps?.includes(mapName)) {
          // Get script content
          const { data: scriptData, error: scriptError } = await supabase
            .from("scripts")
            .select("script")
            .eq("name", mapName)
            .single();
            
          if (scriptError) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to load script content"
            });
            return;
          }
          
          if (scriptData?.script) {
            setScriptContent(scriptData.script);
            
            // Log for paid script access
            await supabase
              .from("active_log")
              .insert([
                {
                  discord_username: user.discord_username,
                  script_name: mapName,
                  key: scriptKey
                }
              ]);
              
            await sendDiscordWebhook(
              "Script accessed with key", 
              {
                "Discord User": user.discord_username,
                "Script Name": mapName,
                "Key": scriptKey
              }
            );
            
            toast({
              title: "Success",
              description: "Script loaded successfully"
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Invalid Key",
            description: "This key does not have access to this script"
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to access paid scripts"
        });
      }
    } catch (error) {
      console.error("Error fetching script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load script"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewScript = () => {
    fetchScriptContent(selectedMap, key);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Script Access
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
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
            
            {selectedMap && !isFreeScript && (
              <div>
                <label className="block text-sm font-medium mb-2">Enter Your Script Key</label>
                <Input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Your script key"
                  className="bg-black/30 border-pink-pastel focus:ring-pink-DEFAULT"
                />
              </div>
            )}
            
            {selectedMap && !isFreeScript && (
              <Button
                onClick={handleViewScript}
                disabled={isLoading || !selectedMap || (!isFreeScript && !key)}
                className="w-full bg-pink-transparent hover:bg-pink-hover border border-pink-pastel shine-effect"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileLock className="mr-2 h-4 w-4" />
                    Access Script
                  </>
                )}
              </Button>
            )}
            
            {selectedMap && isFreeScript && !scriptContent && (
              <div className="text-center py-2">
                <FileCheck className="h-6 w-6 mx-auto text-green-400 mb-2" />
                <p className="text-green-400">This is a free script - no key required!</p>
              </div>
            )}
          </div>
        </GlassCard>
        
        {scriptContent && (
          <GlassCard className="animate-fade-in">
            <h3 className="text-xl font-semibold mb-4">
              Script for {selectedMap}
            </h3>
            <div className="rounded-md overflow-hidden mb-4">
              <CopyBlock
                text={scriptContent}
                language="lua"
                theme={dracula}
                codeBlock
                wrapLongLines
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(scriptContent);
                  toast({ title: "Copied!", description: "Script copied to clipboard" });
                }}
                variant="outline"
                className="bg-pink-transparent hover:bg-pink-hover border border-pink-pastel"
              >
                Copy to Clipboard
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
};

export default ScriptPage;
