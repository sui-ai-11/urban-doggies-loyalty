import { supabase, getTenant } from './_lib/supabase.js';
import { ISSUER_ID, getAccessToken } from './_lib/wallet.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);

    // Get business info
    var { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessID)
      .single();

    if (bizErr || !biz) return res.status(404).json({ error: 'Business not found' });

    var accessToken = await getAccessToken();
    if (!accessToken) return res.status(500).json({ error: 'Failed to get Google access token. Check GOOGLE_WALLET_PRIVATE_KEY and GOOGLE_WALLET_CLIENT_EMAIL env vars.' });

    var classSuffix = businessID.replace(/[^a-zA-Z0-9_.-]/g, '_');
    var classId = ISSUER_ID + '.' + classSuffix;
    var apiBase = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/';

    var bgHex = (biz.background_color || '#17BEBB').replace('#', '');

    var classBody = {
      id: classId,
      issuerName: biz.business_name || 'Loyalty Program',
      programName: (biz.business_name || 'Loyalty') + ' Rewards',
      programLogo: {
        sourceUri: {
          uri: biz.logo || 'https://cdn-icons-png.flaticon.com/512/726/726476.png',
        },
        contentDescription: {
          defaultValue: {
            language: 'en-US',
            value: (biz.business_name || 'Loyalty') + ' logo',
          },
        },
      },
      hexBackgroundColor: '#' + bgHex,
      reviewStatus: 'UNDER_REVIEW',
      accountNameLabel: 'Member',
      accountIdLabel: 'Card ID',
      localizedIssuerName: {
        defaultValue: { language: 'en-US', value: biz.business_name || 'Loyalty Program' },
      },
      localizedProgramName: {
        defaultValue: { language: 'en-US', value: (biz.business_name || 'Loyalty') + ' Rewards' },
      },
    };

    // Check if class already exists
    var getResponse = await fetch(apiBase + classId, {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (getResponse.status === 404) {
      // Create new class
      var createResponse = await fetch('https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classBody),
      });

      if (!createResponse.ok) {
        var createErr = await createResponse.text();
        return res.status(500).json({ error: 'Failed to create class', details: createErr });
      }

      var created = await createResponse.json();
      return res.status(200).json({
        success: true,
        action: 'created',
        classId: classId,
        message: 'LoyaltyClass created for ' + biz.business_name,
      });
    } else if (getResponse.ok) {
      // Update existing class
      classBody.reviewStatus = 'UNDER_REVIEW';
      var patchResponse = await fetch(apiBase + classId, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classBody),
      });

      if (!patchResponse.ok) {
        var patchErr = await patchResponse.text();
        return res.status(500).json({ error: 'Failed to update class', details: patchErr });
      }

      return res.status(200).json({
        success: true,
        action: 'updated',
        classId: classId,
        message: 'LoyaltyClass updated for ' + biz.business_name,
      });
    } else {
      var errText = await getResponse.text();
      return res.status(500).json({ error: 'Failed to check class', details: errText });
    }
  } catch (err) {
    console.error('wallet-class error:', err);
    return res.status(500).json({ error: err.message });
  }
}
