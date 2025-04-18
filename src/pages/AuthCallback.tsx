import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const code = searchParams.get('code');

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
        if (error) {
          console.error('Error exchanging code for session:', error);
          throw error;
        }

        if (data.session) {
          setUser(data.session.user);
          toast({
            title: 'Success',
            description: 'Successfully logged in!',
          });
          if (window.opener) {
            window.opener.location.href = '/';
            window.close();
          } else {
            navigate('/');
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
  }, [searchParams, navigate, setUser, setIsLoading]);

  return <div>Loading...</div>;
}