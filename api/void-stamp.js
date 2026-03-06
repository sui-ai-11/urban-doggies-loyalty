import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

    // Auth check
    var session = await verifySession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });
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

    var stampsRequired = (biz && biz.stamps_required) || 10;
    var currentStampInCard = totalVisits % stampsRequired;
    if (currentStampInCard === 0 && totalVisits > 0) currentStampInCard = stampsRequired;
    var currentCycle = Math.floor(totalVisits / stampsRequired) + 1;
    if (totalVisits > 0 && totalVisits % stampsRequired === 0) currentCycle = Math.floor(totalVisits / stampsRequired);

    // Parse milestones (supports tiered and array format)
    var milestones = [];
    try {
      var raw = (biz && biz.milestones_json) || '{}';
      var parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        milestones = parsed;
      } else if (typeof parsed === 'object') {
        // Tiered format: get milestones for current cycle
        var tierKey = String(currentCycle);
        if (parsed[tierKey]) milestones = parsed[tierKey];
        else if (parsed['3+'] && currentCycle >= 3) milestones = parsed['3+'];
        else {
          var keys = Object.keys(parsed).sort();
          if (keys.length > 0) milestones = parsed[keys[keys.length - 1]] || [];
        }
      }
    } catch(e) {}

    // Void ALL unclaimed coupons for this client that were auto-issued as milestones
    // if stamp count dropped below their milestone position
    if (milestones.length > 0) {
      for (var i = 0; i < milestones.length; i++) {
        var ms = milestones[i];
        var msAt = ms.at || ms.position || 0;
        if (msAt > currentStampInCard) {
          // This milestone is now above the stamp count — void its coupon if unclaimed
          var label = ms.label || ms.reward || '';
          if (label) {
            await supabase
              .from('coupons')
              .update({ redeemed: 'VOIDED', notes: 'Auto-voided: stamp voided below milestone' })
              .eq('client_id', client.id)
              .eq('business_id', businessID)
              .eq('redeemed', 'FALSE')
              .ilike('type', '%' + label + '%');

            // Also try matching on text field
            await supabase
              .from('coupons')
              .update({ redeemed: 'VOIDED', notes: 'Auto-voided: stamp voided below milestone' })
              .eq('client_id', client.id)
              .eq('business_id', businessID)
              .eq('redeemed', 'FALSE')
              .ilike('text', '%' + label + '%');
          }
        }
      }
    }

    // Also void any reward coupon if card completion was undone
    // (if stamp was at stampsRequired and now dropped below)
    if (currentStampInCard < stampsRequired) {
      var { data: rewardCoupons } = await supabase
        .from('coupons')
        .select('id')
        .eq('client_id', client.id)
        .eq('business_id', businessID)
        .eq('redeemed', 'FALSE')
        .ilike('notes', '%completing card%');

      if (rewardCoupons && rewardCoupons.length > 0) {
        // Only void the most recent one
        await supabase
          .from('coupons')
          .update({ redeemed: 'VOIDED', notes: 'Auto-voided: stamp voided, card no longer complete' })
          .eq('id', rewardCoupons[rewardCoupons.length - 1].id);
      }
    }

    // Update Google Wallet pass (non-blocking)
    var currentCardStamps = totalVisits % stampsRequired;
    var cardsCompleted = Math.floor(totalVisits / stampsRequired);

    return res.status(200).json({
      success: true,
      totalVisits: totalVisits,
      remainingVisits: totalVisits,
      message: 'Last stamp voided for ' + client.name,
    });
  } catch (err) {
    console.error('void-stamp error:', err);
    return res.status(500).json({ error: err.message });
  }
}
