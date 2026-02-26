import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    var query = (req.query.q || req.query.name || '').trim();

    if (!query) return res.status(400).json({ error: 'Search query required' });

    // Search by token (exact), name (partial), or mobile (partial)
    var { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', businessID)
      .or('token.eq.' + query + ',name.ilike.%' + query + '%,mobile.ilike.%' + query + '%');

    if (error) return res.status(500).json({ error: error.message });

    // Filter out rejected
    var results = (data || []).filter(function(c) {
      return (c.status || '').toLowerCase() !== 'rejected';
    });

    if (results.length === 0) return res.status(404).json({ error: 'No client found' });

    // Get visits for matched clients
    var clientIDs = results.map(function(c) { return c.id; });
    var { data: visits } = await supabase
      .from('visits')
      .select('client_id')
      .in('client_id', clientIDs)
      .eq('status', 'active');

    var visitCounts = {};
    (visits || []).forEach(function(v) {
      visitCounts[v.client_id] = (visitCounts[v.client_id] || 0) + 1;
    });

    // Get business for stamps required
    var { data: biz } = await supabase.from('businesses').select('stamps_required').eq('id', businessID).single();
    var stampsRequired = (biz && biz.stamps_required) || 10;

    var mapped = results.map(function(c) {
      return {
        clientID: c.id,
        name: c.name,
        token: c.token,
        mobile: c.mobile || '',
        email: c.email || '',
        birthday: c.birthday || '',
        birthdayMonth: c.birthday_month || '',
        visits: visitCounts[c.id] || 0,
        stampsRequired: stampsRequired,
        status: c.status || 'approved',
      };
    });

    if (mapped.length === 1) {
      return res.status(200).json({ client: mapped[0] });
    }
    return res.status(200).json({ multiple: mapped });
  } catch (err) {
    console.error('search-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
