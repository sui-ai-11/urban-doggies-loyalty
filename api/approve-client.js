import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    // GET: List pending registrations
    if (req.method === 'GET') {
      var result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Clients!A2:L',
      });

      var rows = result.data.values || [];
      var pending = [];
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if ((row[11] || '').toLowerCase() === 'pending') {
          pending.push({
            rowIndex: i + 2,
            clientID: row[0] || '',
            businessID: row[1] || '',
            name: row[2] || '',
            token: row[3] || '',
            mobile: row[4] || '',
            email: row[5] || '',
            birthday: row[6] || '',
            customField: row[7] || '',
            createdAt: row[8] || '',
            birthdayMonth: row[10] || '',
          });
        }
      }

      return res.status(200).json({ pending: pending, count: pending.length });
    }

    // POST: Approve or reject
    if (req.method === 'POST') {
      var body = req.body || {};
      var rowIndex = body.rowIndex;
      var action = body.action; // 'approve' or 'reject'

      if (!rowIndex || !action) {
        return res.status(400).json({ error: 'rowIndex and action required' });
      }

      if (action === 'approve') {
        // Update status to approved
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Clients!L' + rowIndex,
          valueInputOption: 'RAW',
          resource: { values: [['approved']] },
        });

        // Get client data from this row
        var clientRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Clients!A' + rowIndex + ':L' + rowIndex,
        });
        var cRow = (clientRes.data.values || [])[0] || [];
        var clientName = cRow[2] || '';
        var clientToken = cRow[3] || '';
        var clientEmail = cRow[5] || '';

        // Get business name
        var bizRes = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: 'Businesses!C2',
        });
        var businessName = ((bizRes.data.values || [])[0] || [])[0] || 'Loyalty';

        // Auto-queue welcome email if client has email
        if (clientEmail) {
          var origin = req.headers.origin || req.headers.referer || 'https://loyaltyv1.vercel.app';
          origin = origin.replace(/\/$/, '');
          var cardLink = origin + '/#/card?token=' + clientToken;
          var now = new Date().toISOString();

          await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'EmailQueue!A2:G',
            valueInputOption: 'RAW',
            resource: {
              values: [[clientEmail, clientName, businessName, cardLink, 'pending', now, clientToken]],
            },
          });
        }

        return res.status(200).json({ success: true, message: 'Client approved' + (clientEmail ? ' — email queued' : '') });
      }

      if (action === 'reject') {
        // Clear the row (effectively delete the registration)
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'Clients!L' + rowIndex,
          valueInputOption: 'RAW',
          resource: { values: [['rejected']] },
        });
        return res.status(200).json({ success: true, message: 'Registration rejected' });
      }

      return res.status(400).json({ error: 'Invalid action. Use approve or reject.' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Approve error:', error);
    return res.status(500).json({ error: error.message });
  }
}
