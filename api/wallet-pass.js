import { supabase, getTenant } from './_lib/supabase.js';
import jwt from 'jsonwebtoken';

var ISSUER_ID = '3388000000023091056';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    var businessID = await getTenant(req);
    var token = req.query.token || (req.body && req.body.token);

    if (!token) return res.status(400).json({ error: 'Client token is required' });

    // Get client
    var { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*')
      .eq('token', token)
      .single();

    if (clientErr || !client) return res.status(404).json({ error: 'Client not found' });

    var clientBusinessID = client.business_id || businessID;

    // Get business info
    var { data: biz, error: bizErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', clientBusinessID)
      .single();

    if (bizErr || !biz) return res.status(404).json({ error: 'Business not found' });

    // Count active visits
    var { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('status', 'active');

    totalVisits = totalVisits || 0;
    var stampsRequired = biz.stamps_required || 10;
    var currentCardStamps = totalVisits % stampsRequired;
    var cardsCompleted = Math.floor(totalVisits / stampsRequired);

    // Count active coupons
    var { count: activeCoupons } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', client.id)
      .eq('redeemed', 'FALSE');

    activeCoupons = activeCoupons || 0;

    // Build class suffix from business ID (unique per business)
    var classSuffix = clientBusinessID.replace(/[^a-zA-Z0-9_.-]/g, '_');
    var objectSuffix = client.token;

    // Determine colors
    var accentHex = (biz.accent_color || '#17BEBB').replace('#', '');
    var bgHex = (biz.background_color || '#17BEBB').replace('#', '');

    // Build LoyaltyClass (program template for this business)
    var loyaltyClass = {
      id: ISSUER_ID + '.' + classSuffix,
      issuerName: biz.business_name || 'Loyalty Program',
      programName: biz.business_name + ' Rewards',
      programLogo: {
        sourceUri: {
          uri: biz.logo || 'https://cdn-icons-png.flaticon.com/512/726/726476.png',
        },
        contentDescription: {
          defaultValue: {
            language: 'en-US',
            value: biz.business_name + ' logo',
          },
        },
      },
      reviewStatus: 'UNDER_REVIEW',
      hexBackgroundColor: '#' + bgHex,
      localizedIssuerName: {
        defaultValue: {
          language: 'en-US',
          value: biz.business_name || 'Loyalty Program',
        },
      },
      localizedProgramName: {
        defaultValue: {
          language: 'en-US',
          value: (biz.business_name || 'Loyalty') + ' Rewards',
        },
      },
    };

    // Build LoyaltyObject (individual customer card)
    var loyaltyObject = {
      id: ISSUER_ID + '.' + objectSuffix,
      classId: ISSUER_ID + '.' + classSuffix,
      state: 'ACTIVE',
      accountId: client.token,
      accountName: client.name,
      loyaltyPoints: {
        label: 'Stamps',
        balance: {
          int: currentCardStamps,
        },
      },
      barcode: {
        type: 'QR_CODE',
        value: client.token,
        alternateText: client.token,
      },
      textModulesData: [
        {
          header: 'Total Visits',
          body: String(totalVisits),
          id: 'total_visits',
        },
        {
          header: 'Cards Completed',
          body: String(cardsCompleted),
          id: 'cards_completed',
        },
        {
          header: 'Active Rewards',
          body: String(activeCoupons),
          id: 'active_rewards',
        },
      ],
      heroImage: biz.ad_image_url ? {
        sourceUri: {
          uri: biz.ad_image_url,
        },
        contentDescription: {
          defaultValue: {
            language: 'en-US',
            value: biz.business_name,
          },
        },
      } : undefined,
    };

    // Remove undefined heroImage
    if (!loyaltyObject.heroImage) delete loyaltyObject.heroImage;

    // Get private key from environment
    var privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
    if (!privateKey) {
      return res.status(500).json({ error: 'Google Wallet private key not configured' });
    }

    // Fix escaped newlines in env var
    privateKey = privateKey.replace(/\\n/g, '\n');

    var serviceAccountEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL ||
      'stampcardbysimplelabsph-wallet@stamp-card-by-simple-labs-ph.iam.gserviceaccount.com';

    // Create JWT claims
    var claims = {
      iss: serviceAccountEmail,
      aud: 'google',
      typ: 'savetowallet',
      origins: [req.headers.origin || 'https://stampcard.org'],
      payload: {
        loyaltyClasses: [loyaltyClass],
        loyaltyObjects: [loyaltyObject],
      },
    };

    // Sign JWT with service account private key
    var walletToken = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

    // Generate the save URL
    var saveUrl = 'https://pay.google.com/gp/v/save/' + walletToken;

    return res.status(200).json({
      success: true,
      saveUrl: saveUrl,
      client: {
        name: client.name,
        token: client.token,
        stamps: currentCardStamps,
        totalVisits: totalVisits,
      },
    });
  } catch (err) {
    console.error('wallet-pass error:', err);
    return res.status(500).json({ error: err.message });
  }
}
