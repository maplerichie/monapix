// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ivbrltzjdqdvffbwbwvb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YnJsdHpqZHFkdmZmYndid3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjQ3MzUsImV4cCI6MjA2NDAwMDczNX0.waApW5ZzDxR5KJ40GH5skA0ytToaXW2hneFrSP2MIn8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);