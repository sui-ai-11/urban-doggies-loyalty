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

function generateID(prefix) {
  return prefix + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generateToken() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

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
    const { businessID, clientName, mobile, email, birthday, birthdayMonth } = req.body;
    
    if (!businessID || !clientName) {
      return res.status(400).json({ error: 'BusinessID and ClientName are required' });
    }

    const sheets = await getGoogleSheetsClient();
    const clientID = generateID('CLI_');
    const token = generateToken();
    const createdAt = new Date().toISOString();

    // Column mapping: A-L (ClientID, BusinessID, Name, Token, Mobile, Email, Birthday, CustomField, DateAdded, Notes, BirthdayMonth, Status)
    const values = [[
      clientID,              // A
      businessID,            // B
      clientName,            // C
      token,                 // D
      mobile || '',          // E
      email || '',           // F
      birthday || '',        // G
      '',                    // H (customField/unused)
      createdAt,             // I
      '',                    // J (notes)
      birthdayMonth || '',   // K
      'approved',            // L (status - admin-added clients are auto-approved)
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A:L',
      valueInputOption: 'RAW',
      resource: { values },
    });

    console.log('✅ Client added:', clientName, 'Token:', token);

    return res.status(201).json({
      success: true,
      clientID,
      token,
      clientName,
      message: `Client added successfully! Token: ${token}`
    });

  } catch (error) {
    console.error('❌ Add client error:', error);
    return res.status(500).json({ error: error.message });
  }
}
