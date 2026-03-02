import { supabase } from './supabase.js';

async function verifySession(req) {
  var authHeader = req.headers.authorization || '';
  var token = authHeader.replace('Bearer ', '');
  
  if (!token) return null;

  var { data } = await supabase
    .from('sessions')
    .select('business_id, role, expires_at')
    .eq('token', token)
    .single();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return { businessID: data.business_id, role: data.role };
}

export { verifySession };
