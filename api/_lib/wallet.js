import jwt from 'jsonwebtoken';

var ISSUER_ID = '3388000000023091056';

// Get OAuth2 access token for Google Wallet API
async function getAccessToken() {
  var clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  var privateKey = (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) return null;

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
  return data.access_token || null;
}

// Update a loyalty object's stamps/visits on Google Wallet
async function updateWalletPass(clientToken, stamps, totalVisits, cardsCompleted, activeCoupons) {
  try {
    var accessToken = await getAccessToken();
    if (!accessToken) return;

    var objectId = ISSUER_ID + '.' + clientToken;

    var patchBody = {
      loyaltyPoints: {
        label: 'Stamps',
        balance: {
          int: stamps,
        },
      },
      textModulesData: [
        { header: 'Total Visits', body: String(totalVisits), id: 'total_visits' },
        { header: 'Cards Completed', body: String(cardsCompleted), id: 'cards_completed' },
        { header: 'Active Rewards', body: String(activeCoupons || 0), id: 'active_rewards' },
      ],
    };

    var response = await fetch(
      'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/' + objectId,
      {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchBody),
      }
    );

    if (!response.ok) {
      var errText = await response.text();
      console.log('Wallet update failed (may not exist yet):', response.status, errText);
    } else {
      console.log('Wallet pass updated for', clientToken);
    }
  } catch (err) {
    // Don't fail the stamp operation if wallet update fails
    console.log('Wallet update error (non-fatal):', err.message);
  }
}

export { ISSUER_ID, getAccessToken, updateWalletPass };
