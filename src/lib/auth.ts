import { create } from 'zustand';
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  balance: number;
  keys?: string[];
  maps?: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (username: string) => {
    try {
      set({ isLoading: true });
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_id')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking user:', fetchError);
        toast({
          title: 'Error',
          description: 'Failed to check user existence.',
          variant: 'destructive',
        });
        return false;
      }

      // If user doesn't exist, create a new one
      if (!existingUser) {
        const { data: newUser, error: insertError } = await supabase
          .from('user_id')
          .insert([
            { username: username, balance: 0 }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          toast({
            title: 'Error',
            description: 'Failed to create new user.',
            variant: 'destructive',
          });
          return false;
        }

        set({ 
          user: newUser as User,
          isLoading: false 
        });
      } else {
        set({ 
          user: existingUser as User,
          isLoading: false 
        });
      }

      // Save to local storage
      localStorage.setItem('username', username);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred during login.',
        variant: 'destructive',
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('username');
    set({ user: null });
  },
  loadUser: async () => {
    try {
      set({ isLoading: true });
      const username = localStorage.getItem('username');

      if (!username) {
        set({ isLoading: false });
        return;
      }

      const { data: user, error } = await supabase
        .from('user_id')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('username');
        set({ user: null, isLoading: false });
        return;
      }

      set({ user: user as User, isLoading: false });
    } catch (error) {
      console.error('Load user error:', error);
      set({ isLoading: false });
    }
  },
  signInWithDiscord: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('Discord OAuth error:', error);
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.url) {
        const popup = window.open(data.url, 'oauth_popup', 'width=600,height=600');
        if (!popup) {
          toast({
            title: 'Error',
            description: 'Unable to open authentication popup. Please allow popups.',
            variant: 'destructive',
          });
          return;
        }

        const checkPopupClosed = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkPopupClosed);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
              toast({
                title: 'Error',
                description: 'Discord authentication failed. Please try again.',
                variant: 'destructive',
              });
            } else {
              // ใช้ Discord username หรือ email เป็น username
              const username = session.user?.user_metadata?.name || session.user?.email?.split('@')[0] || 'discord_user';
              const loginSuccess = await useAuthStore.getState().login(username);
              if (loginSuccess) {
                toast({
                  title: 'Success',
                  description: 'Successfully logged in with Discord!',
                });
              } else {
                toast({
                  title: 'Error',
                  description: 'Failed to log in with Discord user.',
                  variant: 'destructive',
                });
              }
            }
            set({ isLoading: false });
          }
        }, 500);
      }
    } catch (error) {
      console.error('Unexpected error during Discord login:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      set({ isLoading: false });
    }
  },
}));

// Initialize auth state
useAuthStore.getState().loadUser();