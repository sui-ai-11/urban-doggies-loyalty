import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    
    // No tenant = bare domain = show landing page
    if (!businessID) {
      return res.status(200).json({ isLanding: true });
    }

    var { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessID)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Business not found' });

    // Map DB columns to frontend camelCase (same keys the frontend expects)
    return res.status(200).json({
      businessID: data.id,
      businessName: data.business_name,
      tagline: data.tagline,
      logo: data.logo,
      accentColor: data.accent_color,
      borderColor: data.border_color,
      backgroundColor: data.background_color,
      cardBackground: data.card_background,
      stampsRequired: data.stamps_required,
      rewardDescription: data.reward_description,
      stampFilledIcon: data.stamp_filled_icon,
      progressText: data.progress_text,
      milestonesJson: JSON.stringify(data.milestones_json || []),
      milestone1Label: data.milestone1_label,
      milestone1Description: data.milestone1_description,
      milestone1Position: data.milestone1_position,
      milestone1Icon: data.milestone1_icon,
      milestone2Label: data.milestone2_label,
      milestone2Description: data.milestone2_description,
      milestone2Position: data.milestone2_position,
      milestone2Icon: data.milestone2_icon,
      navButton1Text: data.nav_button1_text,
      navButton2Text: data.nav_button2_text,
      navButton3Text: data.nav_button3_text,
      chatLabel: data.chat_label,
      chatLink: data.chat_link,
      supportText: data.support_text,
      termsURL: data.terms_url,
      contactEmail: data.contact_email,
      navButton1Contact: data.nav_button1_contact,
      callLabel: data.call_label,
      feedbackLabel: data.feedback_label,
      adImageUrl: data.ad_image_url,
      customFieldLabel: data.custom_field_label,
      adminPin: data.admin_pin,
      staffPin: data.staff_pin,
      staffList: data.staff_list || '',
      branchList: data.branch_list || '',
    });
  } catch (err) {
    console.error('get-business-info error:', err);
    return res.status(500).json({ error: err.message });
  }
}
