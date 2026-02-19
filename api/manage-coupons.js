import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    var sheets = google.sheets({ version: 'v4', auth: auth });
    var SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // GET: List all coupons
    if (req.method === 'GET') {
      var result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A2:L',
      });

      var rows = result.data.values || [];
      var coupons = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        coupons.push({
          rowIndex: i + 2,
          couponID: row[0] || '',
          businessID: row[1] || '',
          clientID: row[2] || '',
          type: row[3] || '',
          text: row[4] || '',
          issuedAt: row[5] || '',
          expiryDate: row[6] || '',
          redeemed: row[7] || 'FALSE',
          redeemedAt: row[8] || '',
          notes: row[9] || '',
          createdBy: row[10] || '',
          qrCode: row[11] || '',
        });
      }

      return res.status(200).json({ coupons: coupons, count: coupons.length });
    }

    // POST: Add a new coupon
    if (req.method === 'POST') {
      var body = req.body || {};
      var targetClientID = body.clientID || '';

      // Check if this is a birthday promo for multiple clients
      if (targetClientID.indexOf('bday_') === 0) {
        var bdayMonth = targetClientID.replace('bday_', '');

        // Get all clients and find celebrants
        var clientsRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Clients!A2:L',
        });
        var clientRows = clientsRes.data.values || [];
        var celebrants = [];
        for (var c = 0; c < clientRows.length; c++) {
          var status = (clientRows[c][11] || '').toLowerCase();
          if (status === 'rejected' || status === 'pending') continue;
          var cMonth = (clientRows[c][10] || '').toLowerCase();
          if (cMonth === bdayMonth.toLowerCase()) {
            celebrants.push(clientRows[c][0]); // clientID
          }
        }

        if (celebrants.length === 0) {
          return res.status(400).json({ error: 'No celebrants found for ' + bdayMonth });
        }

        // Create a coupon for each celebrant
        var newRows = [];
        for (var b = 0; b < celebrants.length; b++) {
          var couponID = 'CPN_' + Date.now().toString(36).toUpperCase() + '_' + b;
          newRows.push([
            couponID,
            body.businessID || 'BIZ_001',
            celebrants[b],
            body.type || 'birthday',
            body.text || '',
            new Date().toISOString().split('T')[0],
            body.expiryDate || '',
            'FALSE',
            '',
            body.notes || '',
            body.createdBy || 'admin',
            '',
          ]);
        }

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A2:L',
          valueInputOption: 'RAW',
          resource: { values: newRows },
        });

        return res.status(200).json({
          success: true,
          count: celebrants.length,
          message: celebrants.length + ' birthday coupons issued for ' + bdayMonth,
        });
      }

      // Single client or global coupon
      var couponID = 'CPN_' + Date.now().toString(36).toUpperCase();

      var newRow = [
        couponID,
        body.businessID || 'BIZ_001',
        targetClientID,
        body.type || 'reward',
        body.text || '',
        new Date().toISOString().split('T')[0],
        body.expiryDate || '',
        'FALSE',
        '',
        body.notes || '',
        body.createdBy || 'admin',
        '',
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A2:L',
        valueInputOption: 'RAW',
        resource: { values: [newRow] },
      });

      return res.status(200).json({
        success: true,
        couponID: couponID,
        message: 'Coupon created'
      });
    }

    // DELETE: Remove a coupon (mark as redeemed or delete row)
    if (req.method === 'DELETE') {
      var rowIndex = req.query.row || req.body.row;
      if (!rowIndex) return res.status(400).json({ error: 'Row index required' });

      // Mark as redeemed instead of deleting
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!H' + rowIndex,
        valueInputOption: 'RAW',
        resource: { values: [['TRUE']] },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!I' + rowIndex,
        valueInputOption: 'RAW',
        resource: { values: [[new Date().toISOString().split('T')[0]]] },
      });

      return res.status(200).json({ success: true, message: 'Coupon removed' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Coupon error:', error);
    return res.status(500).json({ error: error.message });
  }
}
