import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);

    // GET: List pending clients
    if (req.method === 'GET') {
      var { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessID)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      var pending = (data || []).map(function(c) {
        return {
          clientID: c.id,
          name: c.name,
          token: c.token,
          mobile: c.mobile,
          email: c.email,
          birthday: c.birthday,
          birthdayMonth: c.birthday_month,
          dateAdded: c.created_at,
        };
      });

      return res.status(200).json({ pending });
    }

    // POST: Approve or reject
    if (req.method === 'POST') {
      var body = req.body || {};
      var clientID = body.clientID;
      var action = body.action || 'approve';

      if (!clientID) return res.status(400).json({ error: 'clientID required' });

      var newStatus = action === 'reject' ? 'rejected' : 'approved';

      var { error: updateErr } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientID)
        .eq('business_id', businessID);

      if (updateErr) return res.status(500).json({ error: updateErr.message });

      return res.status(200).json({ success: true, status: newStatus });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('approve-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
