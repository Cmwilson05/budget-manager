import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Log to console to help debug blank screen issues
console.log('Supabase URL exists:', !!supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  // Instead of throwing an error that crashes the app white, log it
  console.error('Missing Supabase environment variables. Check your .env file.')
}

// Create client even if keys are missing to avoid immediate crash, 
// but auth calls will fail gracefully or we can handle it in UI
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true, // Ensure session persists
      autoRefreshToken: true,
    }
  }
)