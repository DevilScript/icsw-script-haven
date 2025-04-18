import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';

interface AuthState {
  user: any | null;
  nickname: string | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setNickname: (nickname: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  nickname: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setNickname: (nickname) => set({ nickname }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// Initialize auth state
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Error fetching initial session:', error);
    useAuthStore.getState().setIsLoading(false);
    return;
  }
  if (data.session) {
    useAuthStore.getState().setUser(data.session.user);
    // Fetch nickname from user_id
    supabase
      .from('user_id')
      .select('nickname')
      .eq('id', data.session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching nickname:', error);
        } else {
          useAuthStore.getState().setNickname(data?.nickname || null);
        }
        useAuthStore.getState().setIsLoading(false);
      });
  } else {
    useAuthStore.getState().setIsLoading(false);
  }
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState().setUser(session?.user ?? null);
  if (session?.user) {
    supabase
      .from('user_id')
      .select('nickname')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching nickname:', error);
        } else {
          useAuthStore.getState().setNickname(data?.nickname || null);
        }
      });
  } else {
    useAuthStore.getState().setNickname(null);
  }
  useAuthStore.getState().setIsLoading(false);
});

export async function signInWithDiscord() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Discord sign-in error:', error);
      throw new Error('ไม่สามารถล็อกอินด้วย Discord ได้ กรุณาลองใหม่');
    }
  } catch (err) {
    console.error('Unexpected error during Discord sign-in:', err);
    throw err;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw new Error('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่');
  }
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
}