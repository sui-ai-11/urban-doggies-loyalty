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
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);

    // DELETE client
    if (req.method === 'DELETE') {
      var clientID = req.query.clientID || req.query.id;
      if (!clientID) return res.status(400).json({ error: 'Client ID required' });

      // Delete visits
      await supabase.from('visits').delete().eq('client_id', clientID).eq('business_id', businessID);
      // Delete coupons
      await supabase.from('coupons').delete().eq('client_id', clientID).eq('business_id', businessID);
      // Delete client
      var { error } = await supabase.from('clients').delete().eq('id', clientID).eq('business_id', businessID);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, message: 'Client deleted' });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    var body = req.body || {};

    // EDIT client
    if (body.action === 'edit') {
      var updates = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.mobile !== undefined) updates.mobile = body.mobile;
      if (body.email !== undefined) updates.email = body.email;
      if (body.birthday !== undefined) updates.birthday = body.birthday;
      if (body.birthdayMonth !== undefined) updates.birthday_month = body.birthdayMonth;
      if (body.notes !== undefined) updates.notes = body.notes;

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

      var { error: editErr } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', body.clientID)
        .eq('business_id', businessID);

      if (editErr) return res.status(500).json({ error: editErr.message });
      return res.status(200).json({ success: true, message: 'Client updated' });
    }

    // IMPORT clients (bulk)
    if (body.action === 'import') {
      var rows = body.clients || [];
      if (rows.length === 0) return res.status(400).json({ error: 'No clients to import' });

      var imported = 0;
      var skipped = 0;
      var errors = [];

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var name = (row.name || '').trim();
        if (!name) { skipped++; continue; }

        // Check duplicate mobile
        if (row.mobile) {
          var { data: mobileCheck } = await supabase
            .from('clients')
            .select('id')
            .eq('business_id', businessID)
            .eq('mobile', row.mobile);
          if (mobileCheck && mobileCheck.length > 0) {
            skipped++;
            errors.push(name + ': duplicate mobile');
            continue;
          }
        }

        // Generate unique token
        var token = generateToken(8);
        var { data: existing } = await supabase.from('clients').select('token').eq('token', token);
        while (existing && existing.length > 0) {
          token = generateToken(8);
          var check = await supabase.from('clients').select('token').eq('token', token);
          existing = check.data;
        }

        var clientID = 'CLI_' + Date.now().toString() + token.substring(0, 4) + '_' + i;

        // Extract birthday month
        var bdayMonth = row.birthdayMonth || '';
        if (!bdayMonth && row.birthday) {
          var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          var d = new Date(row.birthday);
          if (!isNaN(d.getTime())) bdayMonth = months[d.getMonth()];
        }

        var { error: insertErr } = await supabase.from('clients').insert({
          id: clientID,
          business_id: businessID,
          name: name,
          token: token,
          mobile: row.mobile || '',
          email: row.email || '',
          birthday: row.birthday || '',
          birthday_month: bdayMonth,
          notes: row.notes || '',
          source: 'CSV Import',
          status: 'approved',
        });

        if (insertErr) {
          skipped++;
          errors.push(name + ': ' + insertErr.message);
        } else {
          imported++;
        }
      }

      return res.status(200).json({
        success: true,
        imported: imported,
        skipped: skipped,
        errors: errors,
        message: imported + ' clients imported, ' + skipped + ' skipped',
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('manage-client error:', err);
    return res.status(500).json({ error: err.message });
  }
}
