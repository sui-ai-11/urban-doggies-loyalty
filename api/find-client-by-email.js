import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var email = (req.query.email || '').trim().toLowerCase();
    var mobile = (req.query.mobile || '').trim().replace(/\s+/g, '');
    if (!email && !mobile) return res.status(400).json({ error: 'Email or mobile required' });

    var auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    var sheets = google.sheets({ version: 'v4', auth: auth });
    var SHEET_ID = process.env.GOOGLE_SHEET_ID;

    var result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:L',
    });

    var rows = result.data.values || [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var clientEmail = (row[5] || '').trim().toLowerCase();
      var clientMobile = (row[4] || '').trim().replace(/\s+/g, '');
      var status = (row[11] || '').toLowerCase();

      var matched = false;
      if (email && clientEmail === email) matched = true;
      if (mobile && clientMobile === mobile) matched = true;

      if (matched && status !== 'rejected') {
        if (status === 'pending') {
          return res.status(200).json({
            error: 'Your registration is still pending approval. Please ask staff at the counter.',
          });
        }
        return res.status(200).json({
          token: row[3],
          name: row[2],
        });
      }
    }

    return res.status(200).json({ error: 'No card found. Check your token, email, or mobile number and try again.' });

  } catch (error) {
    console.error('Find client error:', error);
    return res.status(500).json({ error: error.message });
  }
}
