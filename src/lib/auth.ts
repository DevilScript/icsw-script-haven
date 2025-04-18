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
const initializeAuth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Initial session:', { data, error }); // Debug log
    if (error) {
      console.error('Error fetching initial session:', error);
      useAuthStore.getState().setIsLoading(false);
      return;
    }
    if (data.session) {
      useAuthStore.getState().setUser(data.session.user);
      await fetchNickname(data.session.user.id);
    }
    useAuthStore.getState().setIsLoading(false);
  } catch (err) {
    console.error('Unexpected error initializing auth:', err);
    useAuthStore.getState().setIsLoading(false);
  }
};

// Fetch nickname from user_id
const fetchNickname = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_id')
      .select('nickname')
      .eq('id', userId)
      .single();
    console.log('Nickname fetch:', { data, error }); // Debug log
    if (error) {
      console.error('Error fetching nickname:', error);
    } else {
      useAuthStore.getState().setNickname(data?.nickname || null);
    }
  } catch (err) {
    console.error('Unexpected error fetching nickname:', err);
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', { event, session }); // Debug log
  try {
    useAuthStore.getState().setUser(session?.user ?? null);
    if (session?.user) {
      await fetchNickname(session.user.id);
    } else {
      useAuthStore.getState().setNickname(null);
    }
    useAuthStore.getState().setIsLoading(false);
  } catch (err) {
    console.error('Error handling auth state change:', err);
    useAuthStore.getState().setIsLoading(false);
  }
});

// Start initialization
initializeAuth();

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
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw new Error('ไม่สามารถออกจากระบบได้ กรุณาลองใหม่');
    }
  } catch (err) {
    console.error('Unexpected error during sign out:', err);
    throw err;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    return data.user;
  } catch (err) {
    console.error('Unexpected error getting user:', err);
    return null;
  }
}