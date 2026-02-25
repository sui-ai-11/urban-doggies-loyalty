import { supabase, getTenant } from './_lib/supabase.js';

function generateID(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);

    // GET: List all coupons
    if (req.method === 'GET') {
      var { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', businessID)
        .order('issued_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      var coupons = (data || []).map(function(c) {
        return {
          couponID: c.id,
          businessID: c.business_id,
          clientID: c.client_id,
          clientName: c.client_name,
          type: c.type,
          text: c.text,
          issuedDate: c.issued_at,
          expiryDate: c.expiry_date,
          redeemed: c.redeemed || 'FALSE',
          redeemedAt: c.redeemed_at || '',
          redeemedBy: c.redeemed_by || '',
          notes: c.notes || '',
          qrCode: c.qr_code || '',
        };
      });

      return res.status(200).json({ coupons });
    }

    // DELETE: Remove coupon
    if (req.method === 'DELETE') {
      var couponID = req.query.couponID || req.query.id;
      if (!couponID) return res.status(400).json({ error: 'Coupon ID required' });

      await supabase.from('coupons').delete().eq('id', couponID).eq('business_id', businessID);
      return res.status(200).json({ success: true });
    }

    // POST: Create, redeem, or void coupon
    if (req.method === 'POST') {
      var body = req.body || {};

      // REDEEM action
      if (body.action === 'redeem' && body.couponID) {
        var { error: redeemErr } = await supabase
          .from('coupons')
          .update({
            redeemed: 'TRUE',
            redeemed_at: new Date().toISOString().split('T')[0],
          })
          .eq('id', body.couponID)
          .eq('business_id', businessID);

        if (redeemErr) return res.status(500).json({ error: redeemErr.message });
        return res.status(200).json({ success: true, message: 'Coupon redeemed' });
      }

      // VOID action
      if (body.action === 'void' && body.couponID) {
        var { error: voidErr } = await supabase
          .from('coupons')
          .update({ redeemed: 'VOIDED' })
          .eq('id', body.couponID)
          .eq('business_id', businessID);

        if (voidErr) return res.status(500).json({ error: voidErr.message });
        return res.status(200).json({ success: true, message: 'Coupon voided' });
      }

      // CREATE coupon(s)
      var targetClientID = body.clientID || '';

      // Birthday promo: create for all celebrants of a month
      if (targetClientID.indexOf('bday_') === 0) {
        var bdayMonth = targetClientID.replace('bday_', '');

        var { data: celebrants } = await supabase
          .from('clients')
          .select('id, name')
          .eq('business_id', businessID)
          .ilike('birthday_month', bdayMonth)
          .not('status', 'in', '("rejected","pending")');

        if (!celebrants || celebrants.length === 0) {
          return res.status(400).json({ error: 'No celebrants found for ' + bdayMonth });
        }

        var bdayRows = celebrants.map(function(c, idx) {
          return {
            id: generateID('CPN_') + '_' + idx,
            business_id: businessID,
            client_id: c.id,
            client_name: c.name,
            type: body.type || 'birthday',
            text: body.text || '',
            expiry_date: body.expiryDate || null,
            notes: body.notes ? body.notes + ' | Birthday: ' + bdayMonth : 'Birthday: ' + bdayMonth,
          };
        });

        var { error: bdayErr } = await supabase.from('coupons').insert(bdayRows);
        if (bdayErr) return res.status(500).json({ error: bdayErr.message });

        return res.status(200).json({
          success: true,
          count: celebrants.length,
          message: celebrants.length + ' birthday coupons issued for ' + bdayMonth,
        });
      }

      // Global: create individual coupon for each approved client
      if (!targetClientID) {
        var { data: allClients } = await supabase
          .from('clients')
          .select('id, name')
          .eq('business_id', businessID)
          .not('status', 'in', '("rejected","pending")');

        if (!allClients || allClients.length === 0) {
          return res.status(400).json({ error: 'No approved clients found' });
        }

        var globalRows = allClients.map(function(c, idx) {
          return {
            id: generateID('CPN_') + '_' + idx,
            business_id: businessID,
            client_id: c.id,
            client_name: c.name,
            type: body.type || 'reward',
            text: body.text || '',
            expiry_date: body.expiryDate || null,
            notes: body.notes || '',
          };
        });

        var { error: globalErr } = await supabase.from('coupons').insert(globalRows);
        if (globalErr) return res.status(500).json({ error: globalErr.message });

        return res.status(200).json({
          success: true,
          count: allClients.length,
          message: allClients.length + ' coupons issued to all clients',
        });
      }

      // Single client
      var clientName = '';
      var { data: cl } = await supabase
        .from('clients')
        .select('id, name')
        .or('id.eq.' + targetClientID + ',token.eq.' + targetClientID)
        .eq('business_id', businessID)
        .limit(1)
        .single();

      if (cl) {
        clientName = cl.name;
        targetClientID = cl.id;
      }

      var couponID = generateID('CPN_');
      var { error: insertErr } = await supabase.from('coupons').insert({
        id: couponID,
        business_id: businessID,
        client_id: targetClientID,
        client_name: clientName,
        type: body.type || 'reward',
        text: body.text || '',
        expiry_date: body.expiryDate || null,
        notes: body.notes || '',
      });

      if (insertErr) return res.status(500).json({ error: insertErr.message });

      return res.status(200).json({
        success: true,
        couponID: couponID,
        message: 'Coupon created',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('manage-coupons error:', err);
    return res.status(500).json({ error: err.message });
  }
}
