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

    // Fetch business data - Row 2 of Businesses tab
    const businessesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:W', // Get all business columns
    });

    const businessRow = businessesRes.data.values?.[0]; // Get first row (row 2)
    
    if (!businessRow) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const business = {
      businessID: businessRow[0],
      name: businessRow[1] || 'Urban Doggies',
      tagline: businessRow[2] || '',
      accentColor: businessRow[3] || '#3B82F6',
      logo: businessRow[4] || '', // Column E (index 4)
      requiredVisits: parseInt(businessRow[5] || '10'),
      defaultReward: businessRow[6] || 'Free reward!',
      chatLabel: businessRow[7] || '',
      chatLink: businessRow[8] || '',
      termsURL: businessRow[9] || '',
      supportText: businessRow[10] || '',
      adImageUrl: businessRow[11] || '',
      progressText: businessRow[12] || 'See your grooming progress and rewards.',
      milestone1Label: businessRow[13] || '10% OFF',
      milestone2Label: businessRow[14] || 'TREATS!',
      milestone1Description: businessRow[15] || '5th grooming: 10% off',
      milestone2Description: businessRow[16] || '10th grooming: Premium dog treats',
      borderColor: businessRow[17] || '#1F3A93',
      backgroundColor: businessRow[18] || '#17BEBB',
      cardBackgroundColor: businessRow[19] || '#F5F1E8',
      navButton1Text: businessRow[20] || 'Stamp Card',
      navButton2Text: businessRow[21] || 'Exclusive Rewards',
      navButton3Text: businessRow[22] || 'Message us',
    };

    return res.status(200).json({ business });

  } catch (error) {
    console.error('Get business info error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
};
