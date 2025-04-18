import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from './auth';

// Main Supabase client
export const supabase = supabaseClient;

// Key storage Supabase client
const keyStorageUrl = 'https://eusxbcbwyhjtfjplwtst.supabase.co';
const keyStorageAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3hiY2J3eWhqdGZqcGx3dHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTEzOTksImV4cCI6MjA1OTkyNzM5OX0.d6DTqwlZ4X69orabNA0tzxrucsnVv531dqzUcsxum6E';
export const keyStorage = createClient(keyStorageUrl, keyStorageAnonKey);

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
      throw error;
    }

    if (data.url) {
      const popup = window.open(data.url, 'discordAuth', 'width=600,height=600');
      if (!popup) {
        throw new Error('Failed to open popup. Please allow popups for this site.');
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function syncUserAfterAuth(session: any) {
  try {
    const { data: userData, error } = await supabase
      .from('user_id')
      .select('id, username, balance, keys, maps, created_at')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
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
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      useAuthStore.setState({ user: newUser, isLoading: false });
    } else {
      useAuthStore.setState({ user: userData, isLoading: false });
    }
  } catch (error) {
    throw error;
  }
}

// Types from Supabase
export interface UserData {
  id: string;
  username: string;
  balance: number;
  keys?: string[];
  maps?: string[];
  created_at: string;
}

export interface MapData {
  id: number;
  name: string;
  price: number;
  function: string[];
  gameid: string;
}

export interface KeyData {
  id: number;
  key: string;
  exploit: string | null;
  hwid: string | null;
  status: string;
  days: number;
  allowed_place_ids: number[];
  maps: string[];
  allowexec: string[];
  created_at: string | null;
}