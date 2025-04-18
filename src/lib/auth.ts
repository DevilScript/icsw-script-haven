import { create } from 'zustand';
import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const signInWithOAuth = async (provider: 'discord') => {
  try {
    useAuthStore.getState().setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true, // ป้องกัน redirect ในหน้าเว็บหลัก
      },
    });

    if (error) {
      console.error('OAuth sign-in error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    if (data.url) {
      const popup = window.open(data.url, 'oauth_popup', 'width=600,height=600');
      if (!popup) {
        toast({
          title: 'Error',
          description: 'Unable to open authentication popup. Please allow popups for this site.',
          variant: 'destructive',
        });
        return { error: new Error('Popup blocked') };
      }

      const checkPopupClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session) {
            toast({
              title: 'Error',
              description: 'Authentication failed. Please try again.',
              variant: 'destructive',
            });
          } else {
            useAuthStore.getState().setUser(session.user);
            toast({
              title: 'Success',
              description: 'Successfully logged in!',
            });
          }
          useAuthStore.getState().setIsLoading(false);
        }
      }, 500);
    }

    return { data };
  } catch (error) {
    console.error('Unexpected error during OAuth sign-in:', error);
    toast({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
    useAuthStore.getState().setIsLoading(false);
    return { error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    useAuthStore.getState().setUser(null);
    window.location.href = '/auth';
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    toast({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
  }
};

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    useAuthStore.getState().setUser(session.user);
  }
});