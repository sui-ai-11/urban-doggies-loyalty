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

    var updates = { updated_at: new Date().toISOString() };
    if (body.accentColor) updates.accent_color = body.accentColor;
    if (body.borderColor) updates.border_color = body.borderColor;
    if (body.backgroundColor) updates.background_color = body.backgroundColor;
    if (body.cardBackground) updates.card_background = body.cardBackground;

    var { error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessID);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('update-business-colors error:', err);
    return res.status(500).json({ error: err.message });
  }
}
