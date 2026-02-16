import { google } from 'googleapis';

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export default async function handler(req, res) {
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
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Clients!A2:K' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Businesses!A2:AB' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'VisitLog!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Coupons!A2:L' }),
    ]);

    // Find client
    const clientRow = ((clientsRes.data.values) || []).find(row => row[3] === token);
    if (!clientRow) {
      console.log('❌ Client not found with token:', token);
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
      dateAdded: clientRow[8] || '',
      notes: clientRow[9] || '',
      birthdayMonth: clientRow[10] || '',
    };

    console.log('✅ Client found:', client.name);

    // Find business
    const businessRow = ((businessesRes.data.values) || []).find(row => row[0] === client.businessID);
    
    if (!businessRow) {
      console.log('❌ Business not found with ID:', client.businessID);
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = {
      name: businessRow[1] || 'Business Name',
      tagline: businessRow[2] || 'Digital Loyalty System',
      accentColor: businessRow[3] || '#17BEBB',
      logo: businessRow[4] || '',
      stampsRequired: parseInt(businessRow[5]) || 10,
      rewardDescription: businessRow[6] || 'Free service',
      chatLabel: businessRow[7] || '',
      chatLink: businessRow[8] || '',
      termsURL: businessRow[9] || '',
      supportText: businessRow[10] || '',
      adImageUrl: businessRow[11] || '',
      progressText: businessRow[12] || 'Track your progress',
      milestone1Label: businessRow[13] || '10% OFF',
      milestone2Label: businessRow[14] || 'FREE TREAT',
      milestone1Description: businessRow[15] || '5th visit reward',
      milestone2Description: businessRow[16] || '10th visit reward',
      borderColor: businessRow[17] || '#1F3A93',
      backgroundColor: businessRow[18] || '#17BEBB',
      cardBackground: businessRow[19] || '#F5F1E8',
      navButton1Text: businessRow[20] || 'Stamp Card',
      navButton2Text: businessRow[21] || 'Rewards',
      navButton3Text: businessRow[22] || 'Contact',
      milestone1Position: parseInt(businessRow[23]) || 0,
      milestone2Position: parseInt(businessRow[24]) || 0,
      milestone1Icon: businessRow[25] || '🎁',
      milestone2Icon: businessRow[26] || '🏆',
      stampFilledIcon: businessRow[27] || '✓',
    };

    console.log('✅ Business found:', business.name);

    // Count visits
    const visits = ((visitsRes.data.values) || []).filter(row => 
      row[1] === client.clientID && row[2] === client.businessID
    ) || [];
    const visitCount = visits.length;
    const progress = visitCount % business.stampsRequired;
    const nextRewardIn = business.stampsRequired - progress;

    // Get active coupons
    const coupons = ((couponsRes.data.values) || []).filter(row => 
      row[2] === client.clientID && row[7] !== 'TRUE'
    ).map(row => ({
      id: row[0],
      type: row[3],
      text: row[4],
      issuedAt: row[5],
      expiryDate: row[6],
      notes: row[9] || '',
      qrCode: row[11],
    })) || [];

    console.log(`✅ Loaded ${visitCount} visits, ${coupons.length} active coupons`);

    return res.status(200).json({
      client,
      business,
      loyalty: {
        totalVisits: visitCount,
        currentProgress: progress,
        nextRewardIn,
        requiredVisits: business.stampsRequired,
        progressPercentage: Math.floor((progress / business.stampsRequired) * 100),
      },
      coupons,
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
