import { create } from 'zustand';
import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  discord_username: string;
  balance: number;
  key?: string;
  maps?: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (discordUsername: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (discordUsername: string) => {
    try {
      set({ isLoading: true });
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('user_id')
        .select('*')
        .eq('discord_username', discordUsername)
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
            { discord_username: discordUsername, balance: 0 }
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
      localStorage.setItem('discord_username', discordUsername);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    localStorage.removeItem('discord_username');
    set({ user: null });
  },
  loadUser: async () => {
    try {
      set({ isLoading: true });
      const discordUsername = localStorage.getItem('discord_username');

      if (!discordUsername) {
        set({ isLoading: false });
        return;
      }

      const { data: user, error } = await supabase
        .from('user_id')
        .select('*')
        .eq('discord_username', discordUsername)
        .single();

      if (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('discord_username');
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
