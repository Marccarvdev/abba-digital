const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://asdkrhgstvsjfgaoyxbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_h3hg6NDxLFqKWq0UqnPP7g_xDRDviCZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('students').select('*');
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('ALL STUDENTS:', data);
  }
}

test();
