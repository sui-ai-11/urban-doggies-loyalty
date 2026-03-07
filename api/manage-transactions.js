import { verifySession } from './_lib/auth.js';
import { supabase, getTenant } from './_lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var session = await verifySession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    var businessID = await getTenant(req);
    if (!businessID) return res.status(400).json({ error: 'No tenant' });

    // GET — get balance and transactions for a client
    if (req.method === 'GET') {
      var clientID = req.query.clientID;
      if (!clientID) return res.status(400).json({ error: 'clientID required' });

      var { data: txns, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('business_id', businessID)
        .eq('client_id', clientID)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      var balance = 0;
      (txns || []).forEach(function(t) {
        if (t.type === 'credit') balance += parseFloat(t.amount) || 0;
        else balance -= parseFloat(t.amount) || 0;
      });

      var transactions = (txns || []).map(function(t) {
        return {
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount) || 0,
          date: t.created_at ? t.created_at.substring(0, 10) : '',
          notes: t.notes || '',
        };
      });

      return res.status(200).json({ balance: balance, transactions: transactions });
    }

    // POST — add credit or debit
    if (req.method === 'POST') {
      var { clientID, type, amount, notes, staffName, branch } = req.body;
      if (!clientID || !amount) return res.status(400).json({ error: 'clientID and amount required' });
      if (type !== 'credit' && type !== 'debit') return res.status(400).json({ error: 'type must be credit or debit' });

      var numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

      // For debits, check balance
      if (type === 'debit') {
        var { data: txns2 } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('business_id', businessID)
          .eq('client_id', clientID);

        var currentBalance = 0;
        (txns2 || []).forEach(function(t) {
          if (t.type === 'credit') currentBalance += parseFloat(t.amount) || 0;
          else currentBalance -= parseFloat(t.amount) || 0;
        });

        if (numAmount > currentBalance) {
          return res.status(400).json({ error: 'Insufficient balance. Current: ₱' + currentBalance.toLocaleString() });
        }
      }

      var txID = 'TXN_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();

      var { error: insertErr } = await supabase.from('transactions').insert({
        id: txID,
        client_id: clientID,
        business_id: businessID,
        type: type,
        amount: numAmount,
        notes: notes || '',
        staff_name: staffName || '',
        branch: branch || '',
      });

      if (insertErr) return res.status(500).json({ error: insertErr.message });

      return res.status(200).json({ success: true, txID: txID });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
