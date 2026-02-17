import { google } from 'googleapis';

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
    var body = req.body || {};
    var name = (body.name || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    var auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    var sheets = google.sheets({ version: 'v4', auth: auth });
    var SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Generate unique token
    var token = generateToken(8);

    // Check token doesn't already exist
    var existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!D2:D',
    });
    var existingTokens = (existing.data.values || []).map(function(r) { return r[0]; });
    while (existingTokens.indexOf(token) > -1) {
      token = generateToken(8);
    }

    // Check if mobile already registered (if provided)
    if (body.mobile) {
      var mobileCheck = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Clients!E2:E',
      });
      var existingMobiles = (mobileCheck.data.values || []).map(function(r) { return r[0]; });
      if (existingMobiles.indexOf(body.mobile) > -1) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please ask staff for your existing card.' });
      }
    }

    var clientID = 'CLI_' + Date.now().toString() + token.substring(0, 4);
    var businessID = body.businessID || 'BIZ_001';
    var now = new Date().toISOString();

    var newRow = [
      clientID,
      businessID,
      name,
      token,
      body.mobile || '',
      body.email || '',
      body.birthday || '',
      body.customField || '',
      now,
      'Self-registered',
      body.birthdayMonth || '',
      'pending',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:L',
      valueInputOption: 'RAW',
      resource: { values: [newRow] },
    });

    console.log('New client registered (pending):', name, token);

    return res.status(200).json({
      success: true,
      status: 'pending',
      client: {
        clientID: clientID,
        name: name,
        token: token,
      },
      message: 'Registration submitted! Please wait for staff to confirm your card.',
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
