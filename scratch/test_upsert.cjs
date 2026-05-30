const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://asdkrhgstvsjfgaoyxbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_h3hg6NDxLFqKWq0UqnPP7g_xDRDviCZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const dbPayload = {
    id: 'st-TEST12345',
    name: 'Luan Souza',
    class: 'Turma A - 3º Ano',
    img: 'https://res.cloudinary.com/dudmozd8z/image/upload/v1780092946/foto-do-perfil_isq9nr.avif',
    progress: 0,
    matricula: 'CGLQYH',
    gender: 'M',
    email: '', // our current empty string email
    last_access_at: null,
    login_method: 'code'
  };

  const { data, error } = await supabase
    .from('students')
    .upsert([dbPayload], { onConflict: 'id' });

  if (error) {
    console.log('UPSERT ERROR:', error);
  } else {
    console.log('UPSERT SUCCESS:', data);
  }
}

test();
