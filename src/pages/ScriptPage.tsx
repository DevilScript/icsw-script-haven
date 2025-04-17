
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase, MapData } from "@/lib/supabase";
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
import { Loader2, FileLock, FileCheck, Copy, Check } from "lucide-react";
import { CopyBlock, dracula } from "react-code-blocks";

const ScriptPage = () => {
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [maps, setMaps] = useState<{ name: string; gameid: string }[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [userKey, setUserKey] = useState<string>("");
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFreeScript, setIsFreeScript] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Load maps data and user information
  useEffect(() => {
    loadUser();
    fetchMaps();
  }, []);

  // Check if user has a key when they log in
  useEffect(() => {
    if (user && user.keys && user.keys.length > 0) {
      setUserKey(user.keys[0]);
      setKey(user.keys[0]);
    }
  }, [user]);

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
        setMaps(data);
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
    
    try {
      const selectedGameId = maps.find(map => map.name === value)?.gameid;
      
      if (!selectedGameId) return;
      
      // Since we don't have a scripts table available yet, let's simulate the behavior
      // In a real implementation, you would query your scripts table
      
      // For demonstration, let's consider some maps as free
      const freeMapNames = ["Demo Map", "Tutorial Map"];
      const isFree = freeMapNames.includes(value);
      
      setIsFreeScript(isFree);
      
      // If it's free, get the script content immediately
      if (isFree) {
        fetchScriptContent(value, "");
      } else if (user && user.keys && user.keys.length > 0 && user.maps?.includes(value)) {
        // If user has the map in their purchased maps, auto-fill the key
        setKey(user.keys[0]);
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
      
      const selectedGameId = maps.find(map => map.name === mapName)?.gameid;
      
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
        // Simulate fetching a script
        // In a real implementation, you would query your scripts table
        const demoScript = `-- ${mapName} Demo Script\nlocal player = game:GetService("Players").LocalPlayer\nprint("Hello, " .. player.Name .. "!")\n\n-- This is a demo script for ${mapName}`;
        
        setScriptContent(demoScript);
          
        // Log for free script view
        if (user) {
          await sendDiscordWebhook(
            "Free script viewed", 
            {
              "User": user.username || "Guest",
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
        // Check if user owns this key
        const { data: userData, error: userError } = await supabase
          .from("user_id")
          .select("keys, maps")
          .eq("username", user.username)
          .single();
          
        if (userError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify user ownership"
          });
          return;
        }
        
        // If user has a key and has access to this map
        if (userData?.keys?.includes(scriptKey) && userData.maps?.includes(mapName)) {
          // Generate script content with user's key
          const paidScript = `-- ${mapName} Premium Script\n\ngetgenv().key = "${scriptKey}"\nloadstring(game:HttpGet('https://raw.githubusercontent.com/DevilScript/Scripts/refs/heads/main/MoyxHubs'))()\n\n-- Your premium features here...\n`;
          
          setScriptContent(paidScript);
          
          // Log for paid script access
          await supabase
            .from("active_log")
            .insert([
              {
                username: user.username,
                map: mapName,
                key: scriptKey
              }
            ]);
            
          await sendDiscordWebhook(
            "Script accessed with key", 
            {
              "User": user.username,
              "Script Name": mapName,
              "Key": scriptKey
            }
          );
          
          toast({
            title: "Success",
            description: "Script loaded successfully"
          });
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

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    
    toast({ 
      title: "Copied!", 
      description: "Script copied to clipboard" 
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
        
        <GlassCard className="mb-8 feature-card relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT/30 to-transparent"></div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-medium mb-3 text-pink-pastel">Select Map</label>
              <Select
                value={selectedMap}
                onValueChange={handleMapSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-black/50 border-pink-pastel/40 focus:ring-pink-DEFAULT h-12">
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
            
            {selectedMap && !isFreeScript && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium mb-3 text-pink-pastel">Enter Your Script Key</label>
                <Input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Moyx-xxxxxxxxxx"
                  className="bg-black/50 border-pink-pastel/40 focus:ring-pink-DEFAULT h-12"
                />
              </div>
            )}
            
            {selectedMap && !isFreeScript && (
              <Button
                onClick={handleViewScript}
                disabled={isLoading || !selectedMap || (!isFreeScript && !key)}
                className="w-full h-12 button-3d hover:bg-pink-hover border border-pink-pastel shine-effect"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileLock className="mr-2 h-5 w-5" />
                    Access Script
                  </>
                )}
              </Button>
            )}
            
            {selectedMap && isFreeScript && !scriptContent && (
              <div className="text-center py-4 animate-fade-in">
                <div className="p-4 rounded-lg bg-black/20 border border-green-400/20">
                  <FileCheck className="h-6 w-6 mx-auto text-green-400 mb-3" />
                  <p className="text-green-400">This is a free script - no key required!</p>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
        
        {scriptContent && (
          <GlassCard className="animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span>Script for {selectedMap}</span>
              <Button
                onClick={handleCopyScript}
                variant="outline"
                size="sm"
                className="ml-auto bg-black/30 hover:bg-pink-transparent border border-pink-pastel/40"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </h3>
            <div className="script-container mb-4">
              <CopyBlock
                text={scriptContent}
                language="lua"
                theme={dracula}
                codeBlock
                wrapLongLines
              />
            </div>
          </GlassCard>
        )}
      </div>
    </Layout>
  );
};

export default ScriptPage;
