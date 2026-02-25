import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);

    // Get all clients
    var { data: clients, error: cErr } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', businessID)
      .order('created_at', { ascending: false });

    if (cErr) return res.status(500).json({ error: cErr.message });

    // Get all active visits for counting
    var { data: visits, error: vErr } = await supabase
      .from('visits')
      .select('client_id')
      .eq('business_id', businessID)
      .eq('status', 'active');

    if (vErr) return res.status(500).json({ error: vErr.message });

    // Count visits per client
    var visitCounts = {};
    (visits || []).forEach(function(v) {
      visitCounts[v.client_id] = (visitCounts[v.client_id] || 0) + 1;
    });

    // Get birthday months
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var birthdayMonths = months.filter(function(month) {
      return (clients || []).some(function(c) { return c.birthday_month === month; });
    });

    var origin = req.headers.origin || req.headers.referer || 'https://loyaltyv1.vercel.app';

    var result = (clients || [])
      .filter(function(c) { return (c.status || '').toLowerCase() !== 'rejected'; })
      .map(function(c) {
        return {
          clientID: c.id,
          businessID: c.business_id,
          name: c.name,
          token: c.token,
          mobile: c.mobile || '',
          email: c.email || '',
          birthday: c.birthday || '',
          birthdayMonth: c.birthday_month || '',
          dateAdded: c.created_at || '',
          notes: c.notes || '',
          status: c.status || 'approved',
          visits: visitCounts[c.id] || 0,
          requiredVisits: 10,
          cardLink: origin.replace(/\/$/, '') + '/#/card?token=' + c.token,
        };
      });

    return res.status(200).json({
      clients: result,
      birthdayMonths: birthdayMonths,
    });
  } catch (err) {
    console.error('get-all-clients error:', err);
    return res.status(500).json({ error: err.message });
  }
}
