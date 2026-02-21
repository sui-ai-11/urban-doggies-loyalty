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
    const { token, businessID, addedBy } = req.body;

    if (!token || !businessID) {
      return res.status(400).json({ error: 'Token and BusinessID are required' });
    }

    const sheets = await getGoogleSheetsClient();

    // Get client
    const clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Clients!A2:K',
    });

    const clientRow = clientsRes.data.values?.find(row => row[3] === token);
    if (!clientRow) {
      console.log('❌ Client not found with token:', token);
      return res.status(404).json({ error: 'Invalid token - client not found' });
    }

    const client = {
      clientID: clientRow[0],
      businessID: clientRow[1],
      name: clientRow[2],
      mobile: clientRow[4],
      breed: clientRow[7],
    };

    console.log('✅ Client found:', client.name);

    // Add visit
    const visitID = generateID('VIS_');
    const visitDateTime = new Date().toISOString();
    
    const visitValues = [[
      visitID,
      client.clientID,
      businessID,
      visitDateTime,
      addedBy || 'staff',
      '' // notes
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'VisitLog!A:F',
      valueInputOption: 'RAW',
      resource: { values: visitValues },
    });

    console.log('✅ Visit added:', visitID);

    // Count total visits
    const visitsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'VisitLog!A2:G',
    });

    const totalVisits = (visitsRes.data.values || []).filter(row => 
      row[1] === client.clientID && (row[5] || '').indexOf('VOIDED') === -1
    ).length;

    // Check if reward should be issued
    const businessesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:W',
    });

    let businessRow = businessesRes.data.values?.find(row => row[0] === businessID);
    if (!businessRow && businessesRes.data.values?.length > 0) {
      businessRow = businessesRes.data.values[0];
    }
    const requiredVisits = parseInt(businessRow?.[5] || '10');
    const rewardText = businessRow?.[6] || '';

    let rewardEarned = false;
    let couponID = null;

    if (totalVisits % requiredVisits === 0 && rewardText.trim()) {
      // Issue reward!
      rewardEarned = true;
      couponID = generateID('CPN_');
      const qrCode = generateID('QR_');
      
      const couponValues = [[
        couponID,
        businessID,
        client.clientID,
        client.name || '',
        'reward',
        rewardText,
        new Date().toISOString().split('T')[0],
        '',
        'FALSE',
        '',
        '',
        `Earned after ${totalVisits} visits`,
        qrCode
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A:M',
        valueInputOption: 'RAW',
        resource: { values: couponValues },
      });

      console.log('🎉 Reward issued! Coupon:', couponID);
    }

    console.log(`✅ Total visits: ${totalVisits}/${requiredVisits}`);

    return res.status(200).json({
      success: true,
      client: {
        name: client.name,
        mobile: client.mobile,
        breed: client.breed,
      },
      totalVisits,
      rewardEarned,
      rewardText: rewardEarned ? rewardText : null,
      couponID: rewardEarned ? couponID : null,
      message: rewardEarned 
        ? `🎉 Stamp added! ${client.name} earned a reward!` 
        : `✅ Stamp added! ${client.name} now has ${totalVisits} visits.`
    });

  } catch (error) {
    console.error('❌ Add stamp error:', error);
    return res.status(500).json({ error: error.message });
  }
}
