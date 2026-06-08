import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import sitemapRouter from './sitemap.js';

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || 'cd82aca8';
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(sitemapRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

pool.query(`
  CREATE TABLE IF NOT EXISTS ads (
    id BIGINT PRIMARY KEY, token TEXT, type TEXT, status TEXT,
    title TEXT, company TEXT, location TEXT, phone TEXT, url TEXT,
    description TEXT, business TEXT, link TEXT, text TEXT, image TEXT,
    paymentref TEXT, created_at TIMESTAMP DEFAULT NOW(), expires_at TIMESTAMP
  )`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL,
    country_interest TEXT, skills TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`).catch(console.error);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'jobai-ads', allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], transformation: [{ width: 800, height: 600, crop: 'limit' }] }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 } });
let pendingPayments = {};
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

app.get('/google765cda11c517c492.html', (req, res) => {
  res.send('google-site-verification: google765cda11c517c492.html');
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jobai - Get Connected to Jobs & Workers</title>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-1637256996790764" crossorigin="anonymous"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }
  .ug-flag { position: absolute; top: 16px; left: 16px; width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10000; object-fit: cover; }
  .auth-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); display: flex; flex-direction: column; z-index: 9999; overflow-y: auto; }
  .auth-overlay.hidden { display: none; }
  .auth-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-box { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); max-width: 420px; width: 100%; margin: auto; position: relative; }
  .auth-box h1 { margin: 0 0 8px 0; color: #1a73e8; font-size: 28px; text-align: center; }
  .auth-box p { margin: 0 0 20px 0; color: #666; text-align: center; font-size: 14px; }
  .auth-tabs { display: flex; gap: 10px; margin-bottom: 16px; }
  .auth-tabs button { flex: 1; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 15px; }
  .auth-tabs.active { background: #1a73e8; color: white; }
  .auth-tabs.inactive { background: #f5f5f5; color: #333; }
  .auth-form input,.auth-form select { width: 100%; padding: 12px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
  .auth-footer { background:#000;color:#fff;padding:20px;text-align:center;font-size:13px;width:100%;box-sizing:border-box; }
  .auth-footer a { color:#64b5f6;text-decoration:none;margin:0 12px; }
  .hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 40px 20px 30px; text-align: center; position: relative; }
  .hero h1 { font-size: 32px; margin: 0 0 8px 0; font-weight: 700; }
  .hero p { font-size: 16px; opacity: 0.95; margin: 0; }
  .container { max-width: 1000px; margin: 20px auto; padding: 0 16px; }
  .controls { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
  .controls input,.controls select { padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; background: white; }
  .controls input { flex: 1; min-width: 200px; }
  .section { margin-bottom: 32px; }
  .section h2 { margin: 0 0 16px 0; font-size: 24px; color: #1a1a1a; }
  .job-card { background: white; padding: 20px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative; transition: transform 0.2s, box-shadow 0.2s; display: block; text-decoration: none; color: inherit; }
  .job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
  .job-card h3 { margin: 8px 0 8px 0; color: #1a73e8; font-size: 18px; line-height: 1.4; }
  .job-meta { margin: 0 0 14px 0; color: #666; font-size: 14px; line-height: 1.5; }
  .job-meta span { margin-right: 8px; }
  .country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }
  .user-ad-tag { background: #fff3e0; color: #f57c00; }
  .btn-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }
  .connect-btn:hover { background: #1557b0; }
  .call-btn { background: #34a853; }
  .call-btn:hover { background: #2d9147; }
  .wa-btn { background: #25D366; }
  .wa-btn:hover { background: #1ebe5a; }
  .free-btn { background: #9C27B0; }
  .free-btn:hover { background: #7B1FA2; }
  .loading { text-align: center; color: #666; padding: 30px; font-size: 16px; }
  .error { text-align: center; color: #d32f2f; padding: 30px; }
  .ad-form { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
  .ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }
  .ad-form h3 { margin-top: 0; font-size: 18px; }
  .phone-display { color: #34a853; font-weight: 600; }
  .img-preview { max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 10px; display: none; }
  .card-actions { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 6px; }
  .icon-btn { width: 32px; height: 32px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; }
  .edit-btn { background: #ff9800; }
  .delete-btn { background: #d32f2f; }
  .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
  .modal.active { display: flex; }
  .modal-content { background: white; padding: 24px; border-radius: 12px; max-width: 500px; width: 90%; }
  .user-bar { background: #1a73e8; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; position: relative; }
  .user-bar button { background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
  .main-content { display: none; }
  .main-content.show { display: block; }
  </style>
</head>
<body>
  <div id="authOverlay" class="auth-overlay">
    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg" class="ug-flag" alt="Uganda">
    <div class="auth-container">
      <div class="auth-box">
        <h1>Jobai</h1>
        <p>Get Connected to Jobs & Workers</p>
        <div class="auth-tabs">
          <button id="tabSignup" class="active" onclick="showTab('signup')">Sign Up</button>
          <button id="tabLogin" class="inactive" onclick="showTab('login')">Login</button>
        </div>
        <div id="signupForm" class="auth-form">
          <input type="text" id="firstName" placeholder="First Name" required>
          <input type="text" id="lastName" placeholder="Last Name" required>
          <input type="email" id="signupEmail" placeholder="Email" required>
          <div style="display:flex;gap:6px;margin-bottom:12px;">
            <span style="display:flex;align-items:center;padding:12px;background:#f5f5f5;border:1px solid #ddd;border-radius:8px;font-size:14px;">🇺🇬 +256</span>
            <input type="tel" id="signupPhone" placeholder="Phone Number" style="flex:1;" onfocus="if(!this.value)this.value='256';">
          </div>
          <select id="countryInterest">
            <option value="">Country Interest</option>
            <option value="Uganda">Uganda</option><option value="Kenya">Kenya</option><option value="Tanzania">Tanzania</option>
            <option value="Rwanda">Rwanda</option><option value="Burundi">Burundi</option><option value="UAE">UAE</option>
            <option value="Saudi Arabia">Saudi Arabia</option><option value="UK">UK</option><option value="Canada">Canada</option>
            <option value="India">India</option>
          </select>
          <input type="text" id="skills" placeholder="Skills: nurse, driver, cleaner...">
          <input type="password" id="signupPassword" placeholder="Password" required>
          <input type="password" id="confirmPassword" placeholder="Confirm Password" required>
          <button class="connect-btn" style="width:100%;padding:12px;" onclick="signup()">Create Account</button>
          <p id="signupMsg" style="font-size:12px;margin-top:8px;"></p>
        </div>
        <div id="loginForm" class="auth-form" style="display:none;">
          <input type="email" id="loginEmail" placeholder="Email" required>
          <input type="password" id="loginPassword" placeholder="Password" required>
          <button class="connect-btn" style="width:100%;padding:12px;" onclick="login()">Login</button>
          <p id="loginMsg" style="font-size:12px;margin-top:8px;"></p>
        </div>
      </div>
    </div>
    <div class="auth-footer">
      <a href="/about">About Us</a>
      <a href="/privacy">Privacy Policy</a>
      <a href="/admin">Admin</a>
      <p style="margin:12px 0 0;color:#aaa;font-size:12px;">© 2026 EmmieTech Global. All rights reserved.</p>
    </div>
  </div>

  <div id="mainContent" class="main-content">
    <div class="user-bar">
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Flag_of_Uganda.svg" class="ug-flag" alt="Uganda">
      <span id="userWelcome" style="margin-left:60px;"></span>
      <button onclick="logout()">Logout</button>
    </div>
    <div class="hero">
      <h1>Get Connected to Jobs & Workers</h1>
      <p>AI-powered matching for Uganda, Kenya, Tanzania, Rwanda, Burundi, India, UAE, Saudi Arabia, UK, Canada</p>
    </div>
    <div class="container">
      <div class="controls">
        <input type="text" id="searchInput" placeholder="Search: cleaner, nurse, teacher, engineer..." />
        <select id="dateFilter">
          <option value="30">Last 30 days</option>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="3">Last 3 days</option>
          <option value="1">Last 24 hours</option>
        </select>
        <button class="connect-btn" id="searchBtn">Search</button>
      </div>
      <div class="section">
        <h2>Trending Jobs</h2>
        <div id="jobs" class="loading">Loading jobs...</div>
      </div>
      <div class="section">
        <h2>Post a Job</h2>
        <div class="ad-form" id="adForm">
          <h3>Advertise your job - Pay 200 KES or Post Free</h3>
          <input type="text" id="adTitle" placeholder="Job title" required>
          <input type="text" id="adCompany" placeholder="Company name" required>
          <input type="text" id="adLocation" placeholder="Location" required>
          <input type="tel" id="adPhone" placeholder="Phone number for applicants">
          <input type="url" id="adUrl" placeholder="Apply link (optional)">
          <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>
          <div class="btn-group">
            <button class="connect-btn" onclick="submitAd()">Pay 200 KES & Post Job</button>
            <button class="connect-btn free-btn" onclick="submitAdFree()">Post Free (Testing)</button>
          </div>
          <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>
        </div>
        <h2>Community Job Posts</h2>
        <div id="userAds" class="loading">Loading...</div>
      </div>
      <div class="section">
        <h2>Sponsored Ads</h2>
        <div class="ad-form">
          <h3>Advertise here for ${AD_PRICE} KES for 7 days</h3>
          <input type="text" id="adBizName" placeholder="Business name" required>
          <input type="url" id="adLink" placeholder="Website or WhatsApp link" required>
          <input type="text" id="adText" placeholder="Short ad text" required>
          <input type="file" id="adImgFile" accept="image/*" capture="environment">
          <img id="imgPreview" class="img-preview" />
          <input type="hidden" id="adImgUrl">
          <button class="connect-btn" style="background:#f57c00;" onclick="submitPaidAd()">Pay ${AD_PRICE} KES & Run Ad</button>
          <p id="adPayMsg" style="margin-top:10px; font-size:14px;"></p>
        </div>
        <div id="paidAds" class="loading">Loading ads...</div>
      </div>
    </div>
  </div>

  <div id="editModal" class="modal">
    <div class="modal-content">
      <h3>Edit Ad</h3>
      <input type="hidden" id="editId">
      <input type="hidden" id="editToken">
      <input type="hidden" id="editType">
      <input type="text" id="editTitle" placeholder="Title/Business">
      <input type="text" id="editLocation" placeholder="Location">
      <input type="text" id="editCompany" placeholder="Company">
      <textarea id="editDesc" placeholder="Description" rows="3"></textarea>
      <div class="btn-group" style="margin-top:16px;">
        <button class="connect-btn" onclick="saveEdit()">Save</button>
        <button class="connect-btn" style="background:#666;" onclick="closeEdit()">Cancel</button>
      </div>
    </div>
  </div>

  <script>
    function showTab(tab) {
      const s = document.getElementById('signupForm'), l = document.getElementById('loginForm');
      const ts = document.getElementById('tabSignup'), tl = document.getElementById('tabLogin');
      if (tab === 'signup') {
        s.style.display = 'block'; l.style.display = 'none';
        ts.className = 'active'; tl.className = 'inactive';
      } else {
        s.style.display = 'none'; l.style.display = 'block';
        tl.className = 'active'; ts.className = 'inactive';
      }
    }

    async function signup() {
      const first = document.getElementById('firstName').value.trim(), last = document.getElementById('lastName').value.trim();
      const email = document.getElementById('signupEmail').value.trim(), phone = document.getElementById('signupPhone').value.trim();
      const pass = document.getElementById('signupPassword').value, cpass = document.getElementById('confirmPassword').value;
      const country_interest = document.getElementById('countryInterest').value, skills = document.getElementById('skills').value.trim();
      const msg = document.getElementById('signupMsg');
      if (!first ||!last ||!email ||!pass) { msg.textContent = 'Fill all required fields'; msg.style.color = 'red'; return; }
      if (pass.length < 6) { msg.textContent = 'Password must be 6+ characters'; msg.style.color = 'red'; return; }
      if (pass!== cpass) { msg.textContent = 'Passwords do not match'; msg.style.color = 'red'; return; }
      msg.textContent = 'Creating account...'; msg.style.color = 'blue';
      const res = await fetch('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: first, lastName: last, email, phone, password: pass, country_interest, skills }) });
      const data = await res.json();
      if (data.success) {
        msg.textContent = 'Account created! Logging you in...'; msg.style.color = 'green';
        localStorage.setItem('jobai_user', JSON.stringify(data.user));
        setTimeout(() => unlockSite(data.user), 500);
      } else { msg.textContent = data.error || 'Signup failed'; msg.style.color = 'red'; }
    }

    async function login() {
      const email = document.getElementById('loginEmail').value.trim(), pass = document.getElementById('loginPassword').value;
      const msg = document.getElementById('loginMsg');
      if (!email ||!pass) { msg.textContent = 'Enter email and password'; msg.style.color = 'red'; return; }
      msg.textContent = 'Logging in...'; msg.style.color = 'blue';
      const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
      const data = await res.json();
      if (data.success) {
        msg.textContent = 'Login successful!'; msg.style.color = 'green';
        localStorage.setItem('jobai_user', JSON.stringify(data.user));
        setTimeout(() => unlockSite(data.user), 500);
      } else { msg.textContent = data.error || 'Login failed'; msg.style.color = 'red'; }
    }

    function unlockSite(user) {
      document.getElementById('authOverlay').classList.add('hidden');
      document.getElementById('mainContent').classList.add('show');
      document.getElementById('userWelcome').textContent = 'Welcome, ' + user.first_name + ' ' + user.last_name;
      loadJobs();
      loadUserAds();
      loadPaidAds();
    }

    async function logout() {
      await fetch('/auth/logout', { method: 'POST' });
      localStorage.removeItem('jobai_user');
      location.reload();
    }

    window.addEventListener('load', () => {
      const user = JSON.parse(localStorage.getItem('jobai_user') || 'null');
      if (user) {
        unlockSite(user);
      }
    });

    let allJobs = [];
    document.getElementById("adImgFile")?.addEventListener("change", async function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("image", file);
      document.getElementById("adPayMsg").textContent = "Uploading image...";
      document.getElementById("adPayMsg").style.color = "blue";
      try {
        const res = await fetch("/upload-ad-image", { method: "POST", body: formData });
        const data = await res.json();
        if (data.url) {
          document.getElementById("adImgUrl").value = data.url;
          document.getElementById("imgPreview").src = data.url;
          document.getElementById("imgPreview").style.display = "block";
          document.getElementById("adPayMsg").textContent = "Image uploaded!";
          document.getElementById("adPayMsg").style.color = "green";
        } else {
          document.getElementById("adPayMsg").textContent = "Upload failed";
          document.getElementById("adPayMsg").style.color = "red";
        }
      } catch (err) {
        document.getElementById("adPayMsg").textContent = "Upload error";
        document.getElementById("adPayMsg").style.color = "red";
      }
    });

    function timeAgo(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diffMs = now - date;
      if (diffMs < 0) return "";
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);
      if (diffSec < 60) return "just now";
      if (diffMin < 60) return diffMin + "m ago";
      if (diffHr < 24) return diffHr + "h ago";
      if (diffDay === 1) return "1d ago";
      return diffDay + "d ago";
    }

    function applyWhatsApp(title, company, location) {
      const user = JSON.parse(localStorage.getItem('jobai_user') || '{}');
      const name = user.first_name? user.first_name + ' ' + user.last_name : 'Applicant';
      const skills = user.skills || '';
      const msg = encodeURIComponent(\`Hi, I'm \${name}. I'm interested in the \${title} position at \${company} in \${location}. My skills: \${skills}. Found on Jobai. Can we talk?\`);
      const waNumber = '256776686096';
      window.open(\`https://wa.me/\${waNumber}?text=\${msg}\`, '_blank');
    }

    function renderJobs(jobs) {
      if (jobs.error) {
        document.getElementById("jobs").innerHTML = '<div class="error">' + jobs.error + '</div>';
        return;
      }
      if (!jobs.length) {
        document.getElementById("jobs").innerHTML = '<div class="error">No jobs found. Try different keywords.</div>';
        return;
      }
      document.getElementById("jobs").innerHTML = jobs.map(function(j) {
        const timeStr = timeAgo(j.date_posted);
        const timePart = timeStr? \`<span>•</span><span>\${timeStr}</span>\` : "";
        const applyCount = Math.floor(Math.random() * 20) + 3;
        return \`<div class="job-card">
          <span class="country-tag">\${j.country}</span>
          <span class="source-tag">\${j.source}</span>
          <span class="source-tag" style="background:#e8f5e9;color:#2e7d32;">\${applyCount} applied today</span>
          <h3>\${j.title}</h3>
          <p class="job-meta"><span>\${j.location}</span><span>•</span><span>\${j.company}</span>\${timePart}</p>
          <div class="btn-group">
            <button class="connect-btn wa-btn" onclick="applyWhatsApp('\${j.title.replace(/'/g, "\\\\'")}','\${j.company.replace(/'/g, "\\\\'")}','\${j.location.replace(/'/g, "\\\\'")}')">
              📱 Apply via WhatsApp
            </button>
            <a href="\${j.url}" target="_blank" class="connect-btn">View Original</a>
          </div>
        </div>\`;
      }).join("");
    }

    function renderUserAds(ads) {
      if (!ads.length) {
        document.getElementById("userAds").innerHTML = '<div class="error">No community posts yet.</div>';
        return;
      }
      document.getElementById("userAds").innerHTML = ads.map(function(j) {
        let buttons = '<div class="btn-group">';
        if (j.phone) {
          buttons += \`<button class="connect-btn wa-btn" onclick="applyWhatsApp('\${j.title.replace(/'/g, "\\\\'")}','\${j.company.replace(/'/g, "\\\\'")}','\${j.location.replace(/'/g, "\\\\'")}')">📱 WhatsApp</button>\`;
          buttons += \`<a href="tel:\${j.phone}" class="connect-btn call-btn" style="width:auto;">Call \${j.phone}</a>\`;
        }
        if (j.url && j.url!== "#") {
          buttons += \`<a href="\${j.url}" target="_blank" class="connect-btn" style="width:auto;">Apply Link</a>\`;
        }
        buttons += "</div>";
        let actions = '<div class="card-actions">';
        actions += \`<button class="icon-btn edit-btn" onclick="openEdit('user','\${j.id}','\${j.token}')">✏️</button>\`;
        actions += \`<button class="icon-btn delete-btn" onclick="deleteAd('user','\${j.id}','\${j.token}')">🗑️</button>\`;
        actions += "</div>";
        const timeStr = timeAgo(j.created_at);
        const timeHtml = timeStr? \`<span class="source-tag">\${timeStr}</span>\` : "";
        return \`<div class="job-card" style="position:relative">\${actions}<span class="country-tag user-ad-tag">Community</span>\${timeHtml}<h3>\${j.title}</h3><p class="job-meta"><span>\${j.location}</span><span>•</span><span>\${j.company}</span></p><p>\${j.description || ""}</p><p class="phone-display">\${j.phone? "Phone: " + j.phone : ""}</p>\${buttons}</div>\`;
      }).join("");
    }

    function renderPaidAds(ads) {
      if (!ads.length) {
        document.getElementById("paidAds").innerHTML = '<div class="error">No sponsors yet.</div>';
        return;
      }
      document.getElementById("paidAds").innerHTML = ads.map(function(ad) {
        let img = ad.image? \`<img src="\${ad.image}" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:10px;">\` : '';
        let actions = '<div class="card-actions">';
        actions += \`<button class="icon-btn edit-btn" onclick="openEdit('paid','\${ad.id}','\${ad.token}')">✏️</button>\`;
        actions += \`<button class="icon-btn delete-btn" onclick="deleteAd('paid','\${ad.id}','\${ad.token}')">🗑️</button>\`;
        actions += "</div>";
        const timeStr = timeAgo(ad.created_at) || "Just posted";
        const timeHtml = \`<span class="source-tag">\${timeStr}</span>\`;
        return \`<div class="job-card" style="border:2px solid #f57c00;position:relative;">\${actions}<span class="country-tag user-ad-tag">Sponsored</span>\${timeHtml}\${img}<h3>\${ad.business}</h3><p>\${ad.text}</p><a href="\${ad.link}" target="_blank" class="connect-btn" style="background:#f57c00;width:auto;">Visit</a></div>\`;
      }).join("");
    }

    function openEdit(type, id, token) {
      document.getElementById("editType").value = type;
      document.getElementById("editId").value = id;
      document.getElementById("editToken").value = token;
      document.getElementById("editModal").classList.add("active");
    }

    function closeEdit() {
      document.getElementById("editModal").classList.remove("active");
    }

    async function saveEdit() {
      const type = document.getElementById("editType").value;
      const id = document.getElementById("editId").value;
      const token = document.getElementById("editToken").value;
      const data = { id, token, title: document.getElementById("editTitle").value, location: document.getElementById("editLocation").value, company: document.getElementById("editCompany").value, description: document.getElementById("editDesc").value };
      const endpoint = type === "paid"? "/paid-ads/edit" : "/ads/edit";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { closeEdit(); loadUserAds(); loadPaidAds(); alert("Updated successfully"); }
      else { alert("Update failed"); }
    }

    async function deleteAd(type, id, token) {
      if (!confirm("Delete this ad?")) return;
      const endpoint = type === "paid"? "/paid-ads/delete" : "/ads/delete";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, token }) });
      const result = await res.json();
      if (result.success) { loadUserAds(); loadPaidAds(); alert("Deleted successfully"); }
      else { alert("Delete failed"); }
    }

    async function loadJobs() {
      const query = document.getElementById("searchInput")?.value || "cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager";
      const days = document.getElementById("dateFilter")?.value || "30";
      document.getElementById("jobs").innerHTML = '<div class="loading">Loading jobs...</div>';
      try {
                const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);
        allJobs = await res.json();
        renderJobs(allJobs);
      } catch (e) {
        document.getElementById("jobs").innerHTML = '<div class="error">Failed to load jobs. Retrying...</div>';
        setTimeout(loadJobs, 3000);
      }
    }

    async function loadUserAds() {
      try { 
        const res = await fetch("/ads"); 
        const ads = await res.json(); 
        renderUserAds(ads); 
      } catch (e) { 
        console.error("loadUserAds error:", e);
        document.getElementById("userAds").innerHTML = '<div class="error">Failed to load community posts</div>';
      }
    }

    async function loadPaidAds() {
      try { 
        const res = await fetch("/paid-ads"); 
        const ads = await res.json(); 
        renderPaidAds(ads); 
      } catch (e) { 
        console.error("loadPaidAds error:", e);
        document.getElementById("paidAds").innerHTML = '<div class="error">Failed to load sponsored ads</div>';
      }
    }

    async function submitAd() {
      const data = { title: document.getElementById("adTitle").value, company: document.getElementById("adCompany").value, location: document.getElementById("adLocation").value, phone: document.getElementById("adPhone").value, url: document.getElementById("adUrl").value, description: document.getElementById("adDesc").value };
      if (!data.title || !data.company || !data.location) { document.getElementById("adMsg").textContent = "Please fill title, company and location."; document.getElementById("adMsg").style.color = "red"; return; }
      document.getElementById("adMsg").textContent = "Redirecting to payment..."; document.getElementById("adMsg").style.color = "blue";
      const res = await fetch("/ads/initiate-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.payment_link) { window.location.href = result.payment_link; } 
      else { document.getElementById("adMsg").textContent = result.error || "Payment failed. Try again."; document.getElementById("adMsg").style.color = "red"; }
    }

    async function submitAdFree() {
      const data = { title: document.getElementById("adTitle").value, company: document.getElementById("adCompany").value, location: document.getElementById("adLocation").value, phone: document.getElementById("adPhone").value, url: document.getElementById("adUrl").value, description: document.getElementById("adDesc").value };
      if (!data.title || !data.company || !data.location) { document.getElementById("adMsg").textContent = "Please fill title, company and location."; document.getElementById("adMsg").style.color = "red"; return; }
      document.getElementById("adMsg").textContent = "Posting for free..."; document.getElementById("adMsg").style.color = "blue";
      const res = await fetch("/ads/post-free", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.success) { 
        document.getElementById("adMsg").textContent = "Posted successfully!"; 
        document.getElementById("adMsg").style.color = "green";
        document.getElementById("adTitle").value = '';
        document.getElementById("adCompany").value = '';
        document.getElementById("adLocation").value = '';
        document.getElementById("adPhone").value = '';
        document.getElementById("adUrl").value = '';
        document.getElementById("adDesc").value = '';
        loadUserAds(); 
      } else { 
        document.getElementById("adMsg").textContent = "Post failed. Try again."; 
        document.getElementById("adMsg").style.color = "red"; 
      }
    }

    async function submitPaidAd() {
      const data = { business: document.getElementById("adBizName").value, link: document.getElementById("adLink").value, text: document.getElementById("adText").value, image: document.getElementById("adImgUrl").value };
      if (!data.business || !data.link || !data.text) { document.getElementById("adPayMsg").textContent = "Fill business, link and text."; document.getElementById("adPayMsg").style.color = "red"; return; }
      document.getElementById("adPayMsg").textContent = "Redirecting to payment..."; document.getElementById("adPayMsg").style.color = "blue";
      const res = await fetch("/paid-ads/initiate-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await res.json();
      if (result.payment_link) { window.location.href = result.payment_link; } 
      else { document.getElementById("adPayMsg").textContent = result.error || "Payment failed. Try again."; document.getElementById("adPayMsg").style.color = "red"; }
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("payment") === "success") {
      document.getElementById("adMsg").textContent = "Payment successful! Job posted.";
      document.getElementById("adMsg").style.color = "green";
      loadUserAds(); loadPaidAds();
    }
    if (urlParams.get("payment") === "failed") {
      document.getElementById("adMsg").textContent = "Payment failed or cancelled.";
      document.getElementById("adMsg").style.color = "red";
    }

    document.getElementById("searchBtn")?.addEventListener("click", loadJobs);
    document.getElementById("dateFilter")?.addEventListener("change", loadJobs);
    document.getElementById("searchInput")?.addEventListener("keypress", function(e) {
      if (e.key === "Enter") loadJobs();
    });
  </script>

  <footer style="background:#000;color:#fff;padding:32px 20px;margin-top:60px;">
    <div style="max-width:1000px;margin:0 auto;text-align:center;">
      <h3 style="margin:0 0 12px 0;font-size:20px;font-weight:700;">EmmieTech Global Recruitment Agency</h3>
      <p style="margin:0 0 8px 0;font-size:15px;color:#ddd;">Kampala, Uganda | WhatsApp: +256 776 686 096</p>
      <p style="margin:0 0 20px 0;font-size:14px;color:#aaa;">Licensed by Ministry of Gender, Labour & Social Development</p>
      <div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap;">
        <a href="/about" style="color:#64b5f6;text-decoration:none;font-size:14px;">About Us</a>
        <a href="/privacy" style="color:#64b5f6;text-decoration:none;font-size:14px;">Privacy Policy</a>
        <a href="/admin" style="color:#64b5f6;text-decoration:none;font-size:14px;">Admin</a>
      </div>
    </div>
    <div style="margin:40px auto 0;max-width:1000px;padding:20px;background:#f8f9fa;border-radius:10px;">
      <h3 style="text-align:center;margin-bottom:15px;color:#333;">🔥 Other Top Products</h3>
      <a href="https://bloodsugarblaster.com/index-vsl-ds24#aff=emmieshukiee042" target='_blank' style='display:block;padding:15px;background:#FF9800;color:white;text-align:center;text-decoration:none;font-weight:bold;border-radius:8px;margin:10px 0;'>🩺 Support Healthy Blood Sugar →</a>
      <a href="https://jointpainhack.com/digi/add-to-cart/#aff=emmieshukiee042" target='_blank' style='display:block;padding:15px;background:#9C27B0;color:white;text-align:center;text-decoration:none;font-weight:bold;border-radius:8px;margin:10px 0;'>🦴 Joint Pain Relief Formula →</a>
      <a href="https://www.advancedbionutritionals.com/DS24/Advanced-Amino/Muscle-Mass-Loss/HD.htm#aff=emmieshukiee042" target='_blank' style='display:block;padding:15px;background:#25D366;color:white;text-align:center;text-decoration:none;font-weight:bold;border-radius:8px;'>💪 Boost Energy & Recovery → Click Here</a>
      <a href="https://myketosana.com/ketosana-pdp-fe#aff=emmieshukiee042" target='_blank' style='display:block;padding:15px;background:#FF5722;color:white;text-align:center;text-decoration:none;font-weight:bold;border-radius:8px;margin:10px 0;font-size:16px;'>🔥 Burn Fat Fast - KetoSana →</a>
    </div>
    <div style="margin:40px auto 0;max-width:1000px;padding:20px;background:#000;border-radius:10px;border:2px solid #FFD700;">
      <h3 style="text-align:center;color:#FFD700;margin-bottom:15px;">💰 AI Cash System 2026</h3>
      <a href="https://ai-cash-page-system-dd.24-7-ai-cash-system.academy/#aff=emmieshukiee042" target="_blank" style="display:block;padding:15px;background:#FFD700;color:#000;text-align:center;text-decoration:none;font-weight:bold;border-radius:8px;margin:10px 0;font-size:16px;">🚀 Make Money With AI - Copy & Paste System →</a>
      <p style="text-align:center;color:#aaa;font-size:12px;margin:5px 0 0;">$74.21 per sale | Video courses included</p>
    </div>
    <p style="text-align:center;margin:32px 0 0 0;font-size:12px;color:#666;">© 2026 EmmieTech Global. All rights reserved.</p>
  </footer>
</body>
</html>
  `);
});

app.get('/about', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Us - Jobai</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }
   .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 30px 20px; text-align: center; }
   .container { max-width: 800px; margin: 40px auto; padding: 0 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
   .content { padding: 30px; line-height: 1.8; }
    h1 { margin: 0; font-size: 32px; }
    h2 { color: #1a73e8; margin-top: 30px; }
   .back-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>About EmmieTech Global</h1></div>
  <div class="container">
    <div class="content">
      <h2>Who We Are</h2>
      <p>EmmieTech Global Recruitment Agency is a licensed recruitment company based in Kampala, Uganda. We connect skilled workers across East Africa, UAE, Saudi Arabia, UK, Canada, and India with verified employers.</p>
      
      <h2>Our Mission</h2>
      <p>To eliminate unemployment by using AI to match job seekers with real opportunities. We verify every employer and provide direct WhatsApp contact so you never pay agents or get scammed.</p>
      
      <h2>Contact Us</h2>
      <p><strong>Location:</strong> Kampala, Uganda<br>
      <strong>WhatsApp:</strong> +256 776 686 096<br>
      <strong>License:</strong> Ministry of Gender, Labour & Social Development</p>
      
      <a href="/" class="back-btn">← Back to Jobs</a>
    </div>
  </div>
</body>
</html>
  `);
});

app.get('/privacy', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Jobai</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }
   .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 30px 20px; text-align: center; }
   .container { max-width: 800px; margin: 40px auto; padding: 0 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
   .content { padding: 30px; line-height: 1.8; }
    h1 { margin: 0; font-size: 32px; }
    h2 { color: #1a73e8; margin-top: 30px; }
   .back-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Privacy Policy</h1></div>
  <div class="container">
    <div class="content">
      <p><strong>Last Updated: June 2026</strong></p>
      
      <h2>Information We Collect</h2>
      <p>When you sign up, we collect: name, email, phone, country interest, and skills. When you post ads, we collect job details and payment info via Flutterwave.</p>
      
      <h2>How We Use Your Data</h2>
      <p>We use your data to: match you with jobs, display your contact to employers, process payments, and send WhatsApp updates. We never sell your data.</p>
      
      <h2>Data Security</h2>
      <p>Passwords are encrypted with bcrypt. Payments are processed securely by Flutterwave. We use PostgreSQL with SSL.</p>
      
      <h2>Your Rights</h2>
      <p>You can request deletion of your account anytime via WhatsApp: +256 776 686 096</p>
      
      <a href="/" class="back-btn">← Back to Jobs</a>
    </div>
  </div>
</body>
</html>
  `);
});

app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Jobai</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }
   .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 30px 20px; text-align: center; }
   .container { max-width: 800px; margin: 40px auto; padding: 0 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
   .content { padding: 30px; text-align: center; }
    h1 { margin: 0; font-size: 32px; }
   .back-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header"><h1>Admin Panel</h1></div>
  <div class="container">
    <div class="content">
      <h2>Coming Soon</h2>
      <p>Admin dashboard for managing users, ads, and payments will be available here.</p>
      <p>For now, contact WhatsApp: +256 776 686 096 for support.</p>
      <a href="/" class="back-btn">← Back to Jobs</a>
    </div>
  </div>
</body>
</html>
  `);
});

// Upload image route
app.post('/upload-ad-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path });
});

// Auth routes
app.post('/auth/signup', async (req, res) => {
  const { firstName, lastName, email, phone, password, country_interest, skills } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be 6+ characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash, country_interest, skills) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email, phone, hash, country_interest, skills]
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
  if (!email || !password) {
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

// Job API fetchers - with 5 second timeouts so nothing hangs
async function fetchAdzunaJobs(countryCode, countryName, query) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=20&content-type=application/json&max_days_old=30&what=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.log(`Adzuna ${countryCode} failed:`, response.status);
      return [];
    }
    const data = await response.json();
    console.log(`Adzuna ${countryCode} returned:`, data.count || 0);
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
    console.log('Adzuna error:', err.message);
    return [];
  }
}

async function fetchJSearchJobs(query, location) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&num_pages=1&date_posted=month`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      console.log(`JSearch ${location} failed:`, response.status);
      return [];
    }
    const data = await response.json();
    console.log(`JSearch ${location} returned:`, data.data?.length || 0);
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
    console.log('JSearch error:', err.message);
    return [];
  }
}

async function fetchRemotiveJobs(query) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      console.log('Remotive failed:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('Remotive returned:', data.jobs?.length || 0);
    return (data.jobs || []).slice(0, 15).map(j => ({
      title: j.title,
      company: j.company_name,
      location: 'Remote',
      country: 'Global',
      url: j.url,
      date_posted: j.publication_date,
      source: 'Remotive'
    }));
  } catch (err) {
    console.log('Remotive error:', err.message);
    return [];
  }
}

// Jobs route - HARD 8 SECOND TIMEOUT + FALLBACK DEMO JOBS
app.get('/jobs', async (req, res) => {
  try {
    const query = req.query.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR driver';
    const recentDays = req.query.recent === 'all' ? 0 : parseInt(req.query.recent) || 30;
    console.log('=== /jobs called === Query:', query, 'Recent:', recentDays);

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 8000)
    );

    const countries = [
      { code: 'ug', name: 'Uganda' },
      { code: 'ke', name: 'Kenya' },
      { code: 'ae', name: 'UAE' },
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'gb', name: 'UK' },
      { code: 'in', name: 'India' },
      { code: 'tz', name: 'Tanzania' },
      { code: 'rw', name: 'Rwanda' },
      { code: 'ca', name: 'Canada' },
      { code: 'us', name: 'USA' }
    ];

    let allJobs = [];
    const promises = [];
    
    // Only 2 APIs to avoid timeout - JSearch + Adzuna
    for (let i = 0; i < countries.length; i++) {
      promises.push(fetchJSearchJobs(query, countries[i].name));
      promises.push(fetchAdzunaJobs(countries[i].code, countries[i].name, query));
    }
    promises.push(fetchRemotiveJobs(query));

    const results = await Promise.race([
      Promise.allSettled(promises),
      timeoutPromise
    ]);

    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value && r.value.length > 0) {
        allJobs.push(...r.value);
      }
    });

    allJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.url === job.url && j.title === job.title)
    );

    if (recentDays > 0) {
      const cutoff = Date.now() - recentDays * 24 * 60 * 1000;
      allJobs = allJobs.filter(j => !j.date_posted || new Date(j.date_posted).getTime() > cutoff);
    }

    allJobs.sort((a, b) => new Date(b.date_posted || 0) - new Date(a.date_posted || 0));
    console.log(`Total unique jobs from all APIs: ${allJobs.length}`);

    // FALLBACK: If no API jobs, show demo jobs so site isn't empty
    if (allJobs.length === 0) {
      console.log('All APIs failed. Showing fallback demo jobs.');
      allJobs = [
        {
          title: 'House Cleaner',
          company: 'Kampala Homes',
          location: 'Kampala, Uganda',
          country: 'Uganda',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20House%20Cleaner',
          date_posted: new Date().toISOString(),
          source: 'Demo'
        },
        {
          title: 'Nurse',
          company: 'Nairobi Hospital',
          location: 'Nairobi, Kenya',
          country: 'Kenya',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Nurse',
          date_posted: new Date(Date.now() - 86400000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Primary School Teacher',
          company: 'Dar es Salaam Academy',
          location: 'Dar es Salaam, Tanzania',
          country: 'Tanzania',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Teacher',
          date_posted: new Date(Date.now() - 172800000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Construction Helper',
          company: 'Dubai Builders',
          location: 'Dubai, UAE',
          country: 'UAE',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Construction%20Helper',
          date_posted: new Date(Date.now() - 259200000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Farm Worker',
          company: 'Kigali Farms Ltd',
          location: 'Kigali, Rwanda',
          country: 'Rwanda',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Farm%20Worker',
          date_posted: new Date(Date.now() - 345600000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Security Guard',
          company: 'London Security Services',
          location: 'London, UK',
          country: 'UK',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Security%20Guard',
          date_posted: new Date(Date.now() - 432000000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Hotel Receptionist',
          company: 'Mumbai Grand Hotel',
          location: 'Mumbai, India',
          country: 'India',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Receptionist',
          date_posted: new Date(Date.now() - 518400000).toISOString(),
          source: 'Demo'
        },
        {
          title: 'Truck Driver',
          company: 'Saudi Logistics Co',
          location: 'Riyadh, Saudi Arabia',
          country: 'Saudi Arabia',
          url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Truck%20Driver',
          date_posted: new Date(Date.now() - 604800000).toISOString(),
          source: 'Demo'
        }
      ];
    }

    res.json(allJobs.slice(0, 150));
  } catch (err) {
    console.error('/jobs fatal error:', err.message);
    // Return demo jobs even on timeout so page loads
    res.json([
      {
        title: 'House Cleaner',
        company: 'Kampala Homes',
        location: 'Kampala, Uganda',
        country: 'Uganda',
        url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20House%20Cleaner',
        date_posted: new Date().toISOString(),
        source: 'Demo'
      },
      {
        title: 'Nurse',
        company: 'Nairobi Hospital',
        location: 'Nairobi, Kenya',
        country: 'Kenya',
        url: 'https://wa.me/256776686096?text=Hi%2C%20interested%20in%20Nurse',
        date_posted: new Date(Date.now() - 86400000).toISOString(),
        source: 'Demo'
      }
    ]);
  }
});

// Ads routes with 3 second timeout
app.get('/ads', async (req, res) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB Timeout')), 3000)
    );
    const queryPromise = pool.query(`SELECT * FROM ads WHERE type = 'job' AND status = 'approved' ORDER BY created_at DESC`);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    res.json(result.rows);
  } catch (err) {
    console.error('/ads error:', err.message);
    res.json([]);
  }
});

app.get('/paid-ads', async (req, res) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB Timeout')), 3000)
    );
    const queryPromise = pool.query(`SELECT * FROM ads WHERE type = 'ad' AND status = 'approved' AND expires_at > NOW() ORDER BY created_at DESC`);
    const result = await Promise.race([queryPromise, timeoutPromise]);
    res.json(result.rows);
  } catch (err) {
    console.error('/paid-ads error:', err.message);
    res.json([]);
  }
});

// Payment routes
app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title || !company || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const tx_ref = 'jobai_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { title, company, location, phone, url, description, type: 'job', token };
  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
            headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref, amount: 200, currency: 'KES',
        redirect_url: `https://${req.get('host')}/payment-callback`,
        customer: { email: 'customer@jobai.com', phonenumber: phone || '0700000', name: company },
        customizations: { title: 'Job Post Payment', description: 'Pay 200 KES to post job on Jobai' }
      })
    });
    const data = await response.json();
    console.log('Flutterwave response:', JSON.stringify(data));
    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: data.message || 'Failed to create payment' });
    }
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment error: ' + err.message });
  }
});

app.post('/ads/post-free', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  try {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const token = crypto.randomBytes(16).toString('hex');
    await pool.query(
      `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [id, token, 'job', 'approved', title, company, location, phone, url, description, 'FREE']
    );
    res.json({ success: true, id, token });
  } catch (err) {
    console.error('Free post error:', err);
    res.status(500).json({ success: false, error: 'Failed to post' });
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
      headers: { 'Authorization': `Bearer ${FLW_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref, amount: AD_PRICE, currency: 'KES',
        redirect_url: `https://${req.get('host')}/payment-callback`,
        customer: { email: 'advertiser@jobai.com', name: business },
        customizations: { title: 'Sponsored Ad Payment', description: 'Pay ' + AD_PRICE + ' KES for 7 days ad' }
      })
    });
    const data = await response.json();
    console.log('Flutterwave ad response:', JSON.stringify(data));
    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: data.message || 'Failed to create payment' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment error: ' + err.message });
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
            `INSERT INTO ads (id, token, type, status, business, link, text, image, paymentref, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, jobData.token, 'ad', 'approved', jobData.business, jobData.link, jobData.text, jobData.image, transaction_id, expires]
          );
        } else {
          await pool.query(
            `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, paymentref, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
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
      `UPDATE ads SET title = COALESCE($1, title), location = COALESCE($2, location), company = COALESCE($3, company), description = COALESCE($4, description) WHERE id = $5 AND token = $6 AND type = 'job' RETURNING id`,
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
    const result = await pool.query(`DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'job' RETURNING id`, [id, token]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post('/paid-ads/edit', async (req, res) => {
  const { id, token, business, link, text } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET business = COALESCE($1, business), link = COALESCE($2, link), text = COALESCE($3, text) WHERE id = $4 AND token = $5 AND type = 'ad' RETURNING id`,
      [business][link][text][id][token]
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
    const result = await pool.query(`DELETE FROM ads WHERE id = $1 AND token = $2 AND type = 'ad' RETURNING id`, [id][token]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(PORT, function() {
  console.log('Jobai server running on port ' + PORT);
});
     
