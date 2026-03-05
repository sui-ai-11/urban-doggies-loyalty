import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var session = await verifySession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    var businessID = await getTenant(req);
    if (!businessID) return res.status(400).json({ error: 'No tenant' });

    var { imageData, fileName, bucket } = req.body;
    if (!imageData) return res.status(400).json({ error: 'imageData required' });

    var bucketName = bucket || 'pet-images';

    // imageData is base64 string like "data:image/jpeg;base64,/9j/4AAQ..."
    var matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid image format' });

    var mimeType = matches[1];
    var base64 = matches[2];
    var buffer = Buffer.from(base64, 'base64');

    var ext = mimeType.split('/')[1] || 'jpg';
    if (ext === 'jpeg') ext = 'jpg';
    var storagePath = businessID + '/' + Date.now() + '_' + (fileName || 'image') + '.' + ext;

    var { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) return res.status(500).json({ error: error.message });

    var { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return res.status(200).json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
