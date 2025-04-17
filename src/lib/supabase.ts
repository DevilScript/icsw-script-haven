
import { createClient } from '@supabase/supabase-js';

// Main Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Key storage Supabase client
const keyStorageUrl = 'https://eusxbcbwyhjtfjplwtst.supabase.co';
const keyStorageAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3hiY2J3eWhqdGZqcGx3dHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTEzOTksImV4cCI6MjA1OTkyNzM5OX0.d6DTqwlZ4X69orabNA0tzxrucsnVv531dqzUcsxum6E';

export const keyStorage = createClient(keyStorageUrl, keyStorageAnonKey);

// Types from Supabase
export interface UserData {
  id: number;
  discord_username: string;
  balance: number;
  key?: string;
  maps?: string[];
  created_at: string;
}

export interface MapData {
  id: number;
  name: string;
  price: number;
  function: string[];
  gameid: number;
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
