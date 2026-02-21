import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    var body = req.body || {};
    var auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    var sheets = google.sheets({ version: 'v4', auth: auth });
    var SHEET_ID = process.env.GOOGLE_SHEET_ID;

    // Column mapping: field -> Sheet column
    var fieldMap = {
      businessName: 'B2',
      tagline: 'C2',
      accentColor: 'D2',
      logo: 'E2',
      stampsRequired: 'F2',
      rewardDescription: 'G2',
      chatLabel: 'H2',
      chatLink: 'I2',
      termsURL: 'J2',
      supportText: 'K2',
      adImageUrl: 'L2',
      progressText: 'M2',
      milestone1Label: 'N2',
      milestone2Label: 'O2',
      milestone1Description: 'P2',
      milestone2Description: 'Q2',
      borderColor: 'R2',
      backgroundColor: 'S2',
      cardBackground: 'T2',
      navButton1Text: 'U2',
      navButton2Text: 'V2',
      navButton3Text: 'W2',
      milestone1Position: 'X2',
      milestone2Position: 'Y2',
      milestone1Icon: 'Z2',
      milestone2Icon: 'AA2',
      stampFilledIcon: 'AB2',
      milestonesJson: 'AC2',
      customFieldLabel: 'AD2',
      contactEmail: 'AE2',
      navButton1Contact: 'AF2',
      callLabel: 'AG2',
      feedbackLabel: 'AH2',
      adminPin: 'AI2',
    };

    var updates = [];
    var keys = Object.keys(body);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (fieldMap[key] !== undefined) {
        updates.push(
          sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: 'Businesses!' + fieldMap[key],
            valueInputOption: 'RAW',
            resource: { values: [[String(body[key])]] },
          })
        );
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await Promise.all(updates);

    return res.status(200).json({
      success: true,
      message: 'Settings updated',
      fieldsUpdated: keys.filter(function(k) { return fieldMap[k] !== undefined; })
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: error.message });
  }
}
