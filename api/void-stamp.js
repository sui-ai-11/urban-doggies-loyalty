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
