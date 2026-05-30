const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://asdksvstvsjfgaoyxbl.supabase.co'; // wait let's use the real URL from supabaseClient.ts
const realUrl = 'https://asdkrhgstvsjfgaoyxbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_h3hg6NDxLFqKWq0UqnPP7g_xDRDviCZ';

const supabase = createClient(realUrl, supabaseAnonKey);

async function inspect() {
  const tables = ['active_codes', 'student_invite_codes', 'invite_codes', 'student_access_codes', 'teacher_generated_links', 'students'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}': ERROR: ${error.message}`);
      } else {
        console.log(`Table '${table}': SUCCESS! Rows:`, data);
      }
    } catch (err) {
      console.log(`Table '${table}': EXCEPTION:`, err);
    }
  }
}

inspect();
