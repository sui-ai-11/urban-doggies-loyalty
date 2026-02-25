import { supabase, getTenant } from './_lib/supabase.js';

function generateToken(length) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var result = '';
  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var businessID = await getTenant(req);
    var body = req.body || {};
    var name = (body.name || '').trim();

    if (!name) return res.status(400).json({ error: 'Name is required' });

    // Generate unique token
    var token = generateToken(8);
    var { data: existing } = await supabase.from('clients').select('token').eq('token', token);
    while (existing && existing.length > 0) {
      token = generateToken(8);
      var check = await supabase.from('clients').select('token').eq('token', token);
      existing = check.data;
    }

    // Check duplicate mobile
    if (body.mobile) {
      var { data: mobileCheck } = await supabase
        .from('clients')
        .select('id')
        .eq('business_id', businessID)
        .eq('mobile', body.mobile);
      if (mobileCheck && mobileCheck.length > 0) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please ask staff for your existing card.' });
      }
    }

    var clientID = 'CLI_' + Date.now().toString() + token.substring(0, 4);

    var { error } = await supabase.from('clients').insert({
      id: clientID,
      business_id: businessID,
      name: name,
      token: token,
      mobile: body.mobile || '',
      email: body.email || '',
      birthday: body.birthday || '',
      birthday_month: body.birthdayMonth || '',
      custom_field: body.customField || '',
      source: 'Self-registered',
      status: 'pending',
    });

    if (error) return res.status(500).json({ error: error.message });

    console.log('New client registered (pending):', name, token);

    return res.status(200).json({
      success: true,
      status: 'pending',
      client: { clientID, name, token },
      message: 'Registration submitted! Please wait for staff to confirm your card.',
    });
  } catch (err) {
    console.error('register-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
