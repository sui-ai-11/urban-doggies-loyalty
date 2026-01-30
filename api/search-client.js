const { google } = require('googleapis');

module.exports = async (req, res) => {
  // CORS headers
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

  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name parameter required' });
  }

  try {
    // Setup Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Fetch clients
    const clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:J',
    });

    const rows = clientsRes.data.values || [];
    const searchLower = name.toLowerCase();

    // Search for clients whose name contains the search term
    const matchingClients = rows
      .filter(row => {
        const clientName = (row[2] || '').toLowerCase();
        return clientName.includes(searchLower);
      })
      .map(row => ({
        clientID: row[0],
        businessID: row[1],
        name: row[2],
        token: row[3],
        mobile: row[4] || '',
        email: row[5] || '',
        birthday: row[6] || '',
        breed: row[7] || '',
      }));

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
};
