import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../lib/auth'; 
import { supabase } from '../integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await getUser();
        if (user) {
          // ตรวจสอบว่ามีข้อมูลใน user_id
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
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/auth?error=callback_failed');
      }
    };
    handleCallback();
  }, [navigate]);

  return <div>Loading...</div>;
}