import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

function generateID(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

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
    var { token, addedBy, staffName, branch } = req.body;

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

    // Add visit
    var visitID = generateID('VIS_');
    var { error: visitErr } = await supabase.from('visits').insert({
      id: visitID,
      client_id: client.id,
      business_id: businessID,
      added_by: addedBy || 'staff',
      staff_name: staffName || '',
      branch: branch || '',
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

    // Try tiered milestones first — just detect if milestone reached (no auto-coupon)
    if (milestonesJson) {
      try {
        // JSONB column may already be parsed object, or could be string
        var parsed = typeof milestonesJson === 'string' ? JSON.parse(milestonesJson) : milestonesJson;
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

        // Check if current stamp hits a milestone — report it but don't auto-create coupon
        // Staff will use "Give & Claim" on the Loyalty Desk
        var matchedMilestone = milestones.find(function(m) {
          var pos = m.at || m.position || 0;
          return pos === stampInCard;
        });

        if (matchedMilestone) {
          milestoneReward = matchedMilestone.label || matchedMilestone.reward || matchedMilestone.text || 'Milestone Reward';
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
        staff_name: staffName || '',
        branch: branch || '',
      });
      milestoneReward = rewardDescription;
    }


    // Referral reward: on first stamp, issue 50% OFF to referrer
    if (totalVisits === 1 && client.referred_by) {
      var { data: biz } = await supabase
        .from('businesses')
        .select('features')
        .eq('id', businessID)
        .single();

      if (biz && biz.features && biz.features.referrals) {
        // Find the referrer by token
        var { data: referrer } = await supabase
          .from('clients')
          .select('id, name, token')
          .eq('business_id', businessID)
          .eq('token', client.referred_by)
          .single();

        if (referrer) {
          var refCouponID = 'CPN_REF_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
          await supabase.from('coupons').insert({
            id: refCouponID,
            business_id: businessID,
            client_id: referrer.id,
            type: '50% OFF Next Grooming — Referral Reward',
            redeemed: 'FALSE',
            notes: 'Referral reward: ' + client.name + ' completed first visit',
          });
        }
      }
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
