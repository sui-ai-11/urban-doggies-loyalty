import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getTenant(req) {
  var host = req.headers.host || req.headers['x-forwarded-host'] || '';
  // Remove port for local dev
  host = host.split(':')[0];

  // Bare domain (no subdomain) — return null for landing page
  if (host === 'stampcard.org' || host === 'www.stampcard.org') {
    return null;
  }
  
  var { data } = await supabase
    .from('tenants')
    .select('business_id')
    .eq('domain', host)
    .eq('active', true)
    .single();
  
  return data ? data.business_id : null;
}

export { supabase, getTenant };
