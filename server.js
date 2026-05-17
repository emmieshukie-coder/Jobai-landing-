import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

let userAds = [];
let payments = []; // stores successful payments

app.use(express.json());
app.use(express.static('public'));

// Debug route - delete after testing
app.get('/debug', (req, res) => {
  res.json({
    hasPublicKey: !!FLW_PUBLIC_KEY,
    hasSecretKey: !!FLW_SECRET_KEY,
    hasAdzunaAppId: !!ADZUNA_APP_ID,
    hasAdzunaApiKey: !!ADZUNA_API_KEY,
    publicKeyValue: FLW_PUBLIC_KEY ? FLW_PUBLIC_KEY.substring(0, 10) + '...' : null
  });
});

// Public site
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jobai - Get Connected to Jobs & Workers</title>
<script src="https://checkout.flutterwave.com/v3.js"></script>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }
.hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 60px 20px; text-align: center; }
.container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
.controls { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.controls input,.controls select { padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; background: white; }
.controls input { flex: 1; min-width: 200px; }
.section { margin-bottom: 48px; }
.job-card { background: white; padding: 24px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 20px; }
.job-meta { margin: 0 0 12px 0; color: #666; font-size: 14px; }
.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.btn-group { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: none; cursor: pointer; }
.ad-form { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 32px; }
.ad-form input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
.loading { text-align: center; color: #666; padding: 40px; font-size: 16px; }
.error { text-align: center; color: #d32f2f; padding: 40px; }
</style>
</head>
<body>
<div class="hero">
<h1>Get Connected to Jobs & Workers</h1>
<p>AI-powered matching for Uganda, Kenya, Tanzania, Rwanda, India</p>
</div>
<div class="container">
<div class="controls">
<input type="text" id="searchInput" placeholder="Search: cleaner, nurse, teacher, engineer..." />
<select id="dateFilter">
<option value="7">Last 7 days</option>
<option value="all">All time</option>
</select>
</div>

<div class="section">
<h2>Pay to Feature Your Job - 5000 UGX</h2>
<div class="ad-form">
<input type="text" id="payName" placeholder="Your name" required>
<input type="email" id="payEmail" placeholder="Your email" required>
<input type="tel" id="payPhone" placeholder="Phone number" required>
<button class="connect-btn" onclick="payNow()">Pay with MTN/Airtel/Card</button>
<p id="payMsg" style="margin-top:10px; font-size:14px;"></p>
</div>
</div>

<div class="section">
<h2>Trending Jobs</h2>
<div id="jobs" class="loading">Loading jobs...</div>
</div>
</div>

<script>
const FLW_PUBLIC_KEY = "${FLW_PUBLIC_KEY}";

console.log('FLW_PUBLIC_KEY loaded:', FLW_PUBLIC_KEY ? 'YES' : 'NO');

if (!FLW_PUBLIC_KEY || FLW_PUBLIC_KEY === "undefined" || FLW_PUBLIC_KEY === "") {
document.getElementById("payMsg").textContent = "Payment not configured. Set FLW_PUBLIC_KEY in Render.";
document.getElementById("payMsg").style.color = "red";
}

function payNow() {
const name = document.getElementById("payName").value;
const email = document.getElementById("payEmail").value;
const phone = document.getElementById("payPhone").value;

if (!name || !email || !phone) {
document.getElementById("payMsg").textContent = "Please fill all fields";
document.getElementById("payMsg").style.color = "red";
return;
}

if (!FLW_PUBLIC_KEY || FLW_PUBLIC_KEY === "undefined" || FLW_PUBLIC_KEY === "") {
document.getElementById("payMsg").textContent = "Payment key missing. Set FLW_PUBLIC_KEY in Render.";
document.getElementById("payMsg").style.color = "red";
return;
}

FlutterwaveCheckout({
public_key: FLW_PUBLIC_KEY,
tx_ref: "jobai_" + Date.now(),
amount: 5000,
currency: "UGX",
payment_options: "card,mobilemoneyuganda",
customer: {
email: email,
phone_number: phone,
name: name
},
callback: function(data) {
console.log('Flutterwave callback:', data);
document.getElementById("payMsg").textContent = "Verifying payment...";
fetch("/verify-payment", {
method: "POST",
headers: {"Content-Type": "application/json"},
body: JSON.stringify({transaction_id: data.transaction_id})
}).then(res => res.json()).then(result => {
document.getElementById("payMsg").textContent = result.message;
document.getElementById("payMsg").style.color = result.success ? "green" : "red";
if(result.success) {
document.getElementById("payName").value = "";
document.getElementById("payEmail").value = "";
document.getElementById("payPhone").value = "";
}
}).catch(err => {
console.error(err);
document.getElementById("payMsg").textContent = "Verification failed. Try again.";
document.getElementById("payMsg").style.color = "red";
});
},
onclose: function() {
document.getElementById("payMsg").textContent = "Payment cancelled";
document.getElementById("payMsg").style.color = "orange";
}
});
}

async function loadJobs() {
const query = document.getElementById("searchInput").value || "job";
const days = document.getElementById("dateFilter").value;
try {
const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);
const jobs = await res.json();
document.getElementById("jobs").innerHTML = jobs.length ? jobs.map(j => 
'<div class="job-card"><span class="country-tag">' + j.country + '</span><h3>' + j.title + '</h3><p class="job-meta">' + j.location + ' • ' + j.company + '</p><div class="btn-group"><a href="' + j.url + '" target="_blank" class="connect-btn">Apply</a></div></div>'
).join("") : '<div class="error">No jobs found.</div>';
} catch (e) {
console.error(e);
document.getElementById("jobs").innerHTML = '<div class="error">Failed to load jobs.</div>';
}
}

document.getElementById("searchInput").addEventListener("input", loadJobs);
document.getElementById("dateFilter").addEventListener("change", loadJobs);
loadJobs();
</script>
</body>
</html>
  `);
});

// Jobs API
app.get('/jobs', async (req, res) => {
  try {
    const query = req.query || 'job';
    const recentDays = parseInt(req.query.recent) || 7;

    const countries = [
  { code: 'gb', name: 'UK' },
  { code: 'us', name: 'US' },
  { code: 'in', name: 'India' }
];

    let allJobs = [];
    for (let i = 0; i < countries.length; i++) {
      const url = `https://api.adzuna.com/v1/api/jobs/${countries[i].code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=5&what=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const jobs = (data.results || []).map(j => ({
          title: j.title,
          company: j.company?.display_name,
          location: j.location?.display_name,
          country: countries[i].name,
          url: j.redirect_url,
          date_posted: j.created,
          source: 'Adzuna'
        }));
        allJobs.push(...jobs);
      } else {
        console.error('Adzuna error for', countries[i].name, response.status);
      }
    }

    if (recentDays > 0) {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    res.json(allJobs.slice(0, 20));
  } catch (err) {
    console.error('Jobs API error:', err);
    res.json([]);
  }
});

// Verify payment with Flutterwave
app.post('/verify-payment', async (req, res) => {
  try {
    const { transaction_id } = req.body;
    if (!FLW_SECRET_KEY) {
      return res.json({ success: false, message: 'Server not configured for payments' });
    }

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`
      }
    });
    const data = await response.json();
    console.log('Flutterwave verify response:', data);
    
    if (data.status === 'success' && data.data.status === 'successful') {
      payments.push({
        id: transaction_id,
        amount: data.data.amount,
        currency: data.data.currency,
        email: data.data.customer.email,
        phone: data.data.customer.phone_number,
        name: data.data.customer.name,
        status: 'successful',
        date: new Date().toISOString()
      });
      res.json({ success: true, message: 'Payment successful! Your job will be featured.' });
    } else {
      res.json({ success: false, message: data.message || 'Payment failed or pending' });
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    res.json({ success: false, message: 'Verification error' });
  }
});

// Admin middleware
function checkAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Admin page to view payments
app.get('/admin/payments', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Admin - Payments</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { font-family: Arial, sans-serif; background: #f5f7fa; padding: 20px; }
.container { max-width: 1000px; margin: 0 auto; }
.login { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); max-width: 400px; margin: 100px auto; }
.login input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
.payment-card { background: white; padding: 20px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #e8f5e9; color: #2e7d32; }
.btn { background: #1a73e8; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; margin-top: 10px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 8px 0; border-bottom: 1px solid #eee; }
td:first-child { font-weight: 600; width: 140px; }
.total { font-size: 24px; font-weight: 700; color: #1a73e8; margin-bottom: 20px; }
</style>
</head>
<body>
<div class="container">
<div id="loginDiv" class="login">
<h2>Admin Login</h2>
<input type="password" id="adminPass" placeholder="Enter admin password">
<button class="btn" onclick="login()">Login</button>
<p id="loginMsg" style="color:red;"></p>
</div>
<div id="adminDiv" style="display:none;">
<h1>Payment Records</h1>
<div class="total" id="totalAmount"></div>
<div id="payments"></div>
</div>
</div>
<script>
let adminPass = "";

function login() {
adminPass = document.getElementById("adminPass").value;
fetch("/api/admin/payments", {headers: {"x-admin-password": adminPass}})
.then(res => {
if(!res.ok) throw new Error("Wrong password");
return res.json();
})
.then(data => {
document.getElementById("loginDiv").style.display = "none";
document.getElementById("adminDiv").style.display = "block";
renderPayments(data);
})
.catch(() => {
document.getElementById("loginMsg").textContent = "Wrong password";
});
}

function renderPayments(payments) {
if(!payments.length) {
document.getElementById("payments").innerHTML = "<p>No payments yet.</p>";
document.getElementById("totalAmount").textContent = "Total: 0 UGX";
return;
}

const total = payments.reduce((sum, p) => sum + p.amount, 0);
document.getElementById("totalAmount").textContent = "Total: " + total.toLocaleString() + " UGX";

document.getElementById("payments").innerHTML = payments.map(p =>
'<div class="payment-card">' +
'<table>' +
'<tr><td>Name:</td><td>' + p.name + '</td></tr>' +
'<tr><td>Email:</td><td>' + p.email + '</td></tr>' +
'<tr><td>Phone:</td><td>' + p.phone + '</td></tr>' +
'<tr><td>Amount:</td><td>' + p.amount.toLocaleString() + ' ' + p.currency + '</td></tr>' +
'<tr><td>Transaction ID:</td><td>' + p.id + '</td></tr>' +
'<tr><td>Date:</td><td>' + new Date(p.date).toLocaleString() + '</td></tr>' +
'<tr><td>Status:</td><td><span class="status">' + p.status + '</span></td></tr>' +
'</table>' +
'</div>'
).join("");
}
</script>
</body>
</html>
  `);
});

// API route for admin to get payments
app.get('/api/admin/payments', checkAdmin, (req, res) => {
  res.json(payments.slice().reverse());
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
