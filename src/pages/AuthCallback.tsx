import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { syncUserAfterAuth } from '@/lib/auth';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        toast({
          title: 'Error',
          description: 'No authentication code received',
          variant: 'destructive',
        });
        if (window.opener) {
          window.opener.postMessage({ type: 'auth_error', message: 'No authentication code received' }, '*');
          window.close();
        } else {
          navigate('/');
        }
        return;
      }

      try {
        // แลก code เป็น session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        // Sync ข้อมูลผู้ใช้
        await syncUserAfterAuth(data.session);

        // ส่ง message ไปหน้าหลัก
        if (window.opener) {
          window.opener.postMessage({ type: 'auth_success', session: data.session }, '*');
          window.close();
        } else {
          navigate('/');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Authentication failed',
          variant: 'destructive',
        });
        if (window.opener) {
          window.opener.postMessage({ type: 'auth_error', message: error.message }, '*');
          window.close();
        } else {
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return <div>Loading...</div>;
};

export default AuthCallback;