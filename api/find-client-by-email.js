import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    var email = req.query.email || '';
    var mobile = req.query.mobile || '';
    var token = req.query.token || '';

    if (!email && !mobile && !token) {
      return res.status(400).json({ error: 'Email, mobile, or token required' });
    }

    var query = supabase.from('clients').select('*').eq('business_id', businessID);

    if (token) {
      query = query.eq('token', token);
    } else if (mobile) {
      query = query.eq('mobile', mobile);
    } else {
      query = query.eq('email', email);
    }

    var { data, error } = await query.limit(1).single();

    if (error || !data) return res.status(404).json({ error: 'No client found' });

    return res.status(200).json({
      client: {
        clientID: data.id,
        name: data.name,
        token: data.token,
        mobile: data.mobile || '',
        email: data.email || '',
        status: data.status || 'approved',
      }
    });
  } catch (err) {
    console.error('find-client-by-email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
