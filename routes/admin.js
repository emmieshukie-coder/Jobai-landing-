const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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

// Escape HTML to prevent breaking the page
const escapeHtml = (str) => {
  if (!str) return '-';
  return String(str)
   .replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');
};

// Send rejection notification - email + SMS
async function sendRejectionNotification(ad) {
  const message = `Your ad "${ad.title || ad.text || 'Ad #' + ad.id}" was rejected.\nReason: ${ad.rejection_reason}\n\nYou can edit and resubmit it.`;

  // Email
  if (ad.email && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: ad.email,
        subject: 'Ad Rejected',
        text: message
      });
    } catch (e) {
      console.error('Email send failed:', e.message);
    }
  }

  // SMS - uncomment if using Twilio
  // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  // if (ad.phone) {
  // try {
  // await twilio.messages.create({ from: process.env.TWILIO_FROM, to: ad.phone, body: message });
  // } catch (e) {
  // console.error('SMS send failed:', e.message);
  // }
  // }
}

// View all ads with search and status filter
router.get('/ads', async (req, res) => {
  try {
    const search = req.query.q || '';
    const status = req.query.status || 'all';

    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(business ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR title ILIKE $${paramCount} OR company ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status === 'pending') {
      conditions.push(`status = $${paramCount}`);
      params.push('pending');
      paramCount++;
    } else if (status === 'approved') {
      conditions.push(`status = $${paramCount} AND expires_at > NOW()`);
      params.push('approved');
      paramCount++;
    } else if (status === 'rejected') {
      conditions.push(`status = $${paramCount}`);
      params.push('rejected');
      paramCount++;
    } else if (status === 'expired') {
      conditions.push(`expires_at <= NOW()`);
    }

    let query = `SELECT * FROM ads`;
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await req.app.locals.pool.query(query, params);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Admin - Ads</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              padding: 20px;
              background: #111;
              color: #eee;
              margin: 0;
            }
            h2 { margin-top: 0; }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 20px;
              background: #1a1a1a;
            }
            th, td {
              border: 1px solid #333;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #222;
              font-weight: 600;
            }
            tr:hover { background: #1f1f1f; }
            input, button, select, textarea {
              padding: 8px 12px;
              margin: 2px;
              background: #222;
              color: #eee;
              border: 1px solid #333;
              border-radius: 4px;
              font-size: 14px;
            }
            button {
              cursor: pointer;
              background: #e11d48;
              color: white;
              border: none;
              font-weight: 500;
            }
            button:hover { opacity: 0.9; }
            button.extend { background: #16a34a; }
            button.search { background: #2563eb; }
            button.approve { background: #059669; }
            button.reject { background: #dc2626; }
           .top {
              margin-bottom: 20px;
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              align-items: flex-end;
            }
           .filters {
              margin-bottom: 15px;
              display: flex;
              gap: 10px;
              flex-wrap: wrap;
              align-items: center;
            }
           .filters a {
              padding: 8px 14px;
              background: #222;
              color: #eee;
              text-decoration: none;
              border-radius: 4px;
              border: 1px solid #333;
            }
           .filters a.active {
              background: #2563eb;
              border-color: #2563eb;
            }
           .filters a:hover { background: #333; }
           .actions form { display: inline-block; margin-right: 4px; }
           .reason {
              color: #f87171;
              font-size: 12px;
              font-style: italic;
            }
            dialog {
              background: #1a1a1a;
              border: 1px solid #333;
              border-radius: 8px;
              padding: 24px;
              color: #eee;
            }
            dialog::backdrop { background: rgba(0,0,0,0.7); }
           .count { color: #aaa; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h2>Admin - Ads Management</h2>

          <div class="filters">
            <strong>Filter:</strong>
            <a href="/admin/ads?q=${escapeHtml(search)}" class="${status === 'all'? 'active' : ''}">All</a>
            <a href="/admin/ads?q=${escapeHtml(search)}&status=pending" class="${status === 'pending'? 'active' : ''}">Pending</a>
            <a href="/admin/ads?q=${escapeHtml(search)}&status=approved" class="${status === 'approved'? 'active' : ''}">Active</a>
            <a href="/admin/ads?q=${escapeHtml(search)}&status=rejected" class="${status === 'rejected'? 'active' : ''}">Rejected</a>
            <a href="/admin/ads?q=${escapeHtml(search)}&status=expired" class="${status === 'expired'? 'active' : ''}">Expired</a>
          </div>

          <div class="filters">
            <form method="GET" action="/admin/ads">
              <input type="hidden" name="status" value="${escapeHtml(status)}">
              <input name="q" placeholder="Search business, phone, title..." value="${escapeHtml(search)}" style="width: 300px;">
              <button class="search">Search</button>
              <a href="/admin/ads">Clear</a>
            </form>
          </div>

          <div class="top">
            <form method="POST" action="/admin/ads/approve">
              <input name="id" placeholder="Ad ID" required>
              <input name="days" type="number" placeholder="Days" value="30" min="1">
              <button class="approve">Approve</button>
            </form>
            <button class="reject" onclick="document.getElementById('rejectModal').showModal()">Reject with Reason</button>
            <form method="POST" action="/admin/ads/extend">
              <input name="id" placeholder="Ad ID" required>
              <input name="days" type="number" placeholder="Add days" value="7" min="1">
              <button class="extend">Extend Expiry</button>
            </form>
            <form method="POST" action="/admin/ads/delete" onsubmit="return confirm('Delete this ad permanently?');">
              <input name="id" placeholder="Ad ID" required>
              <button>Delete Ad</button>
            </form>
          </div>

          <p class="count">Showing ${result.rows.length} results</p>

          <table>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Business</th>
              <th>Title</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
            ${result.rows.map(r => `
              <tr>
                <td>${r.id}</td>
                <td>${escapeHtml(r.type)}</td>
                <td>${escapeHtml(r.status)}</td>
                <td>${escapeHtml(r.business || r.company)}</td>
                <td>${escapeHtml(r.title || r.text)}</td>
                <td>${escapeHtml(r.phone)}</td>
                <td>${escapeHtml(r.email)}</td>
                <td>${r.created_at? new Date(r.created_at).toLocaleString() : '-'}</td>
                <td>${r.expires_at? new Date(r.expires_at).toLocaleString() : '-'}</td>
                <td><span class="reason">${escapeHtml(r.rejection_reason)}</span></td>
                <td class="actions">
                  ${r.status === 'pending'? `
                    <form method="POST" action="/admin/ads/approve" style="display:inline;">
                      <input type="hidden" name="id" value="${r.id}">
                      <input type="hidden" name="days" value="30">
                      <button class="approve" style="padding:4px 8px; font-size:12px;">Approve</button>
                    </form>
                    <button onclick="openReject(${r.id})" class="reject" style="padding:4px 8px; font-size:12px;">Reject</button>
                  ` : '-'}
                </td>
              </tr>
            `).join('')}
          </table>

          <dialog id="rejectModal">
            <form method="POST" action="/admin/ads/reject">
              <h3 style="margin-top:0;">Reject Ad</h3>
              <input type="hidden" name="id" id="rejectId">
              <label>Reason:</label><br>
              <textarea name="reason" rows="4" cols="50" placeholder="Enter reason for rejection..." required></textarea><br><br>
              <button type="submit" class="reject">Confirm Reject & Notify</button>
              <button type="button" onclick="document.getElementById('rejectModal').close()" style="background:#444;">Cancel</button>
            </form>
          </dialog>

          <script>
            function openReject(id) {
              document.getElementById('rejectId').value = id;
              document.getElementById('rejectModal').showModal();
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Approve ad
router.post('/ads/approve', async (req, res) => {
  const { id, days } = req.body;
  const d = parseInt(days) || 30;
  await req.app.locals.pool.query(
    `UPDATE ads
     SET status = 'approved',
         expires_at = COALESCE(expires_at, NOW()) + INTERVAL '${d} days',
         rejection_reason = NULL
     WHERE id = $1`,
    [id]
  );
  res.redirect('/admin/ads?status=pending');
});

// Reject ad with reason + notify
router.post('/ads/reject', async (req, res) => {
  const { id, reason } = req.body;
  const result = await req.app.locals.pool.query(
    `UPDATE ads SET status = 'rejected', rejection_reason = $2 WHERE id = $1 RETURNING *`,
    [id, reason]
  );
  if (result.rows[0]) {
    await sendRejectionNotification(result.rows[0]);
  }
  res.redirect('/admin/ads?status=pending');
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
  await req.app.locals.pool.query(
    `UPDATE ads SET expires_at = COALESCE(expires_at, NOW()) + INTERVAL '${parseInt(days)} days' WHERE id = $1`,
    [id]
  );
  res.redirect('/admin/ads');
});

module.exports = router;
