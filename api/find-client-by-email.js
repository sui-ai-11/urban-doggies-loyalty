import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    var token = req.query.token || '';
    var mobile = req.query.mobile || '';
    var birthday = req.query.birthday || '';

    // Token lookup — direct access (from saved links)
    if (token) {
      var { data: byToken } = await supabase.from('clients').select('token, name')
        .eq('business_id', businessID).eq('token', token).single();
      if (!byToken) return res.status(404).json({ error: 'No card found' });
      return res.status(200).json({ token: byToken.token, name: byToken.name });
    }

    // Mobile + birthday required for search
    if (!mobile || !birthday) {
      return res.status(400).json({ error: 'Please enter both mobile number and birthday' });
    }

    var { data, error } = await supabase.from('clients').select('token, name, birthday')
      .eq('business_id', businessID).eq('mobile', mobile).limit(1).single();

    if (error || !data) return res.status(404).json({ error: 'No card found with this mobile number' });

    // Verify birthday matches
    if (!data.birthday || data.birthday !== birthday) {
      return res.status(401).json({ error: 'Birthday does not match. Please try again.' });
    }

    return res.status(200).json({ token: data.token, name: data.name });
  } catch (err) {
    console.error('find-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
