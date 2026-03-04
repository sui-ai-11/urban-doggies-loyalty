import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

function generateID(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check
  var session = await verifySession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    var businessID = await getTenant(req);
    if (!businessID) return res.status(400).json({ error: 'No tenant' });

    // GET — list pets for a client
    if (req.method === 'GET') {
      var clientID = req.query.clientID;
      if (!clientID) return res.status(400).json({ error: 'clientID required' });

      var { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('business_id', businessID)
        .eq('client_id', clientID)
        .order('created_at', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ pets: pets || [] });
    }

    // POST — add a pet
    if (req.method === 'POST') {
      var { clientID, name, type, breed, birthdayMonth, instructions, profileImage } = req.body;
      if (!clientID || !name) return res.status(400).json({ error: 'clientID and name required' });

      var petID = generateID('PET_');
      var { error: insertErr } = await supabase.from('pets').insert({
        id: petID,
        client_id: clientID,
        business_id: businessID,
        name: name,
        type: type || 'dog',
        breed: breed || '',
        birthday_month: birthdayMonth || '',
        instructions: instructions || '',
        profile_image: profileImage || '',
      });

      if (insertErr) return res.status(500).json({ error: insertErr.message });
      return res.status(200).json({ success: true, petID: petID });
    }

    // PUT — update a pet
    if (req.method === 'PUT') {
      var { petID, name, type, breed, birthdayMonth, instructions, profileImage } = req.body;
      if (!petID) return res.status(400).json({ error: 'petID required' });

      var updates = {};
      if (name !== undefined) updates.name = name;
      if (type !== undefined) updates.type = type;
      if (breed !== undefined) updates.breed = breed;
      if (birthdayMonth !== undefined) updates.birthday_month = birthdayMonth;
      if (instructions !== undefined) updates.instructions = instructions;
      if (profileImage !== undefined) updates.profile_image = profileImage;

      var { error: updateErr } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petID)
        .eq('business_id', businessID);

      if (updateErr) return res.status(500).json({ error: updateErr.message });
      return res.status(200).json({ success: true });
    }

    // DELETE — remove a pet
    if (req.method === 'DELETE') {
      var petID = req.query.petID;
      if (!petID) return res.status(400).json({ error: 'petID required' });

      var { error: deleteErr } = await supabase
        .from('pets')
        .delete()
        .eq('id', petID)
        .eq('business_id', businessID);

      if (deleteErr) return res.status(500).json({ error: deleteErr.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
