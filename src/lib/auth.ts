import { create } from 'zustand';
import { supabase } from './supabase';

interface UserData {
  id: string;
  username: string;
  nickname: string;
  balance: number;
  keys?: string[];
  maps?: string[];
}

interface AuthState {
  user: UserData | null;
  session: any | null;
  isLoading: boolean;
  login: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
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
          user: newUser as UserData,
          isLoading: false 
        });
      } else {
        set({ 
          user: existingUser as UserData,
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
  
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      localStorage.removeItem('username');
      set({ user: null, session: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  loadUser: async () => {
    try {
      set({ isLoading: true });
      
      // First, check for Supabase session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        set({ isLoading: false });
        return;
      }
      
      if (sessionData?.session) {
        set({ session: sessionData.session });
        
        // Get user data from user_id table
        const { data: userData, error: userError } = await supabase
          .from('user_id')
          .select('*')
          .eq('id', sessionData.session.user.id)
          .single();
        
        if (userError) {
          console.error('Error loading user data:', userError);
          set({ isLoading: false });
          return;
        }
        
        if (userData) {
          set({ user: userData as UserData, isLoading: false });
          return;
        }
      }
      
      // Fallback to legacy username check
      const username = localStorage.getItem('username');
      
      if (username) {
        const { data: userData, error: userError } = await supabase
          .from('user_id')
          .select('*')
          .eq('username', username)
          .single();
        
        if (userError) {
          console.error('Error loading legacy user:', userError);
          localStorage.removeItem('username');
          set({ user: null, isLoading: false });
          return;
        }
        
        set({ user: userData as UserData, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({ isLoading: false });
    }
  },
  
  updateUserData: async () => {
    const { user, session } = get();
    if (!user) return;
    
    try {
      let query;
      
      if (session) {
        // If we have a session, use the id
        query = supabase
          .from('user_id')
          .select('*')
          .eq('id', user.id)
          .single();
      } else {
        // Otherwise use username (legacy)
        query = supabase
          .from('user_id')
          .select('*')
          .eq('username', user.username)
          .single();
      }
      
      const { data: userData, error: userError } = await query;
      
      if (userError) {
        console.error('Error updating user data:', userError);
        return;
      }
      
      if (userData) {
        set({ user: userData as UserData });
      }
    } catch (error) {
      console.error('Update user data error:', error);
    }
  }
}));
