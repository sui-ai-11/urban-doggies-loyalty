import { google } from 'googleapis';

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

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { backgroundColor, accentColor, borderColor, cardBackground } = req.body;

    if (!backgroundColor || !accentColor || !borderColor || !cardBackground) {
      return res.status(400).json({ error: 'All colors are required' });
    }

    const sheets = await getGoogleSheetsClient();

    // Update colors in Businesses sheet Row 2
    // Column R (18) = borderColor
    // Column S (19) = backgroundColor  
    // Column T (20) = cardBackground
    // Column D (4) = accentColor

    await Promise.all([
      // Update accent color (Column D)
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Businesses!D2',
        valueInputOption: 'RAW',
        resource: { values: [[accentColor]] },
      }),
      // Update border color (Column R)
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Businesses!R2',
        valueInputOption: 'RAW',
        resource: { values: [[borderColor]] },
      }),
      // Update background color (Column S)
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Businesses!S2',
        valueInputOption: 'RAW',
        resource: { values: [[backgroundColor]] },
      }),
      // Update card background (Column T)
      sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: 'Businesses!T2',
        valueInputOption: 'RAW',
        resource: { values: [[cardBackground]] },
      }),
    ]);

    console.log('✅ Colors updated successfully');

    return res.status(200).json({
      success: true,
      message: 'Colors updated successfully',
      colors: {
        backgroundColor,
        accentColor,
        borderColor,
        cardBackground,
      },
    });

  } catch (error) {
    console.error('❌ Update colors error:', error);
    return res.status(500).json({ error: error.message });
  }
}
