
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        if (!code) {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "No authentication code received"
          });
          
          // Check if in a popup
          if (window.opener) {
            window.close();
          } else {
            navigate('/auth');
          }
          return;
        }
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          // Get the user's details
          loadUser();
          
          // Auth successful - if in a popup, send a message to opener
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
            window.close();
          } else {
            // If not a popup, redirect to home
            toast({
              title: "Login Successful",
              description: "Welcome back!"
            });
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred"
        });
        
        // Check if in a popup
        if (window.opener) {
          window.close();
        } else {
          navigate('/auth');
        }
      }
    };

    handleAuthCallback();
  }, [navigate, toast, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#151518]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-white">ICS</span>
          <span className="text-[rgb(255,179,209)] pink-glow animate-glow">W</span>
        </h1>
        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-pink-DEFAULT to-transparent mx-auto my-4"></div>
        <p className="text-gray-400 animate-pulse">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
