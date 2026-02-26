import { supabase, getTenant } from './_lib/supabase.js';
import { updateWalletPass } from './_lib/wallet.js';

function generateID(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var businessID = await getTenant(req);
    var { token, addedBy } = req.body;

    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Find client
    var { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('token', token)
      .eq('business_id', businessID)
      .single();

    if (clientErr || !client) return res.status(404).json({ error: 'Client not found' });

    // Spam prevention: check last stamp time
    var { data: recentVisits } = await supabase
      .from('visits')
      .select('visited_at')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('visited_at', { ascending: false })
      .limit(1);

    if (recentVisits && recentVisits.length > 0) {
      var lastVisit = new Date(recentVisits[0].visited_at);
      var now = new Date();
      var diffMinutes = (now - lastVisit) / (1000 * 60);
      if (diffMinutes < 1) {
        return res.status(429).json({ error: 'Please wait at least 1 minute between stamps.' });
      }
    }

    // Add visit
    var visitID = generateID('VIS_');
    var { error: visitErr } = await supabase.from('visits').insert({
      id: visitID,
      client_id: client.id,
      business_id: businessID,
      added_by: addedBy || 'staff',
      notes: '',
      status: 'active',
    });

    if (visitErr) return res.status(500).json({ error: visitErr.message });

    // Count total active visits
    var { count } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'active');

    var totalVisits = count || 0;

    // Get business settings for reward
    var { data: biz } = await supabase
      .from('businesses')
      .select('stamps_required, reward_description, milestones_json')
      .eq('id', businessID)
      .single();

    var stampsRequired = (biz && biz.stamps_required) || 10;
    var rewardDescription = (biz && biz.reward_description) || '';

    // Check if milestone reached and auto-create coupon
    var milestoneReward = null;
    if (rewardDescription && totalVisits > 0 && totalVisits % stampsRequired === 0) {
      var couponID = generateID('CPN_');
      await supabase.from('coupons').insert({
        id: couponID,
        business_id: businessID,
        client_id: client.id,
        client_name: client.name,
        type: 'reward',
        text: rewardDescription,
        notes: 'Auto-reward for completing card',
      });
      milestoneReward = rewardDescription;
    }

    // Update Google Wallet pass (non-blocking)
    var currentCardStamps = totalVisits % stampsRequired;
    var cardsCompleted = Math.floor(totalVisits / stampsRequired);
    updateWalletPass(client.token, currentCardStamps, totalVisits, cardsCompleted, 0)
      .catch(function(e) { console.log('Wallet update skipped:', e.message); });

    return res.status(200).json({
      success: true,
      visitID: visitID,
      totalVisits: totalVisits,
      client: {
        clientID: client.id,
        name: client.name,
        token: client.token,
        email: client.email,
      },
      milestoneReward: milestoneReward,
    });
  } catch (err) {
    console.error('add-stamp error:', err);
    return res.status(500).json({ error: err.message });
  }
}
