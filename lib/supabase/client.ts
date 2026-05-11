// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// We add fallback dummy strings here. 
// This prevents Next.js from crashing during 'npm run build' when env vars might be temporarily unavailable.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);