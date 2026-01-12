// api/client-dashboard.js
const { google } = require('googleapis');

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const sheets = await getGoogleSheetsClient();

    // Fetch all data
    const [clientsRes, businessesRes, visitsRes, couponsRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Clients!A2:J' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Businesses!A2:L' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'VisitLog!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Coupons!A2:L' }),
    ]);

    // Find client
    const clientRow = clientsRes.data.values?.find(row => row[3] === token);
    if (!clientRow) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = {
      clientID: clientRow[0],
      businessID: clientRow[1],
      name: clientRow[2],
      token: clientRow[3],
      mobile: clientRow[4] || '',
      email: clientRow[5] || '',
      birthday: clientRow[6] || '',
      breed: clientRow[7] || '',
    };

    // Find business
    const businessRow = businessesRes.data.values?.find(row => row[0] === client.businessID);
    const business = {
      name: businessRow?.[1] || 'Urban Doggies',
      tagline: businessRow?.[2] || '',
      accentColor: businessRow?.[3] || '#3B82F6',
      logo: businessRow?.[4] || '',
      requiredVisits: parseInt(businessRow?.[5] || '10'),
      defaultReward: businessRow?.[6] || 'Free reward!',
      chatLabel: businessRow?.[7] || '',
      chatLink: businessRow?.[8] || '',
      termsURL: businessRow?.[9] || '',
      supportText: businessRow?.[10] || '',
      adImageUrl: businessRow?.[11] || '',
    };

    // Count visits
    const visits = visitsRes.data.values?.filter(row => 
      row[1] === client.clientID && row[2] === client.businessID
    ) || [];
    const visitCount = visits.length;
    const progress = visitCount % business.requiredVisits;
    const nextRewardIn = business.requiredVisits - progress;

    // Get active coupons
    const coupons = couponsRes.data.values?.filter(row => 
      row[2] === client.clientID && row[7] !== 'TRUE'
    ).map(row => ({
      id: row[0],
      type: row[3],
      text: row[4],
      issuedAt: row[5],
      expiryDate: row[6],
      qrCode: row[11],
    })) || [];

    return res.status(200).json({
      client,
      business,
      loyalty: {
        totalVisits: visitCount,
        currentProgress: progress,
        nextRewardIn,
        requiredVisits: business.requiredVisits,
        progressPercentage: Math.floor((progress / business.requiredVisits) * 100),
      },
      coupons,
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
