// api/add-stamp.js
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

function generateID(prefix) {
  return prefix + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
}

module.exports = async (req, res) => {
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
      range: 'Clients!A2:J',
    });

    const clientRow = clientsRes.data.values?.find(row => row[3] === token);
    if (!clientRow) {
      return res.status(404).json({ error: 'Invalid token - client not found' });
    }

    const client = {
      clientID: clientRow[0],
      businessID: clientRow[1],
      name: clientRow[2],
      mobile: clientRow[4],
      breed: clientRow[7],
    };

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

    // Count total visits
    const visitsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'VisitLog!A2:F',
    });

    const totalVisits = visitsRes.data.values?.filter(row => 
      row[1] === client.clientID && row[2] === businessID
    ).length || 1;

    // Check if reward should be issued
    const businessesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Businesses!A2:L',
    });

    const businessRow = businessesRes.data.values?.find(row => row[0] === businessID);
    const requiredVisits = parseInt(businessRow?.[5] || '10');
    const rewardText = businessRow?.[6] || 'Free reward!';

    let rewardEarned = false;
    let couponID = null;

    if (totalVisits % requiredVisits === 0) {
      // Issue reward!
      rewardEarned = true;
      couponID = generateID('CPN_');
      const qrCode = generateID('QR_');
      
      const couponValues = [[
        couponID,
        businessID,
        client.clientID,
        'reward',
        rewardText,
        new Date().toISOString(), // issuedAt
        '', // expiryDate
        'FALSE', // isRedeemed
        '', // redeemedAt
        '', // redeemedBy
        `Earned after ${totalVisits} visits`,
        qrCode
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Coupons!A:L',
        valueInputOption: 'RAW',
        resource: { values: couponValues },
      });
    }

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
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
