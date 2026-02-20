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
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Clients!A2:L' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Businesses!A2:AH' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'VisitLog!A2:F' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Coupons!A2:M' }),
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
      status: clientRow[11] || 'approved',
    };

    // Check if pending
    if (client.status === 'pending') {
      return res.status(200).json({
        client: client,
        status: 'pending',
        message: 'Your registration is pending approval. Please ask staff to confirm.',
      });
    }

    if (client.status === 'rejected') {
      return res.status(403).json({ error: 'This registration was not approved.' });
    }

    console.log('✅ Client found:', client.name);

    // Find business - try exact match first, then fall back to first business
    const allBusinessRows = (businessesRes.data.values) || [];
    let businessRow = allBusinessRows.find(row => row[0] === client.businessID);
    
    if (!businessRow && allBusinessRows.length > 0) {
      console.log('⚠️ Business not found with ID:', client.businessID, '- using first business as fallback');
      businessRow = allBusinessRows[0];
    }
    
    if (!businessRow) {
      console.log('❌ No businesses found at all');
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
      milestonesJson: businessRow[28] || '',
      contactEmail: businessRow[30] || '',
      navButton1Contact: businessRow[31] || '',
      callLabel: businessRow[32] || '',
      feedbackLabel: businessRow[33] || '',
    };

    console.log('✅ Business found:', business.name, '| milestonesJson length:', (business.milestonesJson || '').length, '| clientID:', client.clientID, '| token:', client.token);

    // Count visits (exclude voided) - match by clientID
    const visits = ((visitsRes.data.values) || []).filter(row => 
      row[1] === client.clientID && (row[5] || '').indexOf('VOIDED') === -1
    ) || [];
    const visitCount = visits.length;
    const progress = visitCount % business.stampsRequired;
    const nextRewardIn = business.stampsRequired - progress;

    // Get coupons for this client (match by clientID or token, plus global)
    const coupons = ((couponsRes.data.values) || []).filter(row => 
      row[2] === client.clientID || row[2] === client.token || row[2] === '' || row[2] === undefined
    ).map(row => ({
      couponID: row[0],
      clientName: row[3] || '',
      type: row[4],
      text: row[5],
      issuedAt: row[6],
      expiryDate: row[7],
      redeemed: row[8] || 'FALSE',
      redeemedAt: row[9] || '',
      notes: row[11] || '',
      qrCode: row[12],
    })) || [];

    console.log(`✅ Loaded ${visitCount} visits, ${coupons.length} coupons. All coupon rows: ${(couponsRes.data.values || []).length}`);

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
