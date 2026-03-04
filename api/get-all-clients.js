import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

    // Auth check
    var session = await verifySession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    var businessID = await getTenant(req);

    // Get all clients
    var { data: clients, error: cErr } = await supabase
      .from('clients')
      .select('*')
      .eq('business_id', businessID)
      .order('created_at', { ascending: false });

    if (cErr) return res.status(500).json({ error: cErr.message });

    // Get all active visits with timestamps and branch
    var { data: visits, error: vErr } = await supabase
      .from('visits')
      .select('client_id, visited_at, branch, staff_name')
      .eq('business_id', businessID)
      .eq('status', 'active');

    if (vErr) return res.status(500).json({ error: vErr.message });

    // Get all coupons for analytics
    var { data: coupons, error: cpErr } = await supabase
      .from('coupons')
      .select('id, client_id, redeemed, branch, staff_name')
      .eq('business_id', businessID);

    if (cpErr) return res.status(500).json({ error: cpErr.message });

    // Get all pets for breed info
    var { data: allPets, error: petErr } = await supabase
      .from('pets')
      .select('client_id, name, type, breed')
      .eq('business_id', businessID);

    // Build pets by client
    var petsByClient = {};
    var allBreeds = {};
    (allPets || []).forEach(function(p) {
      if (!petsByClient[p.client_id]) petsByClient[p.client_id] = [];
      petsByClient[p.client_id].push({ name: p.name, type: p.type, breed: p.breed });
      if (p.breed) allBreeds[p.breed] = true;
    });

    // Count visits per client
    var visitCounts = {};
    (visits || []).forEach(function(v) {
      visitCounts[v.client_id] = (visitCounts[v.client_id] || 0) + 1;
    });

    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    // Get all pets for this business
    var { data: allPets } = await supabase
      .from('pets')
      .select('client_id, name, type, breed, birthday_month')
      .eq('business_id', businessID);

    var petsByClient = {};
    (allPets || []).forEach(function(p) {
      if (!petsByClient[p.client_id]) petsByClient[p.client_id] = [];
      petsByClient[p.client_id].push(p);
    });

    var origin = req.headers.origin || req.headers.referer || 'https://stampcard.org';

    var result = (clients || [])
      .filter(function(c) { return (c.status || '').toLowerCase() !== 'rejected'; })
      .map(function(c) {
        // Derive birthday month from date if not set
        var bdayMonth = c.birthday_month || '';
        if (!bdayMonth && c.birthday) {
          // Try parsing date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
          var bday = c.birthday;
          var monthNum = -1;
          if (bday.indexOf('-') > -1) {
            // YYYY-MM-DD
            monthNum = parseInt(bday.split('-')[1]) - 1;
          } else if (bday.indexOf('/') > -1) {
            var parts = bday.split('/');
            // DD/MM/YYYY (day first if first part <= 12 is ambiguous, assume DD/MM)
            monthNum = parseInt(parts[1]) - 1;
          }
          if (monthNum >= 0 && monthNum < 12) {
            bdayMonth = months[monthNum];
          }
        }

        return {
          clientID: c.id,
          businessID: c.business_id,
          name: c.name,
          token: c.token,
          mobile: c.mobile || '',
          email: c.email || '',
          birthday: c.birthday || '',
          birthdayMonth: bdayMonth,
          dateAdded: c.created_at || '',
          notes: c.notes || '',
          status: c.status || 'approved',
          visits: visitCounts[c.id] || 0,
          requiredVisits: 10,
          cardLink: origin.replace(/\/$/, '') + '/#/card?token=' + c.token,
          pets: petsByClient[c.id] || [],
          breeds: (petsByClient[c.id] || []).map(function(p) { return p.breed; }).filter(Boolean),
          pets: petsByClient[c.id] || [],
          breeds: (petsByClient[c.id] || []).map(function(p) { return p.breed; }).filter(Boolean),
        };
      });

    // Build birthday months from derived data
    var birthdayMonths = months.filter(function(month) {
      return result.some(function(c) { return c.birthdayMonth === month; });
    });

    // === ANALYTICS ===
    var now = new Date();
    var today = now.toISOString().split('T')[0];
    var thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    var sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    var ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

    var approvedClients = result.filter(function(c) { return c.status === 'approved'; });
    var totalClients = approvedClients.length;

    // Stamps today
    var stampsToday = (visits || []).filter(function(v) {
      return v.visited_at && v.visited_at.substring(0, 10) === today;
    }).length;

    // Repeat visit rate (clients with 2+ visits)
    var clientsWithVisits = approvedClients.filter(function(c) { return c.visits > 0; }).length;
    var repeatClients = approvedClients.filter(function(c) { return c.visits >= 2; }).length;
    var repeatRate = clientsWithVisits > 0 ? Math.round((repeatClients / clientsWithVisits) * 100) : 0;

    // Average visits per client
    var totalVisits = (visits || []).length;
    var avgVisits = totalClients > 0 ? (totalVisits / totalClients).toFixed(1) : '0';

    // Average days between visits per client
    var visitsByClient = {};
    (visits || []).forEach(function(v) {
      if (!visitsByClient[v.client_id]) visitsByClient[v.client_id] = [];
      visitsByClient[v.client_id].push(new Date(v.visited_at));
    });
    var allGaps = [];
    Object.keys(visitsByClient).forEach(function(cid) {
      var dates = visitsByClient[cid].sort(function(a, b) { return a - b; });
      for (var i = 1; i < dates.length; i++) {
        allGaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      }
    });
    var avgDaysBetween = allGaps.length > 0 ? Math.round(allGaps.reduce(function(a, b) { return a + b; }, 0) / allGaps.length) : 0;

    // Active vs inactive (last visit within 30/60/90 days)
    var lastVisitByClient = {};
    (visits || []).forEach(function(v) {
      var d = new Date(v.visited_at);
      if (!lastVisitByClient[v.client_id] || d > lastVisitByClient[v.client_id]) {
        lastVisitByClient[v.client_id] = d;
      }
    });
    var active30 = 0, active60 = 0, active90 = 0, inactive = 0;
    var active30Ids = [], active60Ids = [], active90Ids = [], inactiveIds = [];
    approvedClients.forEach(function(c) {
      var last = lastVisitByClient[c.clientID];
      if (!last) { inactive++; inactiveIds.push(c.clientID); return; }
      if (last >= thirtyDaysAgo) { active30++; active30Ids.push(c.clientID); }
      else if (last >= sixtyDaysAgo) { active60++; active60Ids.push(c.clientID); }
      else if (last >= ninetyDaysAgo) { active90++; active90Ids.push(c.clientID); }
      else { inactive++; inactiveIds.push(c.clientID); }
    });

    // New registrations (last 4 weeks)
    var weeklyRegistrations = [0, 0, 0, 0];
    approvedClients.forEach(function(c) {
      if (!c.dateAdded) return;
      var d = new Date(c.dateAdded);
      var weeksAgo = Math.floor((now - d) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAgo >= 0 && weeksAgo < 4) weeklyRegistrations[weeksAgo]++;
    });

    // Coupon breakdown
    var couponsAll = coupons || [];
    var couponsIssued = couponsAll.length;
    var couponsRedeemed = couponsAll.filter(function(c) { return c.redeemed === 'TRUE' || c.redeemed === true; }).length;
    var couponsVoided = couponsAll.filter(function(c) { return c.redeemed === 'VOIDED'; }).length;
    var couponsActive = couponsIssued - couponsRedeemed - couponsVoided;
    var redemptionRate = couponsIssued > 0 ? Math.round((couponsRedeemed / couponsIssued) * 100) : 0;

    // Branch comparison
    var branchStats = {};
    (visits || []).forEach(function(v) {
      var br = v.branch || 'Unassigned';
      if (!branchStats[br]) branchStats[br] = { visits: 0, staff: {} };
      branchStats[br].visits++;
      if (v.staff_name) {
        branchStats[br].staff[v.staff_name] = (branchStats[br].staff[v.staff_name] || 0) + 1;
      }
    });
    // Add coupon counts per branch
    couponsAll.forEach(function(c) {
      var br = c.branch || 'Unassigned';
      if (!branchStats[br]) branchStats[br] = { visits: 0, staff: {} };
      if (!branchStats[br].coupons) branchStats[br].coupons = 0;
      branchStats[br].coupons++;
    });

    var analytics = {
      totalClients: totalClients,
      totalVisits: totalVisits,
      stampsToday: stampsToday,
      rewardsIssued: couponsIssued,
      repeatRate: repeatRate,
      repeatClients: repeatClients,
      avgVisits: avgVisits,
      avgDaysBetween: avgDaysBetween,
      active30: active30,
      active60: active60,
      active90: active90,
      inactive: inactive,
      active30Ids: active30Ids,
      active60Ids: active60Ids,
      active90Ids: active90Ids,
      inactiveIds: inactiveIds,
      weeklyRegistrations: weeklyRegistrations.reverse(),
      couponsIssued: couponsIssued,
      couponsRedeemed: couponsRedeemed,
      couponsVoided: couponsVoided,
      couponsActive: couponsActive,
      redemptionRate: redemptionRate,
      branchStats: branchStats,
    };

    return res.status(200).json({
      clients: result,
      birthdayMonths: birthdayMonths,
      allBreeds: [...new Set((allPets || []).map(function(p) { return p.breed; }).filter(Boolean))].sort(),
      breeds: Object.keys(allBreeds).sort(),
      analytics: analytics,
    });
  } catch (err) {
    console.error('get-all-clients error:', err);
    return res.status(500).json({ error: err.message });
  }
}
