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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create tables
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ========== FRONTEND ==========
app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    ' <meta charset="UTF-8">' +
    ' <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    ' <title>Jobai - Get Connected to Jobs & Workers</title>' +
    ' <style>' +
    ' body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }' +
    '.hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 40px 20px 30px; text-align: center; }' +
    '.hero h1 { font-size: 32px; margin: 0 0 8px 0; font-weight: 700; }' +
    '.hero p { font-size: 16px; opacity: 0.95; margin: 0; }' +
    '.container { max-width: 1000px; margin: 20px auto; padding: 0 16px; }' +
    '.controls { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }' +
    '.controls input,.controls select { padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; background: white; }' +
    '.controls input { flex: 1; min-width: 200px; }' +
    '.section { margin-bottom: 32px; }' +
    '.section h2 { margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a; }' +
    '.job-card { background: white; padding: 20px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }' +
    '.job-card h3 { margin: 8px 0 8px 0; color: #1a73e8; font-size: 18px; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; border: none; cursor: pointer; }' +
    '.loading { text-align: center; color: #666; padding: 30px; font-size: 16px; }' +
    '.ad-form { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.auth-form input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }' +
    '.auth-toggle { text-align:center;margin-top:10px;font-size:13px;color:#666;cursor:pointer; }' +
    '.logout-btn { display:none; width:100%; margin-top:10px; background:#d32f2f; }' +
    ' </style>' +
    '</head>' +
    '<body>' +
    '<button id="menuBtn" aria-label="Open menu" style="position:fixed;top:14px;left:14px;z-index:1001;background:#fff;border:0;border-radius:8px;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;font-size:18px;">☰</button>' +
    '<div id="overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;" onclick="closeMenu()"></div>' +
    '<nav id="sideMenu" aria-hidden="true" style="position:fixed;top:0;left:-320px;width:300px;max-width:85%;height:100%;background:#fff;z-index:1002;transition:left 0.28s ease;box-shadow:2px 0 16px rgba(0,0,0,.12);overflow-y:auto;">' +
    ' <div style="padding:20px;border-bottom:1px solid #eee;">' +
    ' <h2 style="margin:0;color:#1a73e8;font-size:22px;">Jobai</h2>' +
    ' <p style="margin:6px 0 0;font-size:13px;color:#666;">Get Connected to Jobs & Workers</p>' +
    ' </div>' +
    ' <div id="authSection" style="padding:16px;border-bottom:1px solid #eee;">' +
    ' <h3 id="authTitle" style="margin:0 0 12px 0;font-size:16px;">Sign Up</h3>' +
    ' <div id="signupForm" class="auth-form">' +
    ' <input type="text" id="firstName" placeholder="First Name" required>' +
    ' <input type="text" id="lastName" placeholder="Last Name" required>' +
    ' <input type="email" id="signupEmail" placeholder="Email" required>' +
    ' <input type="tel" id="signupPhone" placeholder="Phone Number">' +
    ' <input type="password" id="signupPassword" placeholder="Password" required>' +
    ' <input type="password" id="confirmPassword" placeholder="Confirm Password" required>' +
    ' <button class="connect-btn" style="width:100%;" onclick="signup()">Create Account</button>' +
    ' <p id="signupMsg" style="font-size:12px;margin-top:8px;"></p>' +
    ' </div>' +
    ' <div id="loginForm" class="auth-form" style="display:none;">' +
    ' <input type="email" id="loginEmail" placeholder="Email" required>' +
    ' <input type="password" id="loginPassword" placeholder="Password" required>' +
    ' <div style="text-align:right;margin-bottom:10px;">' +
    ' <span style="font-size:13px;color:#1a73e8;cursor:pointer;" onclick="showForgot()">Forgot password?</span>' +
    ' </div>' +
    ' <button class="connect-btn" style="width:100%;" onclick="login()">Login</button>' +
    ' <p id="loginMsg" style="font-size:12px;margin-top:8px;"></p>' +
    ' </div>' +
    ' <div id="forgotForm" class="auth-form" style="display:none;">' +
    ' <input type="email" id="forgotEmail" placeholder="Enter your email" required>' +
    ' <button class="connect-btn" style="width:100%;" onclick="sendReset()">Send Reset Link</button>' +
    ' <p id="forgotMsg" style="font-size:12px;margin-top:8px;"></p>' +
    ' <div class="auth-toggle" onclick="toggleAuth()">Back to Login</div>' +
    ' </div>' +
    ' <div class="auth-toggle" onclick="toggleAuth()">Already have an account? <b>Login</b></div>' +
    ' <button id="logoutBtn" class="connect-btn logout-btn" onclick="logout()">Logout</button>' +
    ' <p id="userInfo" style="font-size:13px;margin-top:8px;color:#1a73e8;"></p>' +
    ' </div>' +
    '</nav>' +
    ' <div class="hero">' +
    ' <h1>Get Connected to Jobs & Workers</h1>' +
    ' <p>AI-powered matching for Uganda, Kenya, Tanzania, Rwanda, Burundi, India, UAE, Saudi Arabia, France, UK, Canada, China, Taiwan, Thailand</p>' +
    ' </div>' +
    ' <div class="container">' +
    ' <div class="controls">' +
    ' <input type="text" id="searchInput" placeholder="Search: cleaner, nurse, teacher, engineer, farmer..." />' +
    ' <select id="dateFilter">' +
    ' <option value="7">Last 7 days</option>' +
    ' <option value="all">All time</option>' +
    ' <option value="3">Last 3 days</option>' +
    ' <option value="1">Last 24 hours</option>' +
    ' </select>' +
    ' <button class="connect-btn" id="searchBtn">Search</button>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Trending Jobs</h2>' +
    ' <div id="jobs" class="loading">Loading jobs...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Post a Job</h2>' +
    ' <div class="ad-form" id="adForm">' +
    ' <h3>Advertise your job for 200 KES</h3>' +
    ' <input type="text" id="adTitle" placeholder="Job title" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location" required>' +
    ' <input type="tel" id="adPhone" placeholder="Phone number for applicants">' +
    ' <input type="url" id="adUrl" placeholder="Apply link (optional)">' +
    ' <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>' +
    ' <button class="connect-btn" onclick="submitAd()">Pay 200 KES & Post Job</button>' +
    ' <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' </div>' +
    ' </div>' +
    ' <script>' +
    'function openMenu(){document.getElementById(\'sideMenu\').style.left=\'0\';document.getElementById(\'overlay\').style.display=\'block\';}' +
    'function closeMenu(){document.getElementById(\'sideMenu\').style.left=\'-320px\';document.getElementById(\'overlay\').style.display=\'none\';}' +
    'function toggleAuth(){const s=document.getElementById(\'signupForm\'),l=document.getElementById(\'loginForm\'),f=document.getElementById(\'forgotForm\'),t=document.getElementById(\'authTitle\');s.style.display=\'block\';l.style.display=\'none\';f.style.display=\'none\';t.textContent=\'Sign Up\';}' +
    'function showForgot(){document.getElementById(\'loginForm\').style.display=\'none\';document.getElementById(\'forgotForm\').style.display=\'block\';document.getElementById(\'authTitle\').textContent=\'Reset Password\';}' +
    'async function signup(){const first=document.getElementById(\'firstName\').value.trim(),last=document.getElementById(\'lastName\').value.trim(),email=document.getElementById(\'signupEmail\').value.trim(),phone=document.getElementById(\'signupPhone\').value.trim(),pass=document.getElementById(\'signupPassword\').value,cpass=document.getElementById(\'confirmPassword\').value;const msg=document.getElementById(\'signupMsg\');if(!first||!last||!email||!pass){msg.textContent=\'Fill all required fields\';msg.style.color=\'red\';return;}if(pass!==cpass){msg.textContent=\'Passwords do not match\';msg.style.color=\'red\';return;}msg.textContent=\'Creating account...\';msg.style.color=\'blue\';const res=await fetch(\'/auth/signup\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({firstName:first,lastName:last,email,phone,password:pass})});const data=await res.json();if(data.success){msg.textContent=\'Account created! You can login now.\';msg.style.color=\'green\';toggleAuth();}else{msg.textContent=data.error||\'Signup failed\';msg.style.color=\'red\';}}' +
    'async function login(){const email=document.getElementById(\'loginEmail\').value.trim(),pass=document.getElementById(\'loginPassword\').value;const msg=document.getElementById(\'loginMsg\');if(!email||!pass){msg.textContent=\'Enter email and password\';msg.style.color=\'red\';return;}msg.textContent=\'Logging in...\';msg.style.color=\'blue\';const res=await fetch(\'/auth/login\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({email,password:pass})});const data=await res.json();if(data.success){msg.textContent=\'Login successful!\';msg.style.color=\'green\';localStorage.setItem(\'jobai_user\',JSON.stringify(data.user));updateAuthUI(data.user);closeMenu();}else{msg.textContent=data.error||\'Login failed\';msg.style.color=\'red\';}}' +
    'async function sendReset(){const email=document.getElementById(\'forgotEmail\').value.trim();const msg=document.getElementById(\'forgotMsg\');if(!email){msg.textContent=\'Enter email\';msg.style.color=\'red\';return;}msg.textContent=\'Sending...\';msg.style.color=\'blue\';const res=await fetch(\'/auth/forgot\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({email})});const data=await res.json();msg.textContent=data.message;msg.style.color=data.success?\'green\':\'red\';}' +
    'async function logout(){await fetch(\'/auth/logout\',{method:\'POST\'});localStorage.removeItem(\'jobai_user\');updateAuthUI(null);}' +
    'function updateAuthUI(user){const logout=document.getElementById(\'logoutBtn\');const info=document.getElementById(\'userInfo\');if(user){document.getElementById(\'signupForm\').style.display=\'none\';document.getElementById(\'loginForm\').style.display=\'none\';document.getElementById(\'forgotForm\').style.display=\'none\';document.getElementById(\'authTitle\').textContent=\'Account\';logout.style.display=\'block\';info.textContent=\'Logged in as \'+user.first_name+\' \'+user.last_name;}else{document.getElementById(\'signupForm\').style.display=\'block\';document.getElementById(\'loginForm\').style.display=\'none\';document.getElementById(\'forgotForm\').style.display=\'none\';document.getElementById(\'authTitle\').textContent=\'Sign Up\';logout.style.display=\'none\';info.textContent=\'\';}}' +
    'window.addEventListener(\'load\',()=>{const user=JSON.parse(localStorage.getItem(\'jobai_user\')||\'null\');updateAuthUI(user);});' +
    'document.getElementById(\'menuBtn\').addEventListener(\'click\',openMenu);' +
    'document.getElementById(\'searchBtn\').addEventListener(\'click\', function(){document.getElementById("jobs").innerHTML="<div class=\\"loading\\">Loading jobs...</div>";});' +
    'document.getElementById("jobs").innerHTML="<div class=\\"loading\\">Jobs loading...</div>";' +
    ' </script>' +
    '</body>' +
    '</html>'
  );
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
    const expires = new Date(Date.now() + 3600000); // 1 hour

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
    return res.send('<h3>Link expired or invalid</h3>');
  }

  res.send(`
    <html>
    <body style="font-family:Arial;padding:40px;text-align:center;">
      <h2>Reset Password</h2>
      <form method="POST" action="/auth/reset">
        <input type="hidden" name="token" value="${token}">
        <input type="password" name="password" placeholder="New password" required style="padding:10px;width:250px;margin:10px;">
        <br>
        <button type="submit" style="padding:10px 20px;background:#1a73e8;color:white;border:none;border-radius:8px;">Reset Password</button>
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

  res.send('<h3>Password reset successful. You can now login.</h3>');
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
