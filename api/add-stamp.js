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
      if (diffMinutes < 0.167) {
        return res.status(429).json({ error: 'Please wait at least 10 seconds between stamps.' });
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
    var milestonesJson = (biz && biz.milestones_json) || '';

    // Check if milestone reached and auto-create coupon
    var milestoneReward = null;
    var currentCardStamps = totalVisits % stampsRequired;
    var cardsCompleted = Math.floor(totalVisits / stampsRequired);
    var currentCycle = cardsCompleted + (currentCardStamps > 0 ? 1 : 0);
    var stampInCard = currentCardStamps === 0 ? stampsRequired : currentCardStamps;

    // Try tiered milestones first
    if (milestonesJson) {
      try {
        var parsed = JSON.parse(milestonesJson);
        var milestones = [];

        if (Array.isArray(parsed)) {
          milestones = parsed;
        } else {
          // Tiered format: { "1": [...], "2": [...] }
          var cycle = currentCycle || 1;
          if (parsed[String(cycle)]) {
            milestones = parsed[String(cycle)];
          } else {
            // Fallback to highest available tier
            var tierKeys = Object.keys(parsed).filter(function(k) { return !k.includes('_'); }).sort(function(a,b) { return parseInt(a)-parseInt(b); });
            for (var i = tierKeys.length - 1; i >= 0; i--) {
              if (parseInt(tierKeys[i]) <= cycle) {
                milestones = parsed[tierKeys[i]];
                break;
              }
            }
          }
        }

        // Check if current stamp hits a milestone
        var matchedMilestone = milestones.find(function(m) {
          return m.at === stampInCard || m.at === totalVisits;
        });

        if (matchedMilestone) {
          var couponID = generateID('CPN_');
          await supabase.from('coupons').insert({
            id: couponID,
            business_id: businessID,
            client_id: client.id,
            client_name: client.name,
            type: matchedMilestone.type || 'reward',
            text: matchedMilestone.reward || matchedMilestone.text || 'Milestone Reward',
            notes: 'Auto-reward at stamp ' + stampInCard + ' (Card ' + currentCycle + ')',
          });
          milestoneReward = matchedMilestone.reward || matchedMilestone.text || 'Milestone Reward';
        }
      } catch (e) {
        console.log('Milestone parse error:', e.message);
      }
    }

    // Fallback: simple reward at card completion
    if (!milestoneReward && rewardDescription && totalVisits > 0 && totalVisits % stampsRequired === 0) {
      var couponID2 = generateID('CPN_');
      await supabase.from('coupons').insert({
        id: couponID2,
        business_id: businessID,
        client_id: client.id,
        client_name: client.name,
        type: 'reward',
        text: rewardDescription,
        notes: 'Auto-reward for completing card',
      });
      milestoneReward = rewardDescription;
    }

    // Update Google Wallet pass (best-effort, don't block response)
    var walletStamps = totalVisits % stampsRequired;
    var walletCards = Math.floor(totalVisits / stampsRequired);
    // Count active coupons for wallet display
    var { count: activeCoupons } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('redeemed', 'FALSE');

    // Find next reward for wallet display
    var walletNextReward = '';
    if (milestonesJson) {
      try {
        var wp = JSON.parse(milestonesJson);
        var wm = [];
        var wc = walletCards + (walletStamps > 0 ? 1 : 0) || 1;
        if (Array.isArray(wp)) { wm = wp; }
        else if (wp[String(wc)]) { wm = wp[String(wc)]; }
        var wu = wm.filter(function(m) { return m.at > walletStamps; }).sort(function(a,b) { return a.at - b.at; });
        if (wu.length > 0) walletNextReward = wu[0].reward + ' (at stamp ' + wu[0].at + ')';
      } catch (e) {}
    }
    if (!walletNextReward && rewardDescription) {
      walletNextReward = rewardDescription + ' (at stamp ' + stampsRequired + ')';
    }
    if (!walletNextReward) walletNextReward = 'Complete ' + stampsRequired + ' stamps!';

    try {
      await updateWalletPass(client.token, walletStamps, totalVisits, walletCards, activeCoupons || 0, stampsRequired, walletNextReward);
    } catch (e) {
      console.log('Wallet update skipped:', e.message);
    }

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
