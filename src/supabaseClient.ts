import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rtkzyqzxfwslgbovidfx.supabase.co';
const supabaseAnonKey = 'sb_publishable_Uw4DGNmgyqI3pEF-pAfWRA_vcawl_--';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
