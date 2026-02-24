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
        range: 'Coupons!A2:M',
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
          clientName: row[3] || '',
          type: row[4] || '',
          text: row[5] || '',
          issuedAt: row[6] || '',
          expiryDate: row[7] || '',
          redeemed: row[8] || 'FALSE',
          redeemedAt: row[9] || '',
          redeemedBy: row[10] || '',
          notes: row[11] || '',
          qrCode: row[12] || '',
        });
      }

      return res.status(200).json({ coupons: coupons, count: coupons.length });
    }

    // POST: Add a new coupon
    if (req.method === 'POST') {
      var body = req.body || {};

      // Redeem a coupon
      if (body.action === 'redeem' && body.couponID) {
        // Read headers to find correct column positions
        var headerRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A1:Z1',
        });
        var headers = (headerRes.data.values || [[]])[0].map(function(h) { return (h || '').toLowerCase().trim(); });
        var redeemedCol = -1;
        var redeemedAtCol = -1;
        for (var h = 0; h < headers.length; h++) {
          var hdr = headers[h].replace(/\s/g, '');
          if (hdr === 'redeemed' || hdr === 'isredeemed' || hdr === 'claimed' || hdr === 'isclaimed') redeemedCol = h;
          if (hdr === 'redeemedat' || hdr === 'redeemeddate' || hdr === 'claimeddate' || hdr === 'claimedat' || hdr === 'redeemedAt') redeemedAtCol = h;
        }
        // Fallback to columns H and I if headers not found
        if (redeemedCol === -1) redeemedCol = 7;
        if (redeemedAtCol === -1) redeemedAtCol = 8;

        var colLetter = function(idx) { return String.fromCharCode(65 + idx); };

        var allCouponsRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A2:Z',
        });
        var allCoupons = allCouponsRes.data.values || [];
        var couponRowIdx = -1;
        for (var r = 0; r < allCoupons.length; r++) {
          if (allCoupons[r][0] === body.couponID) { couponRowIdx = r; break; }
        }
        if (couponRowIdx === -1) return res.status(404).json({ error: 'Coupon not found' });

        var sheetRow = couponRowIdx + 2;

        // Update redeemed column
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!' + colLetter(redeemedCol) + sheetRow,
          valueInputOption: 'RAW',
          resource: { values: [['TRUE']] },
        });

        // Update redeemedAt column
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!' + colLetter(redeemedAtCol) + sheetRow,
          valueInputOption: 'RAW',
          resource: { values: [[new Date().toISOString().split('T')[0]]] },
        });

        console.log('✅ Coupon redeemed:', body.couponID, 'Row:', sheetRow, 'Redeemed col:', colLetter(redeemedCol), 'At col:', colLetter(redeemedAtCol));

        return res.status(200).json({ success: true, message: 'Coupon redeemed' });
      }

      // VOID action
      if (body.action === 'void' && body.couponID) {
        var voidRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A2:Z',
        });
        var voidRows = voidRes.data.values || [];
        var voidIdx = -1;
        for (var vr = 0; vr < voidRows.length; vr++) {
          if (voidRows[vr][0] === body.couponID) { voidIdx = vr; break; }
        }
        if (voidIdx === -1) return res.status(404).json({ error: 'Coupon not found' });

        var voidSheetRow = voidIdx + 2;
        // Set redeemed column to VOIDED
        var voidHeaderRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A1:Z1',
        });
        var voidHeaders = (voidHeaderRes.data.values || [[]])[0].map(function(h) { return (h || '').toLowerCase().trim().replace(/\s/g, ''); });
        var voidRedeemedCol = 7;
        for (var vh = 0; vh < voidHeaders.length; vh++) {
          if (voidHeaders[vh] === 'redeemed' || voidHeaders[vh] === 'isredeemed' || voidHeaders[vh] === 'claimed') { voidRedeemedCol = vh; break; }
        }
        var vColLetter = String.fromCharCode(65 + voidRedeemedCol);
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!' + vColLetter + voidSheetRow,
          valueInputOption: 'RAW',
          resource: { values: [['VOIDED']] },
        });
        return res.status(200).json({ success: true, message: 'Coupon voided' });
      }

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
        console.log('🎂 Looking for', bdayMonth, 'celebrants in', clientRows.length, 'clients');
        for (var c = 0; c < clientRows.length; c++) {
          var status = (clientRows[c][11] || '').toLowerCase();
          if (status === 'rejected' || status === 'pending') continue;
          var cMonth = (clientRows[c][10] || '').trim().toLowerCase();
          console.log('  Client:', clientRows[c][2], 'BdayMonth:', clientRows[c][10], '→', cMonth);
          if (cMonth === bdayMonth.trim().toLowerCase()) {
            celebrants.push({ clientID: clientRows[c][0], name: clientRows[c][2] || '' });
          }
        }

        console.log('🎂 Found', celebrants.length, 'celebrants');

        if (celebrants.length === 0) {
          return res.status(400).json({ error: 'No celebrants found for ' + bdayMonth + '. Make sure clients have Birthday Month set in their profile.' });
        }

        // Create a coupon for each celebrant
        var newRows = [];
        for (var b = 0; b < celebrants.length; b++) {
          var couponID = 'CPN_' + Date.now().toString(36).toUpperCase() + '_' + b;
          newRows.push([
            couponID,
            body.businessID || 'BIZ_001',
            celebrants[b].clientID,
            celebrants[b].name,
            body.type || 'birthday',
            body.text || '',
            new Date().toISOString().split('T')[0],
            body.expiryDate || '',
            'FALSE',
            '',
            '',
            body.notes ? body.notes + ' | Birthday: ' + bdayMonth : 'Birthday: ' + bdayMonth,
            '',
          ]);
        }

        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A2:M',
          valueInputOption: 'RAW',
          resource: { values: newRows },
        });

        return res.status(200).json({
          success: true,
          count: celebrants.length,
          message: celebrants.length + ' birthday coupons issued for ' + bdayMonth,
        });
      }

      // Single client or ALL clients (explode into individual rows)
      if (!targetClientID || targetClientID === '') {
        // GLOBAL: create individual coupon for every approved client
        var allClRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Clients!A2:L',
        });
        var allClRows = allClRes.data.values || [];
        var globalRows = [];
        for (var g = 0; g < allClRows.length; g++) {
          var gStatus = (allClRows[g][11] || '').toLowerCase();
          if (gStatus === 'rejected' || gStatus === 'pending') continue;
          var gID = 'CPN_' + Date.now().toString(36).toUpperCase() + '_' + g;
          globalRows.push([
            gID,
            body.businessID || 'BIZ_001',
            allClRows[g][0],
            allClRows[g][2] || '',
            body.type || 'reward',
            body.text || '',
            new Date().toISOString().split('T')[0],
            body.expiryDate || '',
            'FALSE',
            '',
            '',
            body.notes || '',
            '',
          ]);
        }
        if (globalRows.length === 0) {
          return res.status(400).json({ error: 'No approved clients found' });
        }
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'Coupons!A2:M',
          valueInputOption: 'RAW',
          resource: { values: globalRows },
        });
        return res.status(200).json({
          success: true,
          count: globalRows.length,
          message: globalRows.length + ' coupons issued to all clients',
        });
      }

      // SINGLE client
      var couponID = 'CPN_' + Date.now().toString(36).toUpperCase();

      var clientName = '';
      var resolvedClientID = targetClientID;
      var clRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Clients!A2:D',
      });
      var clRows = clRes.data.values || [];
      for (var cl = 0; cl < clRows.length; cl++) {
        if (clRows[cl][0] === targetClientID || clRows[cl][3] === targetClientID) {
          clientName = clRows[cl][2] || '';
          resolvedClientID = clRows[cl][0];
          break;
        }
      }

      var newRow = [
        couponID,
        body.businessID || 'BIZ_001',
        resolvedClientID,
        clientName,
        body.type || 'reward',
        body.text || '',
        new Date().toISOString().split('T')[0],
        body.expiryDate || '',
        'FALSE',
        '',
        '',
        body.notes || '',
        '',
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A2:M',
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

      // Read headers to find correct column positions
      var delHeaderRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A1:Z1',
      });
      var delHeaders = (delHeaderRes.data.values || [[]])[0].map(function(h) { return (h || '').toLowerCase().trim(); });
      var delRedeemedCol = 7;
      var delRedeemedAtCol = 8;
      for (var dh = 0; dh < delHeaders.length; dh++) {
        if (delHeaders[dh] === 'redeemed' || delHeaders[dh] === 'isredeemed') delRedeemedCol = dh;
        if (delHeaders[dh] === 'redeemedat' || delHeaders[dh] === 'redeemeddate' || delHeaders[dh] === 'claimeddate' || delHeaders[dh] === 'claimedat') delRedeemedAtCol = dh;
      }
      var delColLetter = function(idx) { return String.fromCharCode(65 + idx); };

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!' + delColLetter(delRedeemedCol) + rowIndex,
        valueInputOption: 'RAW',
        resource: { values: [['TRUE']] },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!' + delColLetter(delRedeemedAtCol) + rowIndex,
        valueInputOption: 'RAW',
        resource: { values: [[new Date().toISOString().split('T')[0]]] },
      });

      console.log('✅ Coupon removed/redeemed Row:', rowIndex, 'Cols:', delColLetter(delRedeemedCol), delColLetter(delRedeemedAtCol));

      return res.status(200).json({ success: true, message: 'Coupon removed' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Coupon error:', error);
    return res.status(500).json({ error: error.message });
  }
}
