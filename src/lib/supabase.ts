
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Main Supabase client
// Use the already configured client from the integrations folder
export const supabase = supabaseClient;

// Key storage Supabase client
const keyStorageUrl = 'https://eusxbcbwyhjtfjplwtst.supabase.co';
const keyStorageAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1c3hiY2J3eWhqdGZqcGx3dHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTEzOTksImV4cCI6MjA1OTkyNzM5OX0.d6DTqwlZ4X69orabNA0tzxrucsnVv531dqzUcsxum6E';

export const keyStorage = createClient(keyStorageUrl, keyStorageAnonKey);

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
  gameid: string; // Changed to string to match the actual data type
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
