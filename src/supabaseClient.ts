import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://asdkrhgstvsjfgaoyxbl.supabase.co';
const supabaseAnonKey = 'sb_publishable_h3hg6NDxLFqKWq0UqnPP7g_xDRDviCZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logUserAction = async (payload: {
  userName: string;
  userEmail: string;
  role: 'student' | 'teacher';
  actionType: string;
  actionDetails: string;
}) => {
  try {
    await supabase.from('user_actions_log').insert([
      {
        user_name: payload.userName,
        user_email: payload.userEmail,
        role: payload.role,
        action_type: payload.actionType,
        action_details: payload.actionDetails
      }
    ]);
  } catch (err) {
    console.warn('Erro ao registrar log de ação no Supabase:', err);
  }
};
