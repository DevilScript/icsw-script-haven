
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { keyStorage, supabase, MapData } from "@/lib/supabase";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Key as KeyIcon, Copy, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ScriptPage = () => {
  const { user, isLoading: authLoading } = useAuthStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [key, setKey] = useState<string>("");
  const [scriptCode, setScriptCode] = useState<string>("");
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    fetchMaps();
  }, []);
  
  useEffect(() => {
    if (user && user.keys && user.keys.length > 0 && selectedMap) {
      // Auto-fill key if user has a valid key
      setKey(user.keys[0]);
    } else if (selectedMap) {
      // If no key exists, show placeholder
      setKey("");
    }
  }, [selectedMap, user]);

  const fetchMaps = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("set_map")
        .select("*");
        
      if (error) throw error;
      
      if (data) {
        setMaps(data as MapData[]);
      }
    } catch (error) {
      console.error("Error fetching maps:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load maps"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAccessScript = async () => {
    if (!selectedMap || !key) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a map and enter your key"
      });
      return;
    }
    
    try {
      setIsLoadingScript(true);
      
      // Check if key exists and is valid for the selected map
      const { data: keyData, error: keyError } = await keyStorage
        .from("keys")
        .select("*")
        .eq("key", key)
        .single();
        
      if (keyError || !keyData) {
        toast({
          variant: "destructive",
          title: "Invalid Key",
          description: "The key you entered is not valid"
        });
        return;
      }
      
      const keyMaps = keyData.maps || [];
      if (!keyMaps.includes(selectedMap)) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Your key does not have access to this map"
        });
        return;
      }
      
      // If key is valid, record access
      await supabase.from("active_log").insert([
        {
          key: key,
          map: selectedMap,
          username: user ? user.username : "guest"
        }
      ]);
      
      // Generate script code with the key inserted
      const script = `getgenv().key = "${key}"\nloadstring(game:HttpGet('https://raw.githubusercontent.com/DevilScript/Scripts/refs/heads/main/MoyxHubs'))()`;
      setScriptCode(script);
      
      toast({
        title: "Success",
        description: "Script access granted"
      });
      
    } catch (error) {
      console.error("Error accessing script:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to access script"
      });
    } finally {
      setIsLoadingScript(false);
    }
  };
  
  const copyScript = () => {
    if (scriptCode) {
      navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Script copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-pink-pastel">Select Map</label>
                <Select 
                  value={selectedMap}
                  onValueChange={(value) => {
                    setSelectedMap(value);
                    setScriptCode("");
                  }}
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
              
              <div>
                <label className="block text-sm font-medium mb-2 text-pink-pastel">Enter Key</label>
                <div className="relative">
                  <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-pastel/70" size={18} />
                  <Input 
                    className="key-input pl-10" 
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Moyx-xxxxxxxxxx"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleAccessScript}
                disabled={isLoadingScript || !selectedMap || !key}
                className="button-3d shine-effect w-full"
              >
                {isLoadingScript ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Access Script"
                )}
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-pink-DEFAULT/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-pink-DEFAULT/10 rounded-full blur-3xl"></div>
              
              <div className="script-container relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-pink-DEFAULT font-semibold">Script Output</h3>
                  {scriptCode && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyScript}
                      className="text-xs flex items-center gap-1 hover:bg-pink-transparent/20"
                    >
                      {copied ? (
                        <CheckCheck size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  )}
                </div>
                
                {scriptCode ? (
                  <pre className="script-display flex-grow overflow-auto whitespace-pre-wrap">
                    <code>
                      getgenv().key = "<span className="script-highlight">{key}</span>"<br />
                      loadstring(game:HttpGet('https://raw.githubusercontent.com/DevilScript/Scripts/refs/heads/main/MoyxHubs'))()
                    </code>
                  </pre>
                ) : (
                  <div className="flex-grow flex items-center justify-center text-gray-500 italic text-sm">
                    Select a map and enter your key to view the script
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard>
          <h2 className="text-xl font-semibold mb-6 text-pink-DEFAULT">How to Use</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-300">
            <li><span className="text-pink-pastel">Select a map</span> from the dropdown menu</li>
            <li><span className="text-pink-pastel">Enter your key</span> (purchase from the Store if you don't have one)</li>
            <li><span className="text-pink-pastel">Click "Access Script"</span> to generate your script</li>
            <li><span className="text-pink-pastel">Copy the script</span> and paste it into your executor</li>
            <li><span className="text-pink-pastel">Execute the script</span> in-game to activate</li>
          </ol>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default ScriptPage;
