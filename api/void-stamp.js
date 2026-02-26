import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var businessID = await getTenant(req);
    var { token } = req.body;

    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Find client
    var { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id, name')
      .eq('token', token)
      .eq('business_id', businessID)
      .single();

    if (clientErr || !client) return res.status(404).json({ error: 'Client not found' });

    // Find last active visit
    var { data: lastVisit, error: visitErr } = await supabase
      .from('visits')
      .select('id')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('visited_at', { ascending: false })
      .limit(1)
      .single();

    if (visitErr || !lastVisit) return res.status(404).json({ error: 'No stamps to void' });

    // Void the visit
    await supabase
      .from('visits')
      .update({ status: 'VOIDED', notes: 'Voided at ' + new Date().toISOString() })
      .eq('id', lastVisit.id);

    // Count remaining active visits
    var { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'active');

    var totalVisits = count || 0;

    // Revoke any milestone coupons that are above the new stamp count
    var { data: biz } = await supabase
      .from('businesses')
      .select('milestones_json, stamps_required')
      .eq('id', businessID)
      .single();

    var milestones = (biz && biz.milestones_json) || [];
    var stampsRequired = (biz && biz.stamps_required) || 10;

    // Check if we need to revoke milestone coupons
    if (Array.isArray(milestones)) {
      for (var i = 0; i < milestones.length; i++) {
        var ms = milestones[i];
        if (ms.position && ms.position > totalVisits % stampsRequired) {
          // Void unclaimed milestone coupons above current stamp count
          await supabase
            .from('coupons')
            .update({ redeemed: 'VOIDED' })
            .eq('client_id', client.id)
            .eq('type', 'milestone')
            .eq('redeemed', 'FALSE')
            .ilike('text', '%' + (ms.label || '') + '%');
        }
      }
    }

    // Update Google Wallet pass (non-blocking)
    var currentCardStamps = totalVisits % stampsRequired;
    var cardsCompleted = Math.floor(totalVisits / stampsRequired);

    return res.status(200).json({
      success: true,
      totalVisits: totalVisits,
      message: 'Last stamp voided for ' + client.name,
    });
  } catch (err) {
    console.error('void-stamp error:', err);
    return res.status(500).json({ error: err.message });
  }
}
