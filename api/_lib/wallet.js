import jwt from 'jsonwebtoken';

var ISSUER_ID = '3388000000023091056';

// Get OAuth2 access token for Google Wallet API
async function getAccessToken() {
  var clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  var privateKey = (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.log('Wallet credentials missing');
    return null;
  }

  var now = Math.floor(Date.now() / 1000);
  var token = jwt.sign({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }, privateKey, { algorithm: 'RS256' });

  var response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + token,
  });

  var data = await response.json();
  if (!data.access_token) {
    console.log('OAuth token error:', JSON.stringify(data));
  }
  return data.access_token || null;
}

// Update a loyalty object's stamps/visits on Google Wallet
async function updateWalletPass(clientToken, stamps, totalVisits, cardsCompleted, activeCoupons, stampsRequired, nextReward) {
  try {
    var accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('No access token, skipping wallet update');
      return;
    }

    var objectId = ISSUER_ID + '.' + clientToken + '_v4';
    var apiBase = 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/';

    // First try to GET the object to see if it exists
    var getResponse = await fetch(apiBase + objectId, {
      headers: { 'Authorization': 'Bearer ' + accessToken },
    });

    if (getResponse.status === 404) {
      console.log('Wallet object not found for', clientToken, '— skipping (user hasnt saved to wallet yet)');
      return;
    }

    if (!getResponse.ok) {
      var errText = await getResponse.text();
      console.log('Wallet GET failed:', getResponse.status, errText);
      return;
    }

    // Build star progress
    var req = stampsRequired || 10;
    var stars = '';
    for (var i = 0; i < req; i++) {
      stars += i < stamps ? '★' : '☆';
    }

    // Object exists — PATCH it
    var patchBody = {
      loyaltyPoints: {
        label: 'Progress',
        balance: {
          string: stars + ' ' + stamps + '/' + req,
        },
      },
      textModulesData: [
        { header: 'Total Visits', body: String(totalVisits), id: 'total_visits' },
      ],
    };

    var patchResponse = await fetch(apiBase + objectId, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patchBody),
    });

    if (!patchResponse.ok) {
      var patchErr = await patchResponse.text();
      console.log('Wallet PATCH failed:', patchResponse.status, patchErr);
    } else {
      console.log('Wallet pass updated for', clientToken, '— stamps:', stamps, 'visits:', totalVisits);
    }
  } catch (err) {
    // Don't fail the stamp operation if wallet update fails
    console.log('Wallet update error (non-fatal):', err.message);
  }
}

export { ISSUER_ID, getAccessToken, updateWalletPass };
