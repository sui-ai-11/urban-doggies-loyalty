import { google } from 'googleapis';

export default async function handler(req, res) {
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

  try {
    // Setup Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Fetch clients and visit logs
    const [clientsRes, visitsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Clients!A2:L',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'VisitLog!A2:F',
      }),
    ]);

    const clientRows = clientsRes.data.values || [];
    const visitRows = visitsRes.data.values || [];

    // Filter out rejected clients, keep approved and no-status (legacy)
    const activeRows = clientRows.filter(row => {
      var status = (row[11] || '').toLowerCase();
      return status !== 'rejected' && status !== 'pending';
    });

    // Process clients with visit counts
    const clients = activeRows.map(row => {
      const clientID = row[0];
      const businessID = row[1];
      
      // Count visits for this client
      const visits = visitRows.filter(visit => 
        visit[1] === clientID && visit[2] === businessID && (visit[5] || '').indexOf('VOIDED') === -1
      ).length;

      return {
        clientID: row[0],
        businessID: row[1],
        name: row[2],
        token: row[3],
        mobile: row[4] || '',
        email: row[5] || '',
        birthday: row[6] || '',
        breed: row[7] || '',
        dateAdded: row[8] || '',
        notes: row[9] || '',
        birthdayMonth: row[10] || '',
        visits: visits,
        requiredVisits: 10,
        cardLink: `${req.headers.origin || 'https://urban-doggies-loyalty.vercel.app'}/#/card?token=${row[3]}`
      };
    });

    // Get unique breeds for filtering
    const breeds = [...new Set(clients.map(c => c.breed).filter(Boolean))].sort();
    
    // Get unique birthday months for filtering
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const birthdayMonths = months.filter(month => 
      clients.some(c => c.birthdayMonth === month)
    );

    // Calculate analytics
    const totalClients = clients.length;
    const stampsToday = visitRows.filter(visit => {
      const visitDate = new Date(visit[3]);
      const today = new Date();
      return visitDate.toDateString() === today.toDateString();
    }).length;
    const rewardsIssued = clients.filter(c => c.visits >= c.requiredVisits).length;

    // Breed breakdown
    const breedBreakdown = breeds.map(breed => ({
      breed,
      count: clients.filter(c => c.breed === breed).length
    }));

    console.log(`✅ Loaded ${clients.length} clients`);

    return res.status(200).json({
      clients,
      breeds,
      birthdayMonths,
      analytics: {
        totalClients,
        stampsToday,
        rewardsIssued,
        breedBreakdown
      }
    });

  } catch (error) {
    console.error('❌ Get all clients error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
