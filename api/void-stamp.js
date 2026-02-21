import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    var body = req.body || {};
    var token = body.token;
    var businessID = body.businessID || 'BIZ_001';
    var voidedBy = body.voidedBy || 'staff';

    if (!token) return res.status(400).json({ error: 'Token required' });

    // Find client
    var clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:L',
    });
    var clientRow = null;
    var clientRows = clientsRes.data.values || [];
    for (var i = 0; i < clientRows.length; i++) {
      if (clientRows[i][3] === token) { clientRow = clientRows[i]; break; }
    }
    if (!clientRow) return res.status(404).json({ error: 'Client not found' });

    var clientID = clientRow[0];
    var clientName = clientRow[2];

    // Find the last non-voided visit for this client
    var visitsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'VisitLog!A2:G',
    });
    var visitRows = visitsRes.data.values || [];
    var lastVisitIndex = -1;

    for (var j = visitRows.length - 1; j >= 0; j--) {
      var row = visitRows[j];
      // Column F (index 5) = notes/status, check it's not already voided
      if (row[1] === clientID && row[2] === businessID && (row[5] || '').indexOf('VOIDED') === -1) {
        lastVisitIndex = j;
        break;
      }
    }

    if (lastVisitIndex === -1) {
      return res.status(400).json({ error: 'No stamps to void' });
    }

    // Mark the visit as VOIDED in column F and add void info in column G
    var sheetRow = lastVisitIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: 'VisitLog!F' + sheetRow + ':G' + sheetRow,
      valueInputOption: 'RAW',
      resource: { values: [['VOIDED', voidedBy + ' | ' + new Date().toISOString()]] },
    });

    // Count remaining valid visits
    var remainingVisits = 0;
    for (var k = 0; k < visitRows.length; k++) {
      var v = visitRows[k];
      if (v[1] === clientID && v[2] === businessID && (v[5] || '').indexOf('VOIDED') === -1) {
        if (k !== lastVisitIndex) remainingVisits++;
      }
    }

    console.log('⚠️ Stamp voided for', clientName, '| Remaining:', remainingVisits);

    // Check if voiding drops below any milestone — void those milestone coupons
    try {
      // Get business milestones and required visits
      var bizRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Businesses!A2:AH',
      });
      var bizRow = (bizRes.data.values || []).find(function(r) { return r[0] === businessID; });
      var requiredVisits = parseInt(bizRow && bizRow[5]) || 10;
      var currentProgress = remainingVisits % requiredVisits;
      var currentCycle = Math.floor(remainingVisits / requiredVisits) + 1;

      // Get all coupons
      var couponsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A2:M',
      });
      var couponRows = couponsRes.data.values || [];

      // Find milestone coupons for this client that are now above current progress
      for (var ci = 0; ci < couponRows.length; ci++) {
        var crow = couponRows[ci];
        if (crow[2] !== clientID) continue;
        var notes = crow[11] || '';
        
        // Check if this is a milestone coupon
        var milestoneMatch = notes.match(/milestone_(\d+)(?:_cycle_(\d+))?/);
        if (!milestoneMatch) continue;
        
        var msPosition = parseInt(milestoneMatch[1]);
        var msCycle = milestoneMatch[2] ? parseInt(milestoneMatch[2]) : 1;
        
        // Void if: same cycle and position now above progress, OR cycle is now higher than current
        if ((msCycle === currentCycle && msPosition > currentProgress) || msCycle > currentCycle) {
          var couponSheetRow = ci + 2;
          // Mark as voided: set IsRedeemed (col I) to VOIDED, RedeemedAt (col J), RedeemedBy (col K), Notes (col L)
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: 'Coupons!I' + couponSheetRow + ':L' + couponSheetRow,
            valueInputOption: 'RAW',
            resource: { values: [['VOIDED', new Date().toISOString().split('T')[0], 'auto-void', 'Stamp voided — milestone revoked']] },
          });
          console.log('🗑️ Voided milestone coupon:', crow[0], 'position:', msPosition, 'cycle:', msCycle);
        }
      }
    } catch (msErr) {
      console.error('Warning: milestone void check failed:', msErr.message);
      // Don't fail the void — stamp was already voided successfully
    }

    return res.status(200).json({
      success: true,
      clientName: clientName,
      remainingVisits: remainingVisits,
      voidedVisitRow: sheetRow,
    });

  } catch (error) {
    console.error('Void stamp error:', error);
    return res.status(500).json({ error: error.message });
  }
}
