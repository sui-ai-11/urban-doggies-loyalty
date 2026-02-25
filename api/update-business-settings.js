import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var businessID = await getTenant(req);
    var body = req.body || {};

    // Map frontend camelCase to DB snake_case
    var fieldMap = {
      businessName: 'business_name',
      tagline: 'tagline',
      logo: 'logo',
      accentColor: 'accent_color',
      borderColor: 'border_color',
      backgroundColor: 'background_color',
      cardBackground: 'card_background',
      stampsRequired: 'stamps_required',
      rewardDescription: 'reward_description',
      stampFilledIcon: 'stamp_filled_icon',
      progressText: 'progress_text',
      milestonesJson: 'milestones_json',
      milestone1Label: 'milestone1_label',
      milestone1Description: 'milestone1_description',
      milestone1Position: 'milestone1_position',
      milestone1Icon: 'milestone1_icon',
      milestone2Label: 'milestone2_label',
      milestone2Description: 'milestone2_description',
      milestone2Position: 'milestone2_position',
      milestone2Icon: 'milestone2_icon',
      navButton1Text: 'nav_button1_text',
      navButton2Text: 'nav_button2_text',
      navButton3Text: 'nav_button3_text',
      chatLabel: 'chat_label',
      chatLink: 'chat_link',
      supportText: 'support_text',
      termsURL: 'terms_url',
      contactEmail: 'contact_email',
      navButton1Contact: 'nav_button1_contact',
      callLabel: 'call_label',
      feedbackLabel: 'feedback_label',
      adImageUrl: 'ad_image_url',
      customFieldLabel: 'custom_field_label',
      adminPin: 'admin_pin',
      staffPin: 'staff_pin',
    };

    var updates = { updated_at: new Date().toISOString() };
    var fields = body.fields || body;

    for (var key in fields) {
      if (fieldMap[key]) {
        var val = fields[key];
        // Parse milestones JSON if it's a string
        if (key === 'milestonesJson' && typeof val === 'string') {
          try { val = JSON.parse(val); } catch(e) { val = []; }
        }
        // Parse integers
        if (key === 'stampsRequired' || key === 'milestone1Position' || key === 'milestone2Position') {
          val = parseInt(val) || 0;
        }
        updates[fieldMap[key]] = val;
      }
    }

    var { error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessID);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('update-business-settings error:', err);
    return res.status(500).json({ error: err.message });
  }
}
