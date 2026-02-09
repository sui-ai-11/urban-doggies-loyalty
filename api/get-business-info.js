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
    // Setup Google Sheets auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Fetch business data from Row 2 of Businesses tab
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:Z2',
    });

    const row = response.data.values?.[0];
    
    if (!row) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Map columns correctly
    const businessInfo = {
      businessID: row[0] || 'BIZ001',
      businessName: row[1] || 'Business Name',
      contactEmail: row[2] || '',
      accentColor: row[3] || '#17BEBB',
      logo: row[4] || '',
      address: row[5] || '',
      tagline: row[6] || 'Digital Loyalty System',
      phone: row[7] || '',
      website: row[8] || '',
      stampsRequired: parseInt(row[9]) || 10,
      rewardDescription: row[10] || 'Free service',
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
    };

    console.log('Business loaded:', businessInfo.businessName);
    console.log('Logo URL:', businessInfo.logo);

    return res.status(200).json(businessInfo);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
