import express from 'express';
import crypto from 'crypto';
import { pendingPayments, supabase } from './server.js';

const router = express.Router();

const FLW_SECRET_KEY = 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

router.post('/paid-ads/initiate-payment', async (req, res) => {
  const { business, link, text, image } = req.body;
  if (!business ||!link ||!text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'ad_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { business, link, text, image, type: 'paid', token };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount: AD_PRICE,
        currency: 'KES',
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: {
          email: 'advertiser@jobai.com',
          name: business
        },
        customizations: {
          title: 'Sponsored Ad Payment',
          description: 'Pay ' + AD_PRICE + ' KES for 7 days ad'
        }
      })
    });

    const data = await response.json();
    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: 'Failed to create payment' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Payment error' });
  }
});

router.get('/payment-callback', async (req, res) => {
  const { transaction_id, tx_ref } = req.query;

  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}` }
    });
    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'successful') {
      const jobData = pendingPayments[tx_ref];
      if (jobData) {
        const id = crypto.randomUUID();

        if (jobData.type === 'paid') {
          const expires = new Date();
          expires.setDate(expires.getDate() + AD_DURATION_DAYS);

          await supabase.from('ads').insert([{
            id,
            token: jobData.token,
            title: jobData.business,
            link: jobData.link,
            image_url: jobData.image,
            description: jobData.text,
            type: 'paid',
            status: 'approved',
            payment_ref: transaction_id,
            expires_at: expires.toISOString()
          }]);
        } else {
          await supabase.from('ads').insert([{
            id,
            token: jobData.token,
            title: jobData.title,
            company: jobData.company,
            location: jobData.location,
            phone: jobData.phone,
            link: jobData.url,
            description: jobData.description,
            type: 'user',
            status: 'approved',
            payment_ref: transaction_id
          }]);
        }

        delete pendingPayments[tx_ref];
        res.redirect('/?payment=success');
      } else {
        res.redirect('/?payment=failed');
      }
    } else {
      res.redirect('/?payment=failed');
    }
  } catch (err) {
    res.redirect('/?payment=failed');
  }
});

router.get('/ads', async (req, res) => {
  const { data, error } = await supabase
 .from('ads')
 .select('*')
 .eq('type', 'user')
 .eq('status', 'approved')
 .order('created_at', { ascending: false });

  if (error) return res.json([]);
  res.json(data);
});

router.get('/paid-ads', async (req, res) => {
  const { data, error } = await supabase
 .from('ads')
 .select('*')
 .eq('type', 'paid')
 .eq('status', 'approved')
 .gte('expires_at', new Date().toISOString())
 .order('created_at', { ascending: false });

  if (error) return res.json([]);
  res.json(data);
});

router.post('/ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;

  const { error } = await supabase
 .from('ads')
 .update({ title, location, company, description })
 .eq('id', id)
 .eq('token', token)
 .eq('type', 'user');

  if (error) return res.json({ success: false });
  res.json({ success: true });
});

router.post('/ads/delete', async (req, res) => {
  const { id, token } = req.body;

  const { error } = await supabase
 .from('ads')
 .delete()
 .eq('id', id)
 .eq('token', token)
 .eq('type', 'user');

  if (error) return res.json({ success: false });
  res.json({ success: true });
});

router.post('/paid-ads/edit', async (req, res) => {
  const { id, token, title, description } = req.body;

  const { error } = await supabase
 .from('ads')
 .update({ title: title, description: description })
 .eq('id', id)
 .eq('token', token)
 .eq('type', 'paid');

  if (error) return res.json({ success: false });
  res.json({ success: true });
});

router.post('/paid-ads/delete', async (req, res) => {
  const { id, token } = req.body;

  const { error } = await supabase
 .from('ads')
 .delete()
 .eq('id', id)
 .eq('token', token)
 .eq('type', 'paid');

  if (error) return res.json({ success: false });
  res.json({ success: true });
});

router.get('/manual-approve/:txid', async (req, res) => {
  const txid = req.params.txid;
  let jobData = null;
  let txRefKey = null;
  for (let key in pendingPayments) {
    jobData = pendingPayments[key];
    txRefKey = key;
    break;
  }

  if (!jobData) {
    return res.send('No pending job found. Pay again or check if server restarted.');
  }

  const id = crypto.randomUUID();

  if (jobData.type === 'paid') {
    const expires = new Date();
    expires.setDate(expires.getDate() + AD_DURATION_DAYS);
    await supabase.from('ads').insert([{
      id,
      token: jobData.token,
      title: jobData.business,
      link: jobData.link,
      image_url: jobData.image,
      description: jobData.text,
      type: 'paid',
      status: 'approved',
      payment_ref: txid,
      expires_at: expires.toISOString()
    }]);
  } else {
    await supabase.from('ads').insert([{
      id,
      token: jobData.token,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      phone: jobData.phone,
      link: jobData.url,
      description: jobData.description,
      type: 'user',
      status: 'approved',
      payment_ref: txid
    }]);
  }

  delete pendingPayments[txRefKey];
  res.send('Approved! Go back to the site and refresh.');
});

export default router;
