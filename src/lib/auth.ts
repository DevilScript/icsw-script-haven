
import { create } from 'zustand';
import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string; // This is used consistently throughout the app
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
  }
}));
