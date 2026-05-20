const express = require('express');
const router = express.Router();

// Basic auth middleware
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';

const basicAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Auth required');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).send('Wrong credentials');
};

router.use(basicAuth);

// View all ads
router.get('/ads', async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(`SELECT * FROM ads ORDER BY created_at DESC LIMIT 100`);
    res.send(`
      <html>
        <head>
          <title>Admin - Ads</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #111; color: #eee; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 14px; }
            th { background: #222; }
            input, button { padding: 6px; margin: 2px; }
            button { cursor: pointer; background: #e11d48; color: white; border: none; border-radius: 4px; }
            button.extend { background: #16a34a; }
          .top { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>Admin - Ads Management</h2>
          <div class="top">
            <form method="POST" action="/admin/ads/extend">
              <input name="id" placeholder="Ad ID" required>
              <input name="days" type="number" placeholder="Add days" value="7">
              <button class="extend">Extend Expiry</button>
            </form>
            <form method="POST" action="/admin/ads/delete" onsubmit="return confirm('Delete this ad?');">
              <input name="id" placeholder="Ad ID" required>
              <button>Delete Ad</button>
            </form>
          </div>
          <table>
            <tr>
              <th>ID</th><th>Type</th><th>Status</th><th>Business</th><th>Title</th>
              <th>Phone</th><th>Created</th><th>Expires</th>
            </tr>
            ${result.rows.map(r => `
              <tr>
                <td>${r.id}</td>
                <td>${r.type}</td>
                <td>${r.status}</td>
                <td>${r.business || r.company || '-'}</td>
                <td>${r.title || r.text || '-'}</td>
                <td>${r.phone || '-'}</td>
                <td>${r.created_at}</td>
                <td>${r.expires_at || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Delete ad
router.post('/ads/delete', async (req, res) => {
  const { id } = req.body;
  await req.app.locals.pool.query(`DELETE FROM ads WHERE id = $1`, [id]);
  res.redirect('/admin/ads');
});

// Extend expiry
router.post('/ads/extend', async (req, res) => {
  const { id, days } = req.body;
  await req.app.locals.pool.query(`UPDATE ads SET expires_at = COALESCE(expires_at, NOW()) + INTERVAL '${parseInt(days)} days' WHERE id = $1`, [id]);
  res.redirect('/admin/ads');
});

module.exports = router;
