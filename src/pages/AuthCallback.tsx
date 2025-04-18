import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setIsLoading, login } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const code = searchParams.get('code');

      console.log('Callback params:', { error, errorDescription, code }); // Debug

      if (error || errorDescription) {
        console.error('Auth callback error:', { error, errorDescription });
        toast({
          title: 'Authentication Error',
          description: errorDescription || 'An error occurred during authentication.',
          variant: 'destructive',
        });
        if (window.opener) {
          window.opener.focus();
          window.close();
        } else {
          navigate('/auth');
        }
        setIsLoading(false);
        return;
      }

      if (!code) {
        console.warn('No authentication code received');
        toast({
          title: 'Error',
          description: 'No authentication code received. Please try again.',
          variant: 'destructive',
        });
        if (window.opener) {
          window.opener.focus();
          window.close();
        } else {
          navigate('/auth');
        }
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('Exchange session:', data, 'Error:', error); // Debug
        if (error) {
          console.error('Error exchanging code for session:', error);
          throw error;
        }

        if (data.session) {
          const username = data.session.user?.user_metadata?.name || data.session.user?.email?.split('@')[0] || 'discord_user';
          console.log('Logging in with username:', username); // Debug
          const loginSuccess = await login(username);
          if (loginSuccess) {
            toast({
              title: 'Success',
              description: 'Successfully logged in with Discord!',
            });
            if (window.opener) {
              window.opener.location.href = '/';
              window.close();
            } else {
              navigate('/');
            }
          } else {
            toast({
              title: 'Error',
              description: 'Failed to log in with Discord user.',
              variant: 'destructive',
            });
            if (window.opener) {
              window.opener.focus();
              window.close();
            } else {
              navigate('/auth');
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
        if (window.opener) {
          window.opener.focus();
          window.close();
        } else {
          navigate('/auth');
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login, setIsLoading]);

  return <div>Loading...</div>;
}