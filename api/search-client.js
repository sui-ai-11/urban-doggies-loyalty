import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var name = req.query.name;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter required' });
  }

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

    var clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:J',
    });

    var rows = clientsRes.data.values || [];
    var searchLower = name.toLowerCase();

    var matchingClients = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var clientName = (row[2] || '').toLowerCase();
      if (clientName.indexOf(searchLower) > -1) {
        matchingClients.push({
          clientID: row[0],
          businessID: row[1],
          name: row[2],
          token: row[3],
          mobile: row[4] || '',
          email: row[5] || '',
          birthday: row[6] || '',
          breed: row[7] || '',
        });
      }
    }

    if (matchingClients.length === 0) {
      return res.status(404).json({ error: 'No customers found with that name' });
    }

    return res.status(200).json({
      clients: matchingClients,
      count: matchingClients.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
