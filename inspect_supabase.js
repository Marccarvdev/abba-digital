const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://asdkrhgstvsjfgaoyxbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_h3hg6NDxLFqKWq0UqnPP7g_xDRDviCZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log('Testing Supabase connection...');
  
  // Try querying invite_codes table
  try {
    const { data, error } = await supabase.from('invite_codes').select('*').limit(1);
    if (error) {
      console.log('Error querying invite_codes:', error.message);
    } else {
      console.log('Successfully queried invite_codes table! Data:', data);
    }
  } catch (err) {
    console.log('Exception querying invite_codes:', err);
  }

  // Try querying students table
  try {
    const { data, error } = await supabase.from('students').select('*').limit(1);
    if (error) {
      console.log('Error querying students:', error.message);
    } else {
      console.log('Successfully queried students table! Data:', data);
    }
  } catch (err) {
    console.log('Exception querying students:', err);
  }

  // Try querying teacher_generated_links table
  try {
    const { data, error } = await supabase.from('teacher_generated_links').select('*').limit(1);
    if (error) {
      console.log('Error querying teacher_generated_links:', error.message);
    } else {
      console.log('Successfully queried teacher_generated_links table! Data:', data);
    }
  } catch (err) {
    console.log('Exception querying teacher_generated_links:', err);
  }
}

inspect();
