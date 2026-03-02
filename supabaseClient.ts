import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://vhjibutzcakbqeydbzog.supabase.co';
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoamlidXR6Y2FrYnFleWRiem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0ODAyNTAsImV4cCI6MjA4ODA1NjI1MH0.Mivu3hoZY7f7NagQ2E4ibogAg24cgEQpxH7r5h08Bpo';

export const supabase = createClient(supabaseUrl, supabaseKey);
