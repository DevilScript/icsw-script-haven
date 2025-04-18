import { supabase } from './supabase';
import { toast } from '@/hooks/use-toast';

export const signInWithOAuth = async (provider: 'discord') => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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

    // ตรวจสอบว่า popup ถูกเปิดหรือไม่
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

      // เพิ่มการตรวจสอบเมื่อ popup ปิด
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          // ตรวจสอบ session หลังจาก popup ปิด
          supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error || !session) {
              toast({
                title: 'Error',
                description: 'Authentication failed. Please try again.',
                variant: 'destructive',
              });
            }
          });
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
    return { error };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
    return;
  }
  window.location.href = '/auth';
};