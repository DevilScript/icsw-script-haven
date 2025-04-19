
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { keyStorage } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth';

const ResetHWIDPage = () => {
  const [keyToReset, setKeyToReset] = useState<string>('');
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Cache key status check to prevent repeated requests when typing
  const { data: keyInfo, refetch, isLoading: isChecking } = useQuery({
    queryKey: ['keyCheck', keyToReset],
    queryFn: async () => {
      if (!keyToReset.trim()) return null;
      
      const { data, error } = await keyStorage
        .from('keys')
        .select('*')
        .eq('key', keyToReset)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: false, // Don't run the query automatically
    staleTime: 30000, // Cache for 30 seconds
    retry: false
  });

  // Mutation to reset HWID
  const resetHWIDMutation = useMutation({
    mutationFn: async (key: string) => {
      const { data, error } = await keyStorage
        .from('keys')
        .update({ hwid: null })
        .eq('key', key);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "HWID Reset Successful",
        description: "You can now use this key on a new device",
      });
      setKeyToReset('');
      // Invalidate queries to refresh data
      refetch();
    },
    onError: (error) => {
      console.error('HWID Reset error:', error);
      toast({
        variant: "destructive",
        title: "HWID Reset Failed",
        description: "There was an error resetting your HWID",
      });
    }
  });

  const handleCheckKey = async () => {
    if (!keyToReset.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid key"
      });
      return;
    }
    
    refetch();
  };

  const handleResetHWID = async () => {
    if (!keyToReset.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid key"
      });
      return;
    }
    
    if (!keyInfo) {
      await handleCheckKey();
      return;
    }
    
    resetHWIDMutation.mutate(keyToReset);
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <GlassCard className="p-6">
          <div className="flex items-center mb-6">
            <Key className="h-6 w-6 text-pink-DEFAULT mr-2" />
            <h1 className="text-2xl font-bold">Reset HWID</h1>
          </div>
          
          {!user ? (
            <div className="py-10 text-center">
              <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-md">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-yellow-400 mb-2">Login Required</h3>
                <p className="text-gray-300 mb-4">You need to be logged in to reset your HWID.</p>
                <Button 
                  asChild
                  className="bg-gray-800 hover:bg-gray-700 text-white"
                >
                  <a href="/auth">Login Now</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-pink-transparent/10 to-purple-600/10 p-4 rounded-lg border border-pink-DEFAULT/20">
                <p className="text-gray-300 mb-2">Enter your script key to reset its HWID. This will allow you to use the script on a different device.</p>
                <p className="text-gray-400 text-sm">Note: You can only reset a key's HWID if you own that key.</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Enter your script key..."
                    className="pl-10 bg-black/30 border-gray-700 focus:border-pink-DEFAULT"
                    value={keyToReset}
                    onChange={(e) => setKeyToReset(e.target.value)}
                    disabled={resetHWIDMutation.isPending}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCheckKey}
                    disabled={!keyToReset.trim() || isChecking || resetHWIDMutation.isPending}
                    className="bg-gray-800 hover:bg-gray-700 text-white flex-1 hover:scale-105 transition-all duration-200"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Key'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleResetHWID}
                    disabled={!keyToReset.trim() || !keyInfo || resetHWIDMutation.isPending}
                    className="bg-gray-800 hover:bg-gray-700 text-white flex-1 hover:scale-105 transition-all duration-200"
                  >
                    {resetHWIDMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset HWID'
                    )}
                  </Button>
                </div>
              </div>
              
              {keyInfo && (
                <div className="bg-black/20 p-4 rounded-lg border border-gray-800 animate-fade-in">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    Key Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white font-medium">{keyInfo.status}</span>
                    
                    <span className="text-gray-400">HWID Locked:</span>
                    <span className="text-white font-medium">{keyInfo.hwid ? 'Yes' : 'No'}</span>
                    
                    <span className="text-gray-400">Maps:</span>
                    <span className="text-white font-medium">
                      {Array.isArray(keyInfo.maps) && keyInfo.maps.length > 0 
                        ? keyInfo.maps.join(', ') 
                        : 'None'}
                    </span>
                  </div>
                </div>
              )}
              
              {resetHWIDMutation.isSuccess && (
                <div className="bg-green-900/20 border border-green-800/30 p-4 rounded-lg flex items-start animate-fade-in">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-400">HWID Reset Successful!</h4>
                    <p className="text-gray-300 text-sm mt-1">
                      Your key's HWID has been reset. You can now use this script on another device.
                    </p>
                  </div>
                </div>
              )}
              
              {resetHWIDMutation.isError && (
                <div className="bg-red-900/20 border border-red-800/30 p-4 rounded-lg flex items-start animate-fade-in">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-400">Reset Failed</h4>
                    <p className="text-gray-300 text-sm mt-1">
                      There was an error resetting the HWID. Please try again or contact support.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </Layout>
  );
};

export default ResetHWIDPage;
