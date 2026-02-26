import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    var token = req.query.token;

    if (!token) return res.status(400).json({ error: 'Token is required' });

    // Get client
    var { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('token', token)
      .single();

    if (clientErr || !client) return res.status(404).json({ error: 'Client not found' });

    // Use client's business_id (in case token lookup crosses tenants)
    var clientBusinessID = client.business_id || businessID;

    // Get business info
    var { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', clientBusinessID)
      .single();

    // Get active visits
    var { data: visits } = await supabase
      .from('visits')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('visited_at', { ascending: true });

    var totalVisits = (visits || []).length;

    // Get coupons for this client only (no global)
    var { data: coupons } = await supabase
      .from('coupons')
      .select('*')
      .eq('client_id', client.id)
      .order('issued_at', { ascending: false });

    var mappedCoupons = (coupons || []).map(function(c) {
      return {
        couponID: c.id,
        clientName: c.client_name,
        type: c.type,
        text: c.text,
        issuedAt: c.issued_at,
        expiryDate: c.expiry_date,
        redeemed: c.redeemed || 'FALSE',
        redeemedAt: c.redeemed_at || '',
        notes: c.notes || '',
        qrCode: c.qr_code || '',
      };
    });

    // Map business data
    var businessData = biz ? {
      businessID: biz.id,
      businessName: biz.business_name,
      tagline: biz.tagline,
      logo: biz.logo,
      accentColor: biz.accent_color,
      borderColor: biz.border_color,
      backgroundColor: biz.background_color,
      cardBackground: biz.card_background,
      stampsRequired: biz.stamps_required,
      rewardDescription: biz.reward_description,
      stampFilledIcon: biz.stamp_filled_icon,
      progressText: biz.progress_text,
      milestonesJson: JSON.stringify(biz.milestones_json || []),
      milestone1Label: biz.milestone1_label,
      milestone1Description: biz.milestone1_description,
      milestone1Position: biz.milestone1_position,
      milestone1Icon: biz.milestone1_icon,
      milestone2Label: biz.milestone2_label,
      milestone2Description: biz.milestone2_description,
      milestone2Position: biz.milestone2_position,
      milestone2Icon: biz.milestone2_icon,
      navButton1Text: biz.nav_button1_text,
      navButton2Text: biz.nav_button2_text,
      navButton3Text: biz.nav_button3_text,
      chatLabel: biz.chat_label,
      chatLink: biz.chat_link,
      supportText: biz.support_text,
      termsURL: biz.terms_url,
      contactEmail: biz.contact_email,
      navButton1Contact: biz.nav_button1_contact,
      callLabel: biz.call_label,
      feedbackLabel: biz.feedback_label,
      adImageUrl: biz.ad_image_url,
    } : {};

    var stampsRequired = (biz && biz.stamps_required) || 10;
    var currentProgress = totalVisits % stampsRequired;

    return res.status(200).json({
      client: {
        clientID: client.id,
        name: client.name,
        token: client.token,
        mobile: client.mobile || '',
        email: client.email || '',
        birthday: client.birthday || '',
        birthdayMonth: client.birthday_month || '',
        status: client.status || 'approved',
      },
      business: Object.assign({}, businessData, {
        requiredVisits: stampsRequired,
      }),
      loyalty: {
        totalVisits: totalVisits,
        currentProgress: currentProgress,
        stampsRequired: stampsRequired,
      },
      visits: (visits || []).map(function(v) {
        return {
          visitID: v.id,
          date: v.visited_at,
          addedBy: v.added_by,
        };
      }),
      totalVisits: totalVisits,
      coupons: mappedCoupons,
    });
  } catch (err) {
    console.error('client-dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
}
