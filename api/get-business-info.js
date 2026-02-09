import { google } from 'googleapis';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get credentials from environment variables
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Google Sheets credentials'
      });
    }

    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL,
        private_key: PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch business info from Businesses sheet (Row 2)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:Z2', // Row 2 contains business info
    });

    const row = response.data.values?.[0];

    if (!row) {
      return res.status(404).json({ 
        error: 'Business not found',
        details: 'No business data in Businesses sheet row 2'
      });
    }

    // Map columns to business info
    const businessInfo = {
      id: row[0] || 'BIZ001',
      businessName: row[1] || 'Business Name',
      contactEmail: row[2] || '',
      accentColor: row[3] || '#17BEBB',
      logo: row[4] || '',
      address: row[5] || '',
      tagline: row[6] || 'Digital Loyalty System',
      phone: row[7] || '',
      website: row[8] || '',
      stampsRequired: parseInt(row[9]) || 10,
      rewardDescription: row[10] || 'Free service or product',
      businessHours: row[11] || '',
      socialMedia: row[12] || '',
      termsAndConditions: row[13] || '',
      privacyPolicy: row[14] || '',
      customMessage: row[15] || '',
      adminPassword: row[16] || '',
      staffPassword: row[17] || '',
      borderColor: row[18] || '#1F3A93',
      backgroundColor: row[19] || '#17BEBB',
      cardBackground: row[20] || '#F5F1E8',
      textColor: row[21] || '#2D3748',
      buttonColor: row[22] || '#17BEBB',
    };

    console.log('Business info loaded:', businessInfo.businessName);
    console.log('Logo URL:', businessInfo.logo);

    return res.status(200).json(businessInfo);

  } catch (error) {
    console.error('Error fetching business info:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch business info',
      details: error.message 
    });
  }
}
