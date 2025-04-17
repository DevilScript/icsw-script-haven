
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/lib/auth";
import { supabase, keyStorage } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  RotateCw, 
  Key, 
  AlertCircle,
  Check
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ResetHWIDPage = () => {
  const { user, loadUser } = useAuthStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [userKeys, setUserKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [resetSuccess, setResetSuccess] = useState(false);
  
  useEffect(() => {
    loadUser();
    if (user) {
      fetchUserKeys();
    }
  }, [user]);
  
  const fetchUserKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("user_id")
        .select("keys")
        .eq("username", user.username)
        .single();
        
      if (error) throw error;
      
      if (data && data.keys) {
        setUserKeys(data.keys);
        if (data.keys.length > 0) {
          setSelectedKey(data.keys[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching user keys:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your keys"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetHWID = async () => {
    if (!selectedKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a key"
      });
      return;
    }
    
    setIsResetting(true);
    setResetSuccess(false);
    
    try {
      // Call the function to reset the HWID
      const { data, error } = await supabase.rpc(
        'reset_key_hwid',
        { key_to_reset: selectedKey }
      );
      
      if (error) throw error;
      
      if (data) {
        toast({
          title: "Success",
          description: "HWID reset successfully"
        });
        setResetSuccess(true);
        
        // Update the key in key storage
        await keyStorage
          .from("keys")
          .update({ hwid: null })
          .eq("key", selectedKey);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to reset HWID. Key not found."
        });
      }
    } catch (error) {
      console.error("Error resetting HWID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset HWID"
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-3xl font-bold mb-6">
            <span className="relative">
              Reset HWID
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
            </span>
          </h1>
          <GlassCard>
            <p className="text-xl text-gray-300">Please log in to reset your HWID</p>
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          <span className="relative">
            Reset HWID
            <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent"></span>
          </span>
        </h1>
        
        <GlassCard className="feature-card">
          <div className="space-y-6">
            <div className="bg-black/20 p-5 rounded-lg border border-pink-pastel/20">
              <h2 className="flex items-center text-xl font-semibold mb-3 text-pink-DEFAULT">
                <AlertCircle className="h-5 w-5 mr-2" />
                What is HWID Reset?
              </h2>
              <p className="text-gray-300">
                Hardware ID (HWID) is used to lock your script to a specific device. If you need to use your script on a new device, you'll need to reset your HWID. You can only reset your HWID once every 24 hours.
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-pink-DEFAULT" />
              </div>
            ) : userKeys.length > 0 ? (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium mb-3 text-pink-pastel">Select Key</label>
                  <Select
                    value={selectedKey}
                    onValueChange={setSelectedKey}
                  >
                    <SelectTrigger className="bg-black/50 border-pink-pastel/40 focus:ring-pink-DEFAULT h-12">
                      <SelectValue placeholder="Select a key" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1f] border-pink-pastel/40">
                      {userKeys.map(key => (
                        <SelectItem 
                          key={key} 
                          value={key}
                          className="focus:bg-pink-transparent focus:text-white"
                        >
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleResetHWID}
                  disabled={isResetting || !selectedKey || resetSuccess}
                  className="w-full hwid-reset-button"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting...
                    </>
                  ) : resetSuccess ? (
                    <>
                      <Check className="mr-2 h-5 w-5 text-green-400" />
                      HWID Reset Complete
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-5 w-5" />
                      Reset HWID
                    </>
                  )}
                </Button>
                
                {resetSuccess && (
                  <div className="p-4 rounded-lg bg-green-900/20 border border-green-400/20 text-center animate-fade-in">
                    <p className="text-green-400">
                      HWID reset successfully! You can now use your script on a new device.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-500 opacity-50" />
                <p className="text-lg">No keys found for your account</p>
                <p className="mt-2 text-sm">Purchase a script to get a key</p>
                <Button
                  onClick={() => window.location.href = "/store"}
                  className="mt-6 button-3d shine-effect"
                >
                  Go to Store
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

export default ResetHWIDPage;
