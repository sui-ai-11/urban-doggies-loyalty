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

    if (!token) return res.status(400).json({ error: 'Token required' });

    // Find client by token
    var clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:L',
    });

    var rows = clientsRes.data.values || [];
    var clientRow = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][3] === token) { clientRow = rows[i]; break; }
    }

    if (!clientRow) return res.status(404).json({ error: 'Client not found' });

    var clientName = clientRow[2] || '';
    var clientEmail = clientRow[5] || '';

    if (!clientEmail) return res.status(400).json({ error: 'Client has no email address' });

    // Get business info for branding
    var bizRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:AD2',
    });
    var bizRow = (bizRes.data.values || [])[0] || [];
    var businessName = bizRow[2] || 'Loyalty';

    // Build card link
    var origin = req.headers.origin || req.headers.referer || 'https://loyaltyv1.vercel.app';
    origin = origin.replace(/\/$/, '');
    var cardLink = origin + '/#/card?token=' + token;

    // Queue email in EmailQueue sheet
    var now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'EmailQueue!A2:G',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          clientEmail,
          clientName,
          businessName,
          cardLink,
          'pending',
          now,
          token,
        ]],
      },
    });

    return res.status(200).json({ success: true, message: 'Email queued for ' + clientName });

  } catch (error) {
    console.error('Send card link error:', error);
    return res.status(500).json({ error: error.message });
  }
}
