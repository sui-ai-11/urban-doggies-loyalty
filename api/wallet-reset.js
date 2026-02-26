import { ISSUER_ID, getAccessToken } from './_lib/wallet.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var token = req.query.token || (req.body && req.body.token);
    if (!token) return res.status(400).json({ error: 'Token required' });

    var accessToken = await getAccessToken();
    if (!accessToken) return res.status(500).json({ error: 'Failed to get access token' });

    var objectId = ISSUER_ID + '.' + token;
    var apiBase = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/';

    // Try to update the object with new structure via PUT (full replace)
    var getResponse = await fetch(apiBase + objectId, {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (getResponse.status === 404) {
      return res.status(200).json({ success: true, message: 'Object does not exist — will be created fresh on next Add to Wallet' });
    }

    var existing = await getResponse.json();

    // Patch with empty text modules to clear old data
    var patchBody = {
      textModulesData: [],
      linksModuleData: { uris: [] },
    };

    var patchResponse = await fetch(apiBase + objectId, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    var patchResult = await patchResponse.text();

    return res.status(200).json({
      success: true,
      message: 'Object cleared. Remove from Google Wallet and re-add.',
      status: patchResponse.status,
      objectId: objectId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
