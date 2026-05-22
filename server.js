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

// users table for auth
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
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

let pendingPayments = {};
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    ' <meta charset="UTF-8">' +
    ' <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    ' <title>Jobai - Get Connected to Jobs & Workers</title>' +
    ' <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-1637256996790764" crossorigin="anonymous"></script>' +
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
    '.job-card { background: white; padding: 20px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative; transition: transform 0.2s, box-shadow 0.2s; display: block; text-decoration: none; color: inherit; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card h3 { margin: 8px 0 8px 0; color: #1a73e8; font-size: 18px; line-height: 1.4; }' +
    '.job-meta { margin: 0 0 14px 0; color: #666; font-size: 14px; line-height: 1.5; }' +
    '.job-meta span { margin-right: 8px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.btn-group { display: flex; gap: 10px; flex-wrap: wrap; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.call-btn { background: #34a853; }' +
    '.call-btn:hover { background: #2d9147; }' +
    '.delete-btn { background: #d32f2f; }' +
    '.delete-btn:hover { background: #b71c1c; }' +
    '.edit-btn { background: #ff9800; }' +
    '.edit-btn:hover { background: #f57c00; }' +
    '.loading { text-align: center; color: #666; padding: 30px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 30px; }' +
    '.ad-form { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; font-size: 18px; }' +
    '.phone-display { color: #34a853; font-weight: 600; }' +
    '.ad-unit { margin: 0; padding: 0; min-height: 0; }' +
    '.ad-unit ins.adsbygoogle[data-ad-status="unfilled"] { display: none!important; }' +
    '.img-preview { max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 10px; display: none; }' +
    '.card-actions { position: absolute; top: 12px; right: 12px; display: flex; gap: 8px; }' +
    '.icon-btn { width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; }' +
    '.modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }' +
    '.modal.active { display: flex; }' +
    '.modal-content { background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%; }' +
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
    ' <button class="connect-btn" style="width:100%;" onclick="login()">Login</button>' +
    ' <p id="loginMsg" style="font-size:12px;margin-top:8px;"></p>' +
    ' </div>' +
    ' <div class="auth-toggle" onclick="toggleAuth()">Already have an account? <b>Login</b></div>' +
    ' <button id="logoutBtn" class="connect-btn logout-btn" onclick="logout()">Logout</button>' +
    ' <p id="userInfo" style="font-size:13px;margin-top:8px;color:#1a73e8;"></p>' +
    ' </div>' +
    ' <div style="padding:8px 0;">' +
    ' <a href="#" onclick="closeMenu();document.getElementById(\'searchInput\')?.focus();" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">🔍 <span>Job Search</span></a>' +
    ' <a href="#" onclick="showFavorites()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">❤️ <span>Favorites</span></a>' +
    ' <a href="#" onclick="scrollToId(\'adForm\')" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">📄 <span>Post a Job</span> <span style="background:#ff9800;color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:auto;">New</span></a>' +
    ' <a href="#" onclick="showSalaries()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">📊 <span>Salaries</span></a>' +
    ' <a href="#" onclick="showSubscriptions()" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">✉️ <span>Job Alerts</span></a>' +
    ' <a href="#" onclick="scrollToId(\'paidAds\')" style="display:flex;align-items:center;gap:12px;padding:14px 18px;text-decoration:none;color:#222;font-size:15px;">💼 <span>Sponsored Ads</span></a>' +
    ' </div>' +
    ' <div style="padding:16px 18px;border-top:1px solid #eee;font-size:13px;color:#666;">Never miss new jobs on Jobai</div>' +
    '</nav>' +
    ' <div class="hero">' +
    ' <h1>Get Connected to Jobs & Workers</h1>' +
    ' <p>AI-powered matching for Uganda, Kenya, Tanzania, Rwanda, Burundi, India, UAE, Saudi Arabia, France, UK, Canada, China, Taiwan, Thailand</p>' +
    ' </div>' +
    ' <div class="ad-unit">' +
    ' <ins class="adsbygoogle" style="display:block" data-ad-client="ca-app-pub-1637256996790764" data-ad-slot="5321979598" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
    ' <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>' +
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
    ' <div class="ad-unit">' +
    ' <ins class="adsbygoogle" style="display:block" data-ad-client="ca-app-pub-1637256996790764" data-ad-slot="5321979598" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
    ' <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>' +
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
    ' <h2>Community Job Posts</h2>' +
    ' <div id="userAds" class="loading">Loading...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Sponsored Ads</h2>' +
    ' <div class="ad-form">' +
    ' <h3>Advertise here for ' + AD_PRICE + ' KES for 7 days</h3>' +
    ' <input type="text" id="adBizName" placeholder="Business name" required>' +
    ' <input type="url" id="adLink" placeholder="Website or WhatsApp link" required>' +
    ' <input type="text" id="adText" placeholder="Short ad text" required>' +
    ' <input type="file" id="adImgFile" accept="image/*" capture="environment">' +
    ' <img id="imgPreview" class="img-preview" />' +
    ' <input type="hidden" id="adImgUrl">' +
    ' <button class="connect-btn" style="background:#f57c00;" onclick="submitPaidAd()">Pay ' + AD_PRICE + ' KES & Run Ad</button>' +
    ' <p id="adPayMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <div id="paidAds" class="loading">Loading ads...</div>' +
    ' </div>' +
    ' </div>' +
    ' <div id="editModal" class="modal">' +
    ' <div class="modal-content">' +
    ' <h3>Edit Ad</h3>' +
    ' <input type="hidden" id="editId">' +
    ' <input type="hidden" id="editToken">' +
    ' <input type="hidden" id="editType">' +
    ' <input type="text" id="editTitle" placeholder="Title/Business">' +
    ' <input type="text" id="editLocation" placeholder="Location">' +
    ' <input type="text" id="editCompany" placeholder="Company">' +
    ' <textarea id="editDesc" placeholder="Description" rows="3"></textarea>' +
    ' <div class="btn-group" style="margin-top:16px;">' +
    ' <button class="connect-btn" onclick="saveEdit()">Save</button>' +
    ' <button class="connect-btn" style="background:#666;" onclick="closeEdit()">Cancel</button>' +
    ' </div>' +
    ' </div>' +
    ' </div>' +
    ' <script>' +
    'function openMenu(){document.getElementById(\'sideMenu\').style.left=\'0\';document.getElementById(\'overlay\').style.display=\'block\';document.getElementById(\'sideMenu\').setAttribute(\'aria-hidden\',\'false\');}' +
    'function closeMenu(){document.getElementById(\'sideMenu\').style.left=\'-320px\';document.getElementById(\'overlay\').style.display=\'none\';document.getElementById(\'sideMenu\').setAttribute(\'aria-hidden\',\'true\');}' +
    'function scrollToId(id){closeMenu();const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:\'smooth\',block:\'start\'});}' +
    'function showFavorites(){closeMenu();const fav=JSON.parse(localStorage.getItem(\'jobai_fav\')||\'[]\');if(!fav.length){alert(\'No favorites yet. Click "Connect & Apply" then save the job link.\');return;}renderJobs(fav);document.querySelector(\'.section h2\').textContent=\'Favorites\';}' +
    'function showSalaries(){closeMenu();alert(\'Salaries coming next. We will wire this to Adzuna Salary API.\');}' +
    'function showSubscriptions(){closeMenu();alert(\'Job Alerts coming next. Enter email + keywords and get notified.\');}' +
    'function toggleAuth(){const s=document.getElementById(\'signupForm\'),l=document.getElementById(\'loginForm\'),t=document.getElementById(\'authTitle\');if(s.style.display===\'none\'){s.style.display=\'block\';l.style.display=\'none\';t.textContent=\'Sign Up\';}else{s.style.display=\'none\';l.style.display=\'block\';t.textContent=\'Login\';}}' +
    'async function signup(){const first=document.getElementById(\'firstName\').value.trim(),last=document.getElementById(\'lastName\').value.trim(),email=document.getElementById(\'signupEmail\').value.trim(),phone=document.getElementById(\'signupPhone\').value.trim(),pass=document.getElementById(\'signupPassword\').value,cpass=document.getElementById(\'confirmPassword\').value;const msg=document.getElementById(\'signupMsg\');if(!first||!last||!email||!pass){msg.textContent=\'Fill all required fields\';msg.style.color=\'red\';return;}if(pass!==cpass){msg.textContent=\'Passwords do not match\';msg.style.color=\'red\';return;}msg.textContent=\'Creating account...\';msg.style.color=\'blue\';const res=await fetch(\'/auth/signup\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({firstName:first,lastName:last,email,phone,password:pass})});const data=await res.json();if(data.success){msg.textContent=\'Account created! You can login now.\';msg.style.color=\'green\';toggleAuth();}else{msg.textContent=data.error||\'Signup failed\';msg.style.color=\'red\';}}' +
    'async function login(){const email=document.getElementById(\'loginEmail\').value.trim(),pass=document.getElementById(\'loginPassword\').value;const msg=document.getElementById(\'loginMsg\');if(!email||!pass){msg.textContent=\'Enter email and password\';msg.style.color=\'red\';return;}msg.textContent=\'Logging in...\';msg.style.color=\'blue\';const res=await fetch(\'/auth/login\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({email,password:pass})});const data=await res.json();if(data.success){msg.textContent=\'Login successful!\';msg.style.color=\'green\';localStorage.setItem(\'jobai_user\',JSON.stringify(data.user));updateAuthUI(data.user);closeMenu();}else{msg.textContent=data.error||\'Login failed\';msg.style.color=\'red\';}}' +
    'async function logout(){await fetch(\'/auth/logout\',{method:\'POST\'});localStorage.removeItem(\'jobai_user\');updateAuthUI(null);}' +
    'function updateAuthUI(user){const logout=document.getElementById(\'logoutBtn\');const info=document.getElementById(\'userInfo\');if(user){document.getElementById(\'signupForm\').style.display=\'none\';document.getElementById(\'loginForm\').style.display=\'none\';document.getElementById(\'authTitle\').textContent=\'Account\';logout.style.display=\'block\';info.textContent=\'Logged in as \'+user.first_name+\' \'+user.last_name;}else{document.getElementById(\'signupForm\').style.display=\'block\';document.getElementById(\'loginForm\').style.display=\'none\';document.getElementById(\'authTitle\').textContent=\'Sign Up\';logout.style.display=\'none\';info.textContent=\'\';}}' +
    'window.addEventListener(\'load\',()=>{const user=JSON.parse(localStorage.getItem(\'jobai_user\')||\'null\');updateAuthUI(user);});' +
    'document.getElementById(\'menuBtn\').addEventListener(\'click\',openMenu);' +
    ' let allJobs = [];' +
    ' document.getElementById("adImgFile").addEventListener("change", async function(e) {' +
    ' const file = e.target.files[0];' +
    ' if (!file) return;' +
    ' const formData = new FormData();' +
    ' formData.append("image", file);' +
    ' document.getElementById("adPayMsg").textContent = "Uploading image...";' +
    ' document.getElementById("adPayMsg").style.color = "blue";' +
    ' try {' +
    ' const res = await fetch("/upload-ad-image", { method: "POST", body: formData });' +
    ' const data = await res.json();' +
    ' if (data.url) {' +
    ' document.getElementById("adImgUrl").value = data.url;' +
    ' document.getElementById("imgPreview").src = data.url;' +
    ' document.getElementById("imgPreview").style.display = "block";' +
    ' document.getElementById("adPayMsg").textContent = "Image uploaded!";' +
    ' document.getElementById("adPayMsg").style.color = "green";' +
    ' } else {' +
    ' document.getElementById("adPayMsg").textContent = "Upload failed";' +
    ' document.getElementById("adPayMsg").style.color = "red";' +
    ' }' +
    ' } catch (err) {' +
    ' document.getElementById("adPayMsg").textContent = "Upload error";' +
    ' document.getElementById("adPayMsg").style.color = "red";' +
    ' }' +
    ' });' +
    ' function timeAgo(dateStr) {' +
    ' if (!dateStr) return "";' +
    ' const date = new Date(dateStr);' +
    ' const now = new Date();' +
    ' const diffMs = now - date;' +
    ' const diffSec = Math.floor(diffMs / 1000);' +
    ' const diffMin = Math.floor(diffSec / 60);' +
    ' const diffHr = Math.floor(diffMin / 60);' +
    ' const diffDay = Math.floor(diffHr / 24);' +
    ' if (diffSec < 60) return "just now";' +
    ' if (diffMin < 60) return diffMin + "m ago";' +
    ' if (diffHr < 24) return diffHr + "h ago";' +
    ' if (diffDay === 1) return "1d ago";' +
    ' return diffDay + "d ago";' +
    ' }' +
    ' function renderJobs(jobs) {' +
    ' if (!jobs.length) {' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"error\\">No jobs found.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("jobs").innerHTML = jobs.map(function(j) {' +
    ' return "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"job-card\\"><span class=\\"country-tag\\">" + j.country + "</span><span class=\\"source-tag\\">" + j.source + "</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span><span>•</span><span>" + timeAgo(j.date_posted) + "</span></p><span class=\\"connect-btn\\">Connect & Apply</span></a>";' +
    ' }).join("");' +
    ' }' +
    ' function renderUserAds(ads) {' +
    ' if (!ads.length) {' +
    ' document.getElementById("userAds").innerHTML = "<div class=\\"error\\">No community posts yet.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("userAds").innerHTML = ads.map(function(j) {' +
    ' let buttons = "<div class=\\"btn-group\\">";' +
    ' if (j.url && j.url!== "#") {' +
    ' buttons += "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"connect-btn\\">Apply Now</a>";' +
    ' }' +
    ' if (j.phone) {' +
    ' buttons += "<a href=\\"tel:" + j.phone + "\\" class=\\"connect-btn call-btn\\">Call " + j.phone + "</a>";' +
    ' }' +
    ' buttons += "</div>";' +
    ' let actions = "<div class=\\"card-actions\\">";' +
    ' actions += "<button class=\\"icon-btn edit-btn\\" onclick=\\"openEdit(\'user\',\'" + j.id + "\',\'" + j.token + "\')\\">✏️</button>";' +
    ' actions += "<button class=\\"icon-btn delete-btn\\" onclick=\\"deleteAd(\'user\',\'" + j.id + "\',\'" + j.token + "\')\\">🗑️</button>";' +
    ' actions += "</div>";' +
    ' return "<div class=\\"job-card\\" style=\\"position:relative\\">"+actions+"<span class=\\"country-tag user-ad-tag\\">Community</span><span class=\\"source-tag\\">"+ timeAgo(j.created_at) +"</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "Phone: " + j.phone : "") + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' function renderPaidAds(ads) {' +
    ' if (!ads.length) {' +
    ' document.getElementById("paidAds").innerHTML = "<div class=\\"error\\">No sponsors yet.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("paidAds").innerHTML = ads.map(function(ad) {' +
    ' let img = ad.image? \'<img src="\' + ad.image + \'" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:10px;">\' : \'\';' +
    ' let actions = "<div class=\\"card-actions\\">";' +
    ' actions += "<button class=\\"icon-btn edit-btn\\" onclick=\\"openEdit(\'paid\',\'" + ad.id + "\',\'" + ad.token + "\')\\">✏️</button>";' +
    ' actions += "<button class=\\"icon-btn delete-btn\\" onclick=\\"deleteAd(\'paid\',\'" + ad.id + "\',\'" + ad.token + "\')\\">🗑️</button>";' +
    ' actions += "</div>";' +
    ' return \'<div class="job-card" style="border:2px solid #f57c00;position:relative;">\' +' +
    ' actions +' +
    ' \'<span class="country-tag user-ad-tag">Sponsored</span>\' +' +
    ' \'<span class="source-tag">\' + timeAgo(ad.created_at) + \'</span>\' +' +
    ' img +' +
    ' \'<h3>\' + ad.business + \'</h3>\' +' +
    ' \'<p class="job-meta">\' + ad.text + \'</p>\' +' +
    ' \'<a href="\' + ad.link + \'" target="_blank" class="connect-btn" style="background:#f57c00;">Visit</a>\' +' +
    ' \'</div>\';' +
    ' }).join("");' +
    ' }' +
    ' function openEdit(type, id, token) {' +
    ' document.getElementById("editType").value = type;' +
    ' document.getElementById("editId").value = id;' +
    ' document.getElementById("editToken").value = token;' +
    ' document.getElementById("editModal").classList.add("active");' +
    ' }' +
    ' function closeEdit() {' +
    ' document.getElementById("editModal").classList.remove("active");' +
    ' }' +
    ' async function saveEdit() {' +
    ' const type = document.getElementById("editType").value;' +
    ' const id = document.getElementById("editId").value;' +
    ' const token = document.getElementById("editToken").value;' +
    ' const data = {' +
    ' id, token,' +
    ' title: document.getElementById("editTitle").value,' +
    ' location: document.getElementById("editLocation").value,' +
    ' company: document.getElementById("editCompany").value,' +
    ' description: document.getElementById("editDesc").value' +
    ' };' +387 const endpoint = type === "paid"? "/paid-ads/edit" : "/ads/edit";' +
388 ' const res = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
389 ' const result = await res.json();' +
390 ' if (result.success) {' +
391 ' closeEdit();' +
392 ' loadUserAds();' +
393 ' loadPaidAds();' +
394 ' alert("Updated successfully");' +
395 ' } else {' +
396 ' alert("Update failed");' +
397 ' }' +
398 ' }' +
399 ' async function deleteAd(type, id, token) {' +
400 ' if (!confirm("Delete this ad?")) return;' +
401 ' const endpoint = type === "paid"? "/paid-ads/delete" : "/ads/delete";' +
402 ' const res = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id, token})});' +
403 ' const result = await res.json();' +
404 ' if (result.success) {' +
405 ' loadUserAds();' +
406 ' loadPaidAds();' +
407 ' alert("Deleted successfully");' +
408 ' } else {' +
409 ' alert("Delete failed");' +
410 ' }' +
411 ' }' +
412 ' async function loadJobs() {' +
413 ' const query = document.getElementById("searchInput").value || "cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant";' +
414 ' const days = document.getElementById("dateFilter").value;' +
415 ' document.getElementById("jobs").innerHTML = "<div class=\\"loading\\">Loading jobs...</div>";' +
416 ' try {' +
417 ' const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);' +
418 ' allJobs = await res.json();' +
419 ' renderJobs(allJobs);' +
420 ' } catch (e) {' +
421 ' document.getElementById("jobs").innerHTML = "<div class=\\"error\\">Failed to load jobs.</div>";' +
422 ' }' +
423 ' }' +
424 ' async function loadUserAds() {' +
425 ' const res = await fetch("/ads");' +
426 ' const ads = await res.json();' +
427 ' renderUserAds(ads);' +
428 ' }' +
429 ' async function loadPaidAds() {' +
430 ' const res = await fetch("/paid-ads");' +
431 ' const ads = await res.json();' +
432 ' renderPaidAds(ads);' +
433 ' }' +
434 ' async function submitAd() {' +
435 ' const data = {' +
436 ' title: document.getElementById("adTitle").value,' +
437 ' company: document.getElementById("adCompany").value,' +
438 ' location: document.getElementById("adLocation").value,' +
439 ' phone: document.getElementById("adPhone").value,' +
440 ' url: document.getElementById("adUrl").value,' +
441 ' description: document.getElementById("adDesc").value' +
442 ' };' +
443 ' if (!data.title ||!data.company ||!data.location) {' +
444 ' document.getElementById("adMsg").textContent = "Please fill title, company and location.";' +
445 ' document.getElementById("adMsg").style.color = "red";' +
446 ' return;' +
447 ' }' +
448 ' document.getElementById("adMsg").textContent = "Redirecting to payment...";' +
449 ' document.getElementById("adMsg").style.color = "blue";' +
450 ' const res = await fetch("/ads/initiate-payment", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
451 ' const result = await res.json();' +
452 ' if (result.payment_link) {' +
453 ' window.location.href = result.payment_link;' +
454 ' } else {' +
455 ' document.getElementById("adMsg").textContent = "Payment failed. Try again.";' +
456 ' document.getElementById("adMsg").style.color = "red";' +
457 ' }' +
458 ' }' +
459 ' async function submitPaidAd() {' +
460 ' const data = {' +
461 ' business: document.getElementById("adBizName").value,' +
462 ' link: document.getElementById("adLink").value,' +
463 ' text: document.getElementById("adText").value,' +
464 ' image: document.getElementById("adImgUrl").value' +
465 ' };' +
466 ' if (!data.business ||!data.link ||!data.text) {' +
467 ' document.getElementById("adPayMsg").textContent = "Fill business, link and text.";' +
468 ' document.getElementById("adPayMsg").style.color = "red";' +
469 ' return;' +
470 ' }' +
471 ' document.getElementById("adPayMsg").textContent = "Redirecting to payment...";' +
472 ' document.getElementById("adPayMsg").style.color = "blue";' +
473 ' const res = await fetch("/paid-ads/initiate-payment", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
474 ' const result = await res.json();' +
475 ' if (result.payment_link) {' +
476 ' window.location.href = result.payment_link;' +
477 ' } else {' +
478 ' document.getElementById("adPayMsg").textContent = "Payment failed. Try again.";' +
479 ' document.getElementById("adPayMsg").style.color = "red";' +
480 ' }' +
481 ' }' +
482 ' const urlParams = new URLSearchParams(window.location.search);' +
483 ' if (urlParams.get("payment") === "success") {' +
484 ' document.getElementById("adMsg").textContent = "Payment successful! Job posted.";' +
485 ' document.getElementById("adMsg").style.color = "green";' +
486 ' loadUserAds();' +
487 ' loadPaidAds();' +
488 ' }' +
489 ' if (urlParams.get("payment") === "failed") {' +
490 ' document.getElementById("adMsg").textContent = "Payment failed or cancelled.";' +
491 ' document.getElementById("adMsg").style.color = "red";' +
492 ' }' +
493 ' document.getElementById("searchBtn").addEventListener("click", loadJobs);' +
494 ' document.getElementById("dateFilter").addEventListener("change", loadJobs);' +
495 ' document.getElementById("searchInput").addEventListener("keypress", function(e) {' +
496 ' if (e.key === "Enter") loadJobs();' +
497 ' });' +
498 ' loadJobs();' +
499 ' loadUserAds();' +
500 ' loadPaidAds();' +
501 ' </script>' +
502 '</body>' +
503 '</html>'
504 );
505 });
506
507 app.post('/upload-ad-image', upload.single('image'), (req, res) => {
508 if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
509 res.json({ url: req.file.path });
510 });
511
512 // ADDED: Auth routes
513 app.post('/auth/signup', async (req, res) => {
514 const { firstName, lastName, email, phone, password } = req.body;
515 if (!firstName ||!lastName ||!email ||!password) {
516 return res.status(400).json({ success: false, error: 'Missing required fields' });
517 }
518 try {
519 const hash = await bcrypt.hash(password, 10);
520 const result = await pool.query(
521 `INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, email`,
522 [firstName, lastName, email, phone, hash]
523 );
524 res.json({ success: true, user: result.rows[0] });
525 } catch (err) {
526 if (err.code === '23505') {
527 res.status(400).json({ success: false, error: 'Email already exists' });
528 } else {
529 console.error(err);
530 res.status(500).json({ success: false, error: 'Signup failed' });
531 }
532 }
533 });
534
535 app.post('/auth/login', async (req, res) => {
536 const { email, password } = req.body;
537 if (!email ||!password) {
538 return res.status(400).json({ success: false, error: 'Missing email or password' });
539 }
540 try {
541 const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
542 if (result.rows.length === 0) {
543 return res.status(400).json({ success: false, error: 'Invalid email or password' });
544 }
545 const user = result.rows[0];
546 const match = await bcrypt.compare(password, user.password_hash);
547 if (!match) {
548 return res.status(400).json({ success: false, error: 'Invalid email or password' });
549 }
550 res.json({ success: true, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email } });
551 } catch (err) {
552 console.error(err);
553 res.status(500).json({ success: false, error: 'Login failed' });
554 }
555 });
556
557 app.post('/auth/logout', (req, res) => {
558 res.json({ success: true });
559 });
560
561 // Fetch jobs from Adzuna - 20 per country
562 async function fetchAdzunaJobs(countryCode, countryName, query) {
563 try {
564 const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&content-type=application/json&max_days_old=7&what=${encodeURIComponent(query)}`;
565 const response = await fetch(url);
566 if (!response.ok) return [];
567 const data = await response.json();
568 return (data.results || []).map(j => ({
569 title: j.title || 'Job Title',
570 company: j.company?.display_name || 'Unknown Company',
571 location: j.location?.display_name || countryName,
572 country: countryName,
573 url: j.redirect_url || '#',
574 date_posted: j.created,
575 source: 'Adzuna'
576 }));
577 } catch (err) {
578 return [];
579 }
580 }
581
582 // Fetch jobs from JSearch via RapidAPI
583 async function fetchJSearchJobs(query, location) {
584 try {
585 const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&num_pages=1&date_posted=week`;
586 const response = await fetch(url, {
587 method: 'GET',
588 headers: {
589 'X-RapidAPI-Key': RAPIDAPI_KEY,
590 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
591 }
592 });
593 if (!response.ok) return [];
594 const data = await response.json();
595 return (data.data || []).map(j => ({
596 title: j.job_title || 'Job Title',
597 company: j.employer_name || 'Unknown Company',
598 location: j.job_city || location,
599 country: location,
600 url: j.job_apply_link || '#',
601 date_posted: j.job_posted_at_datetime_utc,
602 source: j.job_publisher || 'JSearch'
603 }));
604 } catch (err) {
605 return [];
606 }
607 }
608
609 // Fetch jobs from Jooble
610 async function fetchJoobleJobs(query, location) {
611 try {
612 const response = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
613 method: 'POST',
614 headers: { 'Content-Type': 'application/json' },
615 body: JSON.stringify({
616 keywords: query,
617 location: location,
618 page: 1,
619 resultsOnPage: 20
620 })
621 });
622 if (!response.ok) return [];
623 const data = await response.json();
624 return (data.jobs || []).map(j => ({
625 title: j.title,
626 company: j.company,
627 location: j.location,
628 country: location,
629 url: j.link,
630 date_posted: j.updated,
631 source: 'Jooble'
632 }));
633 } catch (err) {
634 return [];
635 }
636 }
637
638 // Fetch remote jobs from Remotive
639 async function fetchRemotiveJobs(query) {
640 try {
641 const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`);
642 if (!response.ok) return [];
643 const data = await response.json();
644 return (data.jobs || []).map(j => ({
645 title: j.title,
646 company: j.company_name,
647 location: 'Remote',
648 country: 'Global',
649 url: j.url,
650 date_posted: j.date,
651 source: 'Remotive'
652 }));
653 } catch (err) {
654 return [];
655 }
656 }
657
658 app.get('/jobs', async (req, res) => {
659 try {
660 const query = req.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant';
661 const recentDays = parseInt(req.query.recent) || 7;
662
663 const countries = [
664 { code: 'sa', name: 'Saudi Arabia' },
665 { code: 'ae', name: 'United Arab Emirates' },
666 { code: 'gb', name: 'United Kingdom' },
667 { code: 'in', name: 'India' },
668 { code: 'ug', name: 'Uganda' },
669 { code: 'ke', name: 'Kenya' },
670 { code: 'tz', name: 'Tanzania' },
671 { code: 'za', name: 'South Africa' },
672 { code: 'au', name: 'Australia' },
673 { code: 'us', name: 'United States' },
674 { code: 'rw', name: 'Rwanda' },
675 { code: 'bi', name: 'Burundi' }
676 ];
677
678 let allJobs = [];
679
680 const promises = [];
681 for (let i = 0; i < countries.length; i++) {
682 promises.push(fetchAdzunaJobs(countries[i].code, countries[i].name, query));
683 promises.push(fetchJSearchJobs(query, countries[i].name));
684 promises.push(fetchJoobleJobs(query, countries[i].name));
685 }
686 promises.push(fetchRemotiveJobs(query));
687
688 const results = await Promise.all(promises);
689 results.forEach(jobs => {
690 allJobs.push(...jobs);
691 });
692
693 allJobs = allJobs.filter((job, index, self) =>
694 index === self.findIndex(j => j.url === job.url)
695 );
696
697 if (recentDays > 0 && recentDays!== 'all') {
698 const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
699 allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
700 }
701
702 allJobs.sort((a, b) => new Date(b.date_posted) - new Date(a.date_posted));
703
704 res.json(allJobs.slice(0, 100));
705 } catch (err) {
706 console.error('Jobs fetch error:', err);
707 res.json([]);
708 }
709 });
710
711 // Get approved job ads from DB
712 app.get('/ads', async (req, res) => {
713 try {
714 const result = await pool.query(
715 `SELECT * FROM ads WHERE type = 'job' AND status = 'approved' ORDER BY created_at DESC`
716 );
717 res.json(result.rows);
718 } catch (err) {
719 res.status(500).json({ error: 'Database error' });
720 }
721 });
722
723 // Get approved paid ads from DB
724 app.get('/paid-ads', async (req, res) => {
725 try {
726 const result = await pool.query(
727 `SELECT * FROM ads WHERE type = 'ad' AND status = 'approved' AND expires_at > NOW() ORDER BY created_at DESC`
728 );
729 res.json(result.rows);
730 } catch (err) {
731 res.status(500).json({ error: 'Database error' });
732 }
733 });
734
735 // Payment initiation routes
736 app.post('/ads/initiate-payment', async (req, res) => {
737 const { title, company, location, phone, url, description } = req.body;
738 if (!title ||!company ||!location) {
739 return res.status(400).json({ error: 'Missing required fields' });
740 }
741
742 const tx_ref = 'jobai_' + Date.now();
743 const token = crypto.randomBytes(16).toString('hex');
744 pendingPayments[tx_ref] = { title, company, location, phone, url, description, type: 'job', token };
745
746 try {
747 const response = await fetch('https://api.flutterwave.com/v3/payments', {
748 method: 'POST',
749 headers: {
750 'Authorization': `Bearer ${FLW_SECRET_KEY}`,
751 'Content-Type': 'application/json'
752 },
753 body: JSON.stringify({
754 tx_ref,
755 amount: 200,
756 currency: 'KES',
757 redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
758 customer: {
759 email: 'customer@jobai.com',
760 phonenumber: phone || '0700000',
761 name: company
762 },
763 customizations: {
764 title: 'Job Post Payment',
765 description: 'Pay 200 KES to post job on Jobai'
766 }
767 })
768 });
769
770 const data = await response.json();
771 if (data.status === 'success') {
772 res.json({ payment_link: data.data.link });
773 } else {
774 res.status(400).json({ error: 'Failed to create payment' });
775 }
776 } catch (err) {
777 console.error(err);
778 res.status(500).json({ error: 'Payment error' });
779 }
780 });
781
782 app.post('/paid-ads/initiate-payment', async (req, res) => {
783 const { business, link, text, image } = req.body;
784 if (!business ||!link ||!text) {
785 return res.status(400).json({ error: 'Missing required fields' });
786 }
787
788 const tx_ref = 'ad_' + Date.now();
789 const token = crypto.randomBytes(16).toString('hex');
790 pendingPayments[tx_ref] = { business, link, text, image, type: 'ad', token };
791
792 try {
793 const response = await fetch('https://api.flutterwave.com/v3/payments', {
794 method: 'POST',
795 headers: {
796 'Authorization': `Bearer ${FLW_SECRET_KEY}`,
797 'Content-Type': 'application/json'
798 },
799 body: JSON.stringify({
800 tx_ref,
801 amount: AD_PRICE,
802 currency: 'KES',
803 redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
804 customer: {
805 email: 'advertiser@jobai.com',
806 name: business
807 },
808 customizations: {
809 title: 'Sponsored Ad Payment',
810 description: 'Pay ' + AD_PRICE + ' KES for 7 days ad'
811 }
812 })
813 });
814
815 const data = await response.json();
816 if (data.status === 'success') {
817 res.json({ payment_link: data.data.link });
818 } else {
819 res.status(400).json({ error: 'Failed to create payment' });
820 }
821 } catch (err) {
822 console.error(err);
823 res.status(500).json({ error: 'Payment error' });
824 }
825 });
826
827 app.get('/payment-callback', async (req, res) => {
828 const { transaction_id, tx_ref } = req.query;
829
830 try {
831 const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
832 headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}` }
833 });
834 const data = await response.json();
835
836 if (data.status === 'success' && data.data.status === 'successful') {
837 const jobData = pendingPayments[tx_ref];
838 if (jobData) {
839 const id = Date.now() + Math.floor(Math.random() * 1000);
840 const expires = new Date();
841 expires.setDate(expires.getDate() + AD_DURATION_DAYS);
842
843 if (jobData.type === 'ad') {
844 await pool.query(
845 `INSERT INTO ads (id, token, type, status, business, link, text, image, paymentref, expires_at)
846 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
847 [id, jobData.token, 'ad', 'approved', jobData.business, jobData.link, jobData.text, jobData.image, transaction_id, expires]
848 );
849 } else {
850 await pool.query(
851 `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, created_at)
852 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
853 [id, jobData.token, 'job', 'approved', jobData.title, jobData.company, jobData.location, jobData.phone, jobData.url, jobData.description, transaction_id]
854 );
855 }
856 delete pendingPayments[tx_ref];
857 res.redirect('/?payment=success');
858 } else {
859 res.redirect('/?payment=failed');
860 }
861 } else {
862 res.redirect('/?payment=failed');
863 }
864 } catch (err) {
865 console.error(err);
866 res.redirect('/?payment=failed');
867 }
868 });
869
870 // Edit user ad
871 app.post('/ads/edit', async (req, res) => {
872 const { id, token, title, location, company, description } = req.body;
873 try {
874 const result = await pool.query(
875 `UPDATE ads SET title = COALESCE($1, title), location = COALESCE($2, location),
876 company = COALESCE($3, company), description = COALESCE($4, description)
877 WHERE id = $5 AND token = $6 AND type = 'job' RETURNING id`,
878 [title, location, company, description, id, token]
879 );
880 res.json({ success: result.rowCount > 0 });
881 } catch (err) {
882 console.error(err);
883 res.json({ success: false });
884 }
885 });
886
887 // Delete user ad
888 app.post('/ads/delete', async (req, res) => {
889 const { id, token } = req.body;
890 try {
891 const result = await pool.query(
892 `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'job' RETURNING id`,
893 [id, token]
894 );
895 res.json({ success: result.rowCount > 0 });
896 } catch (err) {
897 console.error(err);
898 res.json({ success: false });
899 }
900 });
901
902 // Edit paid ad
903 app.post('/paid-ads/edit', async (req, res) => {
904 const { id, token, title, location, company, description } = req.body;
905 try {
906 const result = await pool.query(
907 `UPDATE ads SET business = COALESCE($1, business), text = COALESCE($2, text),
908 location = COALESCE($3, location), company = COALESCE($4, company)
909 WHERE id = $5 AND token = $6 AND type = 'ad' RETURNING id`,
910 [title, description, location, company, id, token]
911 );
912 res.json({ success: result.rowCount > 0 });
913 } catch (err) {
914 console.error(err);
915 res.json({ success: false });
916 }
917 });
918
919 // Delete paid ad
920 app.post('/paid-ads/delete', async (req, res) => {
921 const { id, token } = req.body;
922 try {
923 const result = await pool.query(
924 `DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'ad' RETURNING id`,
925 [id, token]
926 );
927 res.json({ success: result.rowCount > 0 });
928 } catch (err) {
929 console.error(err);
930 res.json({ success: false });
931 }
932 });
933
934 app.listen(PORT, function() {
935 console.log('Server running on port ' + PORT);
936 });
