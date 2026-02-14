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

    // Fetch business data from Row 2 (get columns A through AB)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:AB2',
    });

    const row = response.data.values?.[0];
    
    if (!row) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // COMPLETE COLUMN MAPPING
    const businessInfo = {
      businessID: row[0] || 'BIZ001',                    // A
      businessName: row[1] || 'Business Name',           // B
      tagline: row[2] || 'Digital Loyalty System',       // C
      accentColor: row[3] || '#17BEBB',                  // D
      logo: row[4] || '',                                // E
      stampsRequired: parseInt(row[5]) || 10,            // F
      rewardDescription: row[6] || 'Free service',       // G
      chatLabel: row[7] || '',                           // H
      chatLink: row[8] || '',                            // I
      termsURL: row[9] || '',                            // J
      supportText: row[10] || '',                        // K
      adImageUrl: row[11] || '',                         // L
      progressText: row[12] || '',                       // M
      milestone1Label: row[13] || '',                    // N
      milestone2Label: row[14] || '',                    // O
      milestone1Description: row[15] || '',              // P
      milestone2Description: row[16] || '',              // Q
      borderColor: row[17] || '#1F3A93',                 // R
      backgroundColor: row[18] || '#17BEBB',             // S
      cardBackground: row[19] || '#F5F1E8',              // T
      navButton1Text: row[20] || 'Stamp Card',           // U
      navButton2Text: row[21] || 'Rewards',              // V
      navButton3Text: row[22] || 'Contact',              // W
      milestone1Position: parseInt(row[23]) || 0,          // X (0 = auto halfway)
      milestone2Position: parseInt(row[24]) || 0,          // Y (0 = auto last)
      milestone1Icon: row[25] || '🎁',                    // Z
      milestone2Icon: row[26] || '🏆',                    // AA
      stampFilledIcon: row[27] || '✓',                    // AB
    };

    console.log('✅ Business loaded:', businessInfo.businessName);
    console.log('🎨 Colors:', {
      accent: businessInfo.accentColor,
      border: businessInfo.borderColor,
      background: businessInfo.backgroundColor,
      cardBg: businessInfo.cardBackground
    });

    return res.status(200).json(businessInfo);

  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
