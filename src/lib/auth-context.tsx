import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

interface AuthContextType {
  user: any | null;
  nickname: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  nickname: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ตรวจสอบ session เริ่มต้น
    async function fetchSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          setUser(data.session.user);
          // ดึง nickname จาก user_id
          const { data: profile, error: profileError } = await supabase
            .from('user_id')
            .select('nickname')
            .eq('id', data.session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            setNickname(profile?.nickname || null);
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setIsLoading(false);
      }
    }

    fetchSession();

    // ฟังการเปลี่ยนแปลงสถานะ auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // ดึง nickname เมื่อล็อกอิน
        supabase
          .from('user_id')
          .select('nickname')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Error fetching nickname:', error);
            } else {
              setNickname(data?.nickname || null);
            }
          });
      } else {
        setNickname(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, nickname, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}