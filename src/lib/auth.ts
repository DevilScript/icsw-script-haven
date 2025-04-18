import { supabase } from './supabase';
import { useAuthStore } from './auth';

export async function signInWithDiscord() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: 'https://ifmrpxcnhebocyvcbcpn.supabase.co/auth/v1/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('Discord Auth Error:', error);
      throw error;
    }

    if (data.url) {
      const popup = window.open(data.url, 'discordAuth', 'width=600,height=600');
      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }
    }
  } catch (error) {
    console.error('SignInWithDiscord error:', error);
    throw error;
  }
}

export async function syncUserAfterAuth(session: any) {
  try {
    const { data: userData, error } = await supabase
      .from('user_id')
      .select('id, username, balance, keys, maps')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
      throw error;
    }

    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('user_id')
        .insert([
          {
            id: session.user.id,
            username: session.user.user_metadata.name || 'discord_user_' + session.user.id.slice(0, 8),
            balance: 0,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }

      useAuthStore.setState({ user: newUser, isLoading: false });
    } else {
      useAuthStore.setState({ user: userData, isLoading: false });
    }
  } catch (error) {
    console.error('Sync user error:', error);
    throw error;
  }
}