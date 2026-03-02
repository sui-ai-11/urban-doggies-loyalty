import { supabase, getTenant } from './_lib/supabase.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    if (!businessID) return res.status(400).json({ error: 'No tenant' });

    var { pin, role } = req.body || {};
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    var { data: biz } = await supabase
      .from('businesses')
      .select('admin_pin, staff_pin')
      .eq('id', businessID)
      .single();

    if (!biz) return res.status(404).json({ error: 'Business not found' });

    var validPin = role === 'admin' ? (biz.admin_pin || '123456') : (biz.staff_pin || '000000');

    if (pin !== validPin) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate session token (valid for 24 hours)
    var token = crypto.randomBytes(32).toString('hex');
    var expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store session
    await supabase.from('sessions').upsert({
      token: token,
      business_id: businessID,
      role: role || 'staff',
      expires_at: expires,
    });

    return res.status(200).json({ success: true, sessionToken: token, role: role || 'staff' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
