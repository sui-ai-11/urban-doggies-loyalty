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
      .select('stamps_required')
      .eq('id', businessID)
      .single();

    var stampsRequired = (biz && biz.stamps_required) || 10;
    var currentProgress = totalVisits % stampsRequired;
    var currentCycle = Math.floor(totalVisits / stampsRequired) + 1;
    if (totalVisits > 0 && totalVisits % stampsRequired === 0) {
      currentProgress = stampsRequired;
      currentCycle = Math.floor(totalVisits / stampsRequired);
    }

    // Get ALL coupons for this client (including claimed ones)
    var { data: clientCoupons } = await supabase
      .from('coupons')
      .select('id, notes, redeemed')
      .eq('client_id', client.id)
      .eq('business_id', businessID);

    // Delete milestone coupons that are now above the stamp count
    for (var ci = 0; ci < (clientCoupons || []).length; ci++) {
      var coupon = clientCoupons[ci];
      if (coupon.redeemed === 'VOIDED') continue; // already voided, skip
      var notes = coupon.notes || '';
      var match = notes.match(/milestone_(\d+)_cycle_(\d+)/);
      if (!match) continue;

      var msPosition = parseInt(match[1]);
      var msCycle = parseInt(match[2]);

      // Delete if position is now above current progress, or cycle is above current
      if ((msCycle === currentCycle && msPosition > currentProgress) || msCycle > currentCycle) {
        await supabase
          .from('coupons')
          .delete()
          .eq('id', coupon.id);
      }
    }

    // Also delete card completion reward if card is no longer complete
    if (currentProgress < stampsRequired && currentProgress > 0) {
      var { data: rewardCoupons } = await supabase
        .from('coupons')
        .select('id')
        .eq('client_id', client.id)
        .eq('business_id', businessID)
        .neq('redeemed', 'VOIDED')
        .ilike('notes', '%completing card%');

      if (rewardCoupons && rewardCoupons.length > 0) {
        await supabase
          .from('coupons')
          .delete()
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
