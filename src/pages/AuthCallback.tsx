import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, getUser } from '../lib/auth';
import { supabase } from '../integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const session = await getSession();
        if (session) {
          const user = await getUser();
          if (user) {
            // ตรวจสอบว่ามี username ในตาราง user_id หรือไม่
            const { data, error } = await supabase
              .from('user_id')
              .select('username')
              .eq('id', user.id)
              .single();

            if (error || !data) {
              console.error('Error fetching user_id:', error);
              navigate('/auth?error=user_not_found');
              return;
            }
            navigate('/');
          } else {
            navigate('/auth?error=no_user');
          }
        } else {
          navigate('/auth?error=no_session');
        }
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/auth?error=callback_failed');
      }
    };
    handleCallback();
  }, [navigate]);

  return <div>Loading...</div>;
}