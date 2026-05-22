import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';
const JOOBLE_API_KEY = 'YOUR_JOOBLE_KEY';
const FLW_SECRET_KEY = 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create tables if they don't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS ads (
    id BIGINT PRIMARY KEY,
    token TEXT,
    type TEXT,
    status TEXT,
    title TEXT,
    company TEXT,
    location TEXT,
    phone TEXT,
    url TEXT,
    description TEXT,
    business TEXT,
    link TEXT,
    text TEXT,
    image TEXT,
    paymentref TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
  )
`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    reset_token TEXT,
    reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

let pendingPayments = {};
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ====== CLOUDINARY + MULTER SETUP FOR UPLOAD ======
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jobai-ads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ====== UPLOAD ROUTE WITH ERROR HANDLING ======
app.post('/upload-ad-image', (req, res) => {
  upload.single('image')(req, res, function(err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
  });
});

// ====== SERVE FRONTEND ======
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jobai</title>
<style>
body{margin:0;font-family:Arial,sans-serif;background:#f5f5f5}
header{background:#1a73e8;color:white;padding:15px 20px;display:flex;justify-content:space-between;align-items:center}
.menu-btn{font-size:24px;cursor:pointer}
.container{max-width:900px;margin:20px auto;padding:0 15px}
.card{background:white;padding:15px;margin-bottom:15px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1)}
input,textarea,button{width:100%;padding:10px;margin:8px 0;border:1px solid #ddd;border-radius:6px;box-sizing:border-box}
button{background:#1a73e8;color:white;border:none;cursor:pointer}
button:hover{background:#1557b0}
.hidden{display:none}
.sidenav{height:100%;width:0;position:fixed;top:0;left:0;background:#fff;overflow-x:hidden;transition:0.3s;padding-top:60px;box-shadow:2px 0 5px rgba(0,0,0,0.2)}
.sidenav a{padding:12px 30px;display:block;color:#333;text-decoration:none}
.sidenav a:hover{background:#f0f0f0}
.sidenav.closebtn{position:absolute;top:0;right:20px;font-size:36px}
.job-card h4{margin:0 0 5px}
.job-meta{color:#666;font-size:14px}
</style>
</head>
<body>
<div id="sidenav" class="sidenav">
  <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
  <a href="#" onclick="showSection('home')">Home</a>
  <a href="#" onclick="showSection('postJob')">Post Job</a>
  <a href="#" onclick="showSection('postAd')">Post Ad</a>
  <a href="#" onclick="showSection('login')">Login/Signup</a>
</div>

<header>
  <span class="menu-btn" onclick="openNav()">&#9776;</span>
  <h2>Jobai</h2>
  <div id="userInfo"></div>
</header>

<div class="container">
  <div id="home">
    <div class="card">
      <input type="text" id="searchInput" placeholder="Search jobs...">
      <button onclick="loadJobs()">Search</button>
    </div>
    <div id="adsContainer"></div>
    <div id="jobsContainer"></div>
  </div>

  <div id="postJob" class="hidden">
    <div class="card">
      <h3>Post a Job</h3>
      <input id="jobTitle" placeholder="Job Title">
      <input id="jobCompany" placeholder="Company">
      <input id="jobLocation" placeholder="Location">
      <textarea id="jobDesc" placeholder="Description"></textarea>
      <input id="jobPhone" placeholder="Phone">
      <button onclick="submitJob()">Pay & Post Job - 200 KES</button>
    </div>
  </div>

  <div id="postAd" class="hidden">
    <div class="card">
      <h3>Post Sponsored Ad</h3>
      <input id="adBusiness" placeholder="Business Name">
      <input id="adLink" placeholder="Website Link">
      <textarea id="adText" placeholder="Ad Text"></textarea>
      <input type="file" id="adImage" accept="image/*">
      <button onclick="submitAd()">Pay & Post Ad - 500 KES</button>
    </div>
  </div>

  <div id="login" class="hidden">
    <div class="card">
      <h3>Login</h3>
      <input id="loginEmail" type="email" placeholder="Email">
      <input id="loginPassword" type="password" placeholder="Password">
      <button onclick="login()">Login</button>
      <p><a href="#" onclick="showForgot()">Forgot Password?</a></p>
    </div>
    <div class="card">
      <h3>Signup</h3>
      <input id="signupFirst" placeholder="First Name">
      <input id="signupLast" placeholder="Last Name">
      <input id="signupEmail" type="email" placeholder="Email">
      <input id="signupPhone" placeholder="Phone">
      <input id="signupPassword" type="password" placeholder="Password">
      <button onclick="signup()">Signup</button>
    </div>
  </div>
</div>

<script>
function openNav(){document.getElementById("sidenav").style.width="250px"}
function closeNav(){document.getElementById("sidenav").style.width="0"}
function showSection(id){
  document.querySelectorAll('.container > div').forEach(d=>d.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  closeNav();
}

async function loadJobs(){
  const q=document.getElementById('searchInput').value||'';
  const res=await fetch('/jobs?q='+encodeURIComponent(q));
  const jobs=await res.json();
  document.getElementById('jobsContainer').innerHTML=jobs.map(j=>\`
    <div class="card job-card">
      <h4>\${j.title}</h4>
      <div class="job-meta">\${j.company} - \${j.location}</div>
      <a href="\${j.url}" target="_blank">Apply</a>
    </div>
  \`).join('');

  const ads=await fetch('/paid-ads').then(r=>r.json());
  document.getElementById('adsContainer').innerHTML=ads.map(a=>\`
    <div class="card" style="border-left:4px solid #fbbc04">
      <h4>\${a.business}</h4>
      <p>\${a.text}</p>
      \${a.image?'<img src="'+a.image+'" style="max-width:100%">':''}
      <a href="\${a.link}" target="_blank">Visit</a>
    </div>
  \`).join('');
}

async function signup(){
  const body={
    firstName:document.getElementById('signupFirst').value,
    lastName:document.getElementById('signupLast').value,
    email:document.getElementById('signupEmail').value,
    phone:document.getElementById('signupPhone').value,
    password:document.getElementById('signupPassword').value
  };
  const res=await fetch('/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json();
  alert(data.success?'Signup successful':'Error: '+data.error);
}

async function login(){
  const body={
    email:document.getElementById('loginEmail').value,
    password:document.getElementById('loginPassword').value
  };
  const res=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json();
  if(data.success){
    localStorage.setItem('user',JSON.stringify(data.user));
    document.getElementById('userInfo').innerText=data.user.first_name;
    showSection('home');
  }else alert('Error: '+data.error);
}

async function submitJob(){
  const body={
    title:document.getElementById('jobTitle').value,
    company:document.getElementById('jobCompany').value,
    location:document.getElementById('jobLocation').value,
    description:document.getElementById('jobDesc').value,
    phone:document.getElementById('jobPhone').value
  };
  const res=await fetch('/ads/initiate-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json();
  if(data.payment_link)window.location=data.payment_link;
}

async function submitAd(){
  const file=document.getElementById('adImage').files[0];
  let imageUrl='';
  if(file){
    const form=new FormData();
    form.append('image',file);
    const up=await fetch('/upload-ad-image',{method:'POST',body:form});
    const upData=await up.json();
    imageUrl=upData.url;
  }
  const body={
    business:document.getElementById('adBusiness').value,
    link:document.getElementById('adLink').value,
    text:document.getElementById('adText').value,
    image:imageUrl
  };
  const res=await fetch('/paid-ads/initiate-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json();
  if(data.payment_link)window.location=data.payment_link;
}

loadJobs();
</script>
</body>
</html>`);
});

// ========== AUTH ROUTES ==========
app.post('/auth/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName ||!lastName ||!email ||!password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email, phone, hash]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ success: false, error: 'Email already exists' });
    } else {
      console.error(err);
      res.status(500).json({ success: false, error: 'Signup failed' });
    }
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email ||!password) {
    return res.status(400).json({ success: false, error: 'Missing email or password' });
  }
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }
    res.json({ success: true, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.json({ success: true });
});

// ========== FORGOT PASSWORD ==========
app.post('/auth/forgot', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query(`SELECT id FROM users WHERE email=$1`, [email]);
    if(result.rows.length===0){
      return res.json({success:false,message:'Email not found'});
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await pool.query(`UPDATE users SET reset_token=$1, reset_expires=$2 WHERE email=$3`,
      [token, expires, email]);

    const resetLink = `${req.protocol}://${req.get('host')}/reset/${token}`;
    console.log('RESET LINK:', resetLink);

    res.json({success:true,message:'Reset link generated. Check Render Logs for the link.'});
  } catch(err){
    console.error(err);
    res.json({success:false,message:'Error occurred'});
  }
});

app.get('/reset/:token', async (req, res) => {
  const { token } = req.params;
  const result = await pool.query(`SELECT id FROM users WHERE reset_token=$1 AND reset_expires>NOW()`, [token]);

  if(result.rows.length===0){
    return res.send('<h3 style="font-family:Arial;text-align:center;padding:40px;">Link expired or invalid</h3>');
  }

  res.send(`
    <html>
    <body style="font-family:Arial;padding:40px;text-align:center;">
      <h2>Reset Password</h2>
      <form method="POST" action="/auth/reset">
        <input type="hidden" name="token" value="${token}">
        <input type="password" name="password" placeholder="New password" required style="padding:10px;width:250px;margin:10px;border:1px solid #ddd;border-radius:8px;">
        <br>
        <button type="submit" style="padding:10px 20px;background:#1a73e8;color:white;border:none;border-radius:8px;cursor:pointer;">Reset Password</button>
      </form>
    </body>
    </html>
  `);
});

app.post('/auth/reset', async (req, res) => {
  const { token, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  await pool.query(`UPDATE users SET password_hash=$1, reset_token=NULL, reset_expires=NULL
    WHERE reset_token=$2 AND reset_expires>NOW()`, [hash, token]);

  res.send('<h3 style="font-family:Arial;text-align:center;padding:40px;">Password reset successful. You can now login.</h3>');
});

// Fetch jobs from Adzuna
async function fetchAdzunaJobs(countryCode, countryName, query) {
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&content-type=application/json&max_days_old=7&what=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company?.display_name || 'Unknown Company',
      location: j.location?.display_name || countryName,
      country: countryName,
      url: j.redirect_url || '#',
      date_posted: j.created,
      source: 'Adzuna'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchJSearchJobs(query, location) {
  try {
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&num_pages=1&date_posted=week`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.data || []).map(j => ({
      title: j.job_title || 'Job Title',
      company: j.employer_name || 'Unknown Company',
      location: j.job_city || location,
      country: location,
      url: j.job_apply_link || '#',
      date_posted: j.job_posted_at_datetime_utc,
      source: j.job_publisher || 'JSearch'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchJoobleJobs(query, location) {
  try {
    const response = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: query,
        location: location,
        page: 1,
        resultsOnPage: 20
      })
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title,
      company: j.company,
      location: j.location,
      country: location,
      url: j.link,
      date_posted: j.updated,
      source: 'Jooble'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchRemotiveJobs(query) {
  try {
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title,
      company: j.company_name,
      location: 'Remote',
      country: 'Global',
      url: j.url,
      date_posted: j.date,
      source: 'Remotive'
    }));
  } catch (err) {
    return [];
  }
}

app.get('/jobs', async (req, res) => {
  try {
    const query = req.query.q || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant';
    const recentDays = parseInt(req.query.recent) || 7;

    const countries = [
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'ae', name: 'United Arab Emirates' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'in', name: 'India' },
      { code: 'ug', name: 'Uganda' },
      { code: 'ke', name: 'Kenya' },
      { code: 'tz', name: 'Tanzania' },
      { code: 'za', name: 'South Africa' },
      { code: 'au', name: 'Australia' },
      { code: 'us', name: 'United States' },
      { code: 'rw', name: 'Rwanda' },
      { code: 'bi', name: 'Burundi' }
    ];

    let allJobs = [];
    const promises = [];
    for (let i = 0; i < countries.length; i++) {
      promises.push(fetchAdzunaJobs(countries[i].code, countries[i].name, query));
      promises.push(fetchJSearchJobs(query, countries[i].name));
      promises.push(fetchJoobleJobs(query, countries[i].name));
    }
    promises.push(fetchRemotiveJobs(query));

    const results = await Promise.all(promises);
    results.forEach(jobs => {
      allJobs.push(...jobs);
    });

    allJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url)
    );

    if (recentDays > 0 && recentDays!== 'all') {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    allJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
    res.json(allJobs.slice(0, 100));
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.json([]);
  }
});

app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'job' AND status = 'approved' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/paid-ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'ad' AND status = 'approved' AND expires_at > NOW() ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'jobai_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { title, company, location, phone, url, description, type: 'job', token };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount: 200,
        currency: 'KES',
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: {
          email: 'customer@jobai.com',
          phonenumber: phone || '0700000',
          name: company
        },
        customizations: {
          title: 'Job Post Payment',
          description: 'Pay 200 KES to post job on Jobai'
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
    console.error(err);
    res.status(500).json({ error: 'Payment error' });
  }
});

app.post('/paid-ads/initiate-payment', async (req, res) => {
  const { business, link, text, image } = req.body;
  if (!business ||!link ||!text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'ad_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { business, link, text, image, type: 'ad', token };

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
    console.error(err);
    res.status(500).json({ error: 'Payment error' });
  }
});

app.get('/payment-callback', async (req, res) => {
  const { transaction_id, tx_ref } = req.query;

  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}` }
    });
    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'successful') {
      const jobData = pendingPayments[tx_ref];
      if (jobData) {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const expires = new Date();
        expires.setDate(expires.getDate() + AD_DURATION_DAYS);

        if (jobData.type === 'ad') {
          await pool.query(
            `INSERT INTO ads (id, token, type, status, business, link, text, image, paymentref, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, jobData.token, 'ad', 'approved', jobData.business, jobData.link, jobData.text, jobData.image, transaction_id, expires]
          );
        } else {
          await pool.query(
            `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
            [id, jobData.token, 'job', 'approved', jobData.title, jobData.company, jobData.location, jobData.phone, jobData.url, jobData.description, transaction_id]
          );
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
    console.error(err);
    res.redirect('/?payment=failed');
  }
});

app.post('/ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET title = COALESCE($1, title), location = COALESCE($2, location),
       company = COALESCE($3, company), description = COALESCE($4, description)
       WHERE id = $5 AND token = $6 AND type = 'job' RETURNING id`,
      [title, location, company, description, id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/ads/delete', async (req, res) => {
  const { id, token } = req.body;
  try {
    const result = await pool.query(
      `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'job' RETURNING id`,
      [id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/paid-ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET business = COALESCE($1, business), text = COALESCE($2, text),
       location = COALESCE($3, location), company = COALESCE($4, company)
       WHERE id = $5 AND token = $6 AND type = 'ad' RETURNING id`,
      [title, description, location, company, id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/paid-ads/delete', async (req, res) => {
  const { id, token } = req.body;
  try {
    const result = await pool.query(
      `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'ad' RETURNING id`,
      [id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
