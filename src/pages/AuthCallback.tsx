import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        // ปิด popup และ redirect หน้าหลักไปยังหน้าเดิม
        if (window.opener) {
          window.opener.focus();
          window.close();
        } else {
          navigate('/auth');
        }
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
        return;
      }

      try {
        // แลก code กับ session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Error exchanging code for session:', error);
          throw error;
        }

        if (data.session) {
          toast({
            title: 'Success',
            description: 'Successfully logged in!',
          });
          // ปิด popup และ redirect หน้า opener ไปยังหน้าแรก
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
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return <div>Loading...</div>;
}