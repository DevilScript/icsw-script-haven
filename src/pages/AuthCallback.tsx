
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadUser } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsProcessing(true);
        
        // Get the auth code from the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        
        // Check for errors in URL
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        if (error) {
          console.error('Auth error:', error, errorDescription);
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : "Authentication failed"
          });
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Check if in a popup
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error: errorDescription }, window.location.origin);
            window.close();
          } else {
            navigate('/auth');
          }
          return;
        }
        
        if (!code) {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "No authentication code received"
          });
          
          // Check if in a popup
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error: 'No code received' }, window.location.origin);
            window.close();
          } else {
            navigate('/auth');
          }
          return;
        }
        
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Exchange code error:', exchangeError);
          
          // If we get a database error with new user, handle it differently
          if (exchangeError.message.includes("Database error saving new user")) {
            console.log("Detected database error with new user, attempting login directly");
            
            // Check if the user exists despite the error
            const { data: sessionData } = await supabase.auth.getSession();
            
            if (sessionData?.session) {
              // We have a session, so authentication actually worked despite the error
              await loadUser();
              
              // Auth successful - if in a popup, send a message to opener
              if (window.opener) {
                window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
                window.close();
              } else {
                toast({
                  title: "Login Successful",
                  description: "Welcome back!"
                });
                navigate('/');
              }
              return;
            }
          }
          
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: exchangeError.message
          });
          
          // Check if in a popup
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error: exchangeError.message }, window.location.origin);
            window.close();
          } else {
            navigate('/auth');
          }
          return;
        }
        
        if (data.session) {
          // Get the user's details
          await loadUser();
          
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
          window.opener.postMessage({ type: 'AUTH_ERROR', error: 'Unexpected error' }, window.location.origin);
          window.close();
        } else {
          navigate('/auth');
        }
      } finally {
        setIsProcessing(false);
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
        {isProcessing ? (
          <p className="text-gray-400 animate-pulse">Processing authentication...</p>
        ) : (
          <p className="text-gray-400">Authentication complete, redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
