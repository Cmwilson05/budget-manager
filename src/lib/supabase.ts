import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. \n' +
    'Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// We use a fallback to an empty string if keys are missing. 
// The Supabase client will throw a descriptive error when a request is actually made,
// which is often easier to debug than a silent failure with a placeholder URL.
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)

// Temporary connection test to verify configuration
supabase.auth.getSession().then(({ error }) => {
  if (error) {
    console.error('Supabase connection failed:', error.message)
  } else {
    console.log('Supabase connected successfully')
  }
})