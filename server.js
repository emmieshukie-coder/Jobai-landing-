import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import crypto from 'crypto';
import pkg from 'pg';

const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

// Use env vars only
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

// Neon Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table on startup
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
const AD_PRICE_KES = 500;
const AD_PRICE_UGX = 145000;
const JOB_PRICE_KES = 200;
const JOB_PRICE_UGX = 5800;
const AD_DURATION_DAYS = 7;

app.use(express.json());
app.use(express.static('public'));

// [HTML part unchanged - same as your last file]
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
    '.ad-form input,.ad-form textarea,.ad-form select { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
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
    '.price-label { font-size: 13px; color: #666; margin-bottom: 8px; }' +
    ' </style>' +
    '</head>' +
    '<body>' +
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
    ' <h3>Advertise your job</h3>' +
    ' <select id="adCountry" onchange="updateJobPrice()">' +
    ' <option value="UG">Uganda - UGX</option>' +
    ' <option value="KE">Kenya - KES</option>' +
    ' </select>' +
    ' <p class="price-label" id="jobPriceLabel">Price: 5800 UGX</p>' +
    ' <input type="text" id="adTitle" placeholder="Job title" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location" required>' +
    ' <input type="tel" id="adPhone" placeholder="Phone number for applicants">' +
    ' <input type="url" id="adUrl" placeholder="Apply link (optional)">' +
    ' <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>' +
    ' <button class="connect-btn" onclick="submitAd()">Pay & Post Job</button>' +
    ' <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <h2>Community Job Posts</h2>' +
    ' <div id="userAds" class="loading">Loading...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Sponsored Ads</h2>' +
    ' <div class="ad-form">' +
    ' <h3>Advertise here for 7 days</h3>' +
    ' <select id="adBizCountry" onchange="updateAdPrice()">' +
    ' <option value="UG">Uganda - UGX</option>' +
    ' <option value="KE">Kenya - KES</option>' +
    ' </select>' +
    ' <p class="price-label" id="adPriceLabel">Price: 145000 UGX</p>' +
    ' <input type="text" id="adBizName" placeholder="Business name" required>' +
    ' <input type="url" id="adLink" placeholder="Website or WhatsApp link" required>' +
    ' <input type="text" id="adText" placeholder="Short ad text" required>' +
    ' <input type="tel" id="adBizPhone" placeholder="Phone number (optional)">' +
    ' <input type="file" id="adImgFile" accept="image/*" capture="environment">' +
    ' <img id="imgPreview" class="img-preview" />' +
    ' <input type="hidden" id="adImgUrl">' +
    ' <button class="connect-btn" style="background:#f57c00;" onclick="submitPaidAd()">Pay & Run Ad</button>' +
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
    ' let allJobs = [];' +
    ' function updateJobPrice() {' +
    ' const country = document.getElementById("adCountry").value;' +
    ' document.getElementById("jobPriceLabel").textContent = country === "UG"? "Price: 5800 UGX" : "Price: 200 KES";' +
    ' }' +
    ' function updateAdPrice() {' +
    ' const country = document.getElementById("adBizCountry").value;' +
    ' document.getElementById("adPriceLabel").textContent = country === "UG"? "Price: 145000 UGX" : "Price: 500 KES";' +
    ' }' +
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
    ' const diff = Math.floor((now - date) / 1000 / 60 / 60 / 24);' +
    ' if (diff === 0) return "Today";' +
    ' if (diff === 1) return "1 day ago";' +
    ' return diff + " days ago";' +
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
    ' return "<div class=\\"job-card\\" style=\\"position:relative\\">"+actions+"<span class=\\"country-tag user-ad-tag\\">Community</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "Phone: " + j.phone : "") + "</p>" + buttons + "</div>";' +
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
    ' img +' +
    ' \'<h3>\' + ad.business + \'</h3>\' +' +
    ' \'<p>\' + ad.text + \'</p>\' +' +
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
    ' };' +
    ' const endpoint = type === "paid"? "/paid-ads/edit" : "/ads/edit";' +
    ' const res = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (result.success) {' +
    ' closeEdit();' +
    ' loadUserAds();' +
    ' loadPaidAds();' +
    ' alert("Updated successfully");' +
    ' } else {' +
    ' alert("Update failed");' +
    ' }' +
    ' }' +
    ' async function deleteAd(type, id, token) {' +
    ' if (!confirm("Delete this ad?")) return;' +
    ' const endpoint = type === "paid"? "/paid-ads/delete" : "/ads/delete";' +
    ' const res = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id, token})});' +
    ' const result = await res.json();' +
    ' if (result.success) {' +
    ' loadUserAds();' +
    ' loadPaidAds();' +
    ' alert("Deleted successfully");' +
    ' } else {' +
    ' alert("Delete failed");' +
    ' }' +
    ' }' +
    ' async function loadJobs() {' +
    ' const query = document.getElementById("searchInput").value || "cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant";' +
    ' const days = document.getElementById("dateFilter").value;' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"loading\\">Loading jobs...</div>";' +
    ' try {' +
    ' const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);' +
    ' allJobs = await res.json();' +
    ' renderJobs(allJobs);' +
    ' } catch (e) {' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"error\\">Failed to load jobs.</div>";' +
    ' }' +
    ' }' +
    ' async function loadUserAds() {' +
    ' const res = await fetch("/ads");' +
    ' const ads = await res.json();' +
    ' renderUserAds(ads);' +
    ' }' +
    ' async function loadPaidAds() {' +
    ' const res = await fetch("/paid-ads");' +
    ' const ads = await res.json();' +
    ' renderPaidAds(ads);' +
    ' }' +
    ' async function submitAd() {' +
    ' const country = document.getElementById("adCountry").value;' +
    ' const data = {' +
    ' title: document.getElementById("adTitle").value,' +
    ' company: document.getElementById("adCompany").value,' +
    ' location: document.getElementById("adLocation").value,' +
    ' phone: document.getElementById("adPhone").value,' +
    ' url: document.getElementById("adUrl").value,' +
    ' description: document.getElementById("adDesc").value,' +
    ' country: country' +
    ' };' +
    ' if (!data.title ||!data.company ||!data.location) {' +
    ' document.getElementById("adMsg").textContent = "Please fill title, company and location.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' document.getElementById("adMsg").textContent = "Redirecting to payment...";' +
    ' document.getElementById("adMsg").style.color = "blue";' +
    ' const res = await fetch("/ads/initiate-payment", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (result.payment_link) {' +
    ' window.location.href = result.payment_link;' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Payment failed. Try again.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' async function submitPaidAd() {' +
    ' const country = document.getElementById("adBizCountry").value;' +
    ' const data = {' +
    ' business: document.getElementById("adBizName").value,' +
    ' link: document.getElementById("adLink").value,' +
    ' text: document.getElementById("adText").value,' +
    ' image: document.getElementById("adImgUrl").value,' +
    ' phone: document.getElementById("adBizPhone").value,' +
    ' country: country' +
    ' };' +
    ' if (!data.business ||!data.link ||!data.text) {' +
    ' document.getElementById("adPayMsg").textContent = "Fill business, link and text.";' +
    ' document.getElementById("adPayMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' document.getElementById("adPayMsg").textContent = "Redirecting to payment...";' +
    ' document.getElementById("adPayMsg").style.color = "blue";' +
    ' const res = await fetch("/paid-ads/initiate-payment", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (result.payment_link) {' +
    ' window.location.href = result.payment_link;' +
    ' } else {' +
    ' document.getElementById("adPayMsg").textContent = "Payment failed. Try again.";' +
    ' document.getElementById("adPayMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' const urlParams = new URLSearchParams(window.location.search);' +
    ' if (urlParams.get("payment") === "success") {' +
    ' document.getElementById("adMsg").textContent = "Payment successful! Job posted.";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' loadUserAds();' +
    ' loadPaidAds();' +
    ' }' +
    ' if (urlParams.get("payment") === "failed") {' +
    ' document.getElementById("adMsg").textContent = "Payment failed or cancelled.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' document.getElementById("searchBtn").addEventListener("click", loadJobs);' +
    ' document.getElementById("dateFilter").addEventListener("change", loadJobs);' +
    ' document.getElementById("searchInput").addEventListener("keypress", function(e) {' +
    ' if (e.key === "Enter") loadJobs();' +
    ' });' +
    ' loadJobs();' +
    ' loadUserAds();' +
    ' loadPaidAds();' +
    ' updateJobPrice();' +
    ' updateAdPrice();' +
    ' </script>' +
    '</body>' +
    '</html>'
  );
});

app.post('/upload-ad-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path });
});

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

async function fetchAdzunaJobs(countryCode, countryName, query) {
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=5&content-type=application/json&max_days_old=7&what=${encodeURIComponent(query)}`;
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

app.get('/jobs', async (req, res) => {
  try {
    const query = req.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant';
    const recentDays = req.query.recent === 'all'? 'all' : parseInt(req.query.recent) || 7;

    const countries = [
      { code: 'ug', name: 'Uganda' },
      { code: 'ke', name: 'Kenya' },
      { code: 'tz', name: 'Tanzania' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'in', name: 'India' }
    ];

    let allJobs = [];
    for (let i = 0; i < countries.length; i++) {
      const jsearchJobs = await fetchJSearchJobs(query, countries[i].name);
      const adzunaJobs = await fetchAdzunaJobs(countries[i].code, countries[i].name, query);
      allJobs.push(...jsearchJobs,...adzunaJobs);
    }

    if (recentDays!== 'all') {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    res.json(allJobs.slice(0, 50));
  } catch (err) {
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
    console.error(err);
    res.json([]);
  }
});

app.get('/paid-ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'ad' AND status = 'approved' AND expires_at > NOW() ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description, country } = req.body;
  if (!title || !company || !location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const currency = country === 'UG' ? 'UGX' : 'KES';
  const amount = currency === 'UGX' ? JOB_PRICE_UGX : JOB_PRICE_KES;

  // Format phone to E.164
  let formattedPhone = phone || '';
  if (formattedPhone) {
    let digits = formattedPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    if (country === 'UG' && !digits.startsWith('256')) {
      digits = '256' + digits;
    }
    if (country === 'KE' && !digits.startsWith('254')) {
      digits = '254' + digits;
    }
    formattedPhone = '+' + digits;
  }

  const tx_ref = 'jobai_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { title, company, location, phone: formattedPhone, url, description, type: 'job', token, currency };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency,
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: {
          email: 'customer@jobai.com',
          phonenumber: formattedPhone,
          name: company
        },
        customizations: {
          title: 'Job Post Payment',
          description: `Pay ${amount} ${currency} to post job on Jobai`
        }
      })
    });

    const data = await response.json();
    console.log('Flutterwave response:', data);

    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: 'Failed to create payment', details: data });
    }
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment error', details: err.message });
  }
});

app.post('/paid-ads/initiate-payment', async (req, res) => {
  const { business, link, text, image, phone, country } = req.body;

  if (!business || !link || !text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const currency = country === 'UG' ? 'UGX' : 'KES';
  const amount = currency === 'UGX' ? AD_PRICE_UGX : AD_PRICE_KES;

  // Format phone to E.164
  let formattedPhone = phone || '';
  if (formattedPhone) {
    let digits = formattedPhone.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    if (country === 'UG' && !digits.startsWith('256')) {
      digits = '256' + digits;
    }
    if (country === 'KE' && !digits.startsWith('254')) {
      digits = '254' + digits;
    }
    formattedPhone = '+' + digits;
  }

  const tx_ref = 'ad_' + Date.now();
  const token = crypto.randomBytes(16).toString('hex');
  pendingPayments[tx_ref] = { business, link, text, image, type: 'ad', token, currency };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLW_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency,
        redirect_url: `https://jobai-landing.onrender.com/payment-callback`,
        customer: {
          email: 'advertiser@jobai.com',
          name: business,
          phonenumber: formattedPhone
        },
        customizations: {
          title: 'Sponsored Ad Payment',
          description: `Pay ${amount} ${currency} for 7 days ad`
        }
      })
    });

    const data = await response.json();
    console.log('Flutterwave response:', data);

    if (data.status === 'success') {
      res.json({ payment_link: data.data.link });
    } else {
      res.status(400).json({ error: 'Failed to create payment', details: data });
    }
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment error', details: err.message });
  }
});

// Flutterwave callback - verifies payment and saves to Postgres
app.get('/payment-callback', async (req, res) => {
  const { tx_ref, transaction_id, status } = req.query;
  const payment = pendingPayments[tx_ref];

  if (!payment) {
    return res.redirect('/?payment=failed');
  }

  try {
    if (status === 'successful' || status === 'completed') {
      const id = Date.now();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + AD_DURATION_DAYS);

      if (payment.type === 'job') {
        await pool.query(
          `INSERT INTO ads (id, token, type, status, title, company, location, phone, url, description, created_at, expires_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)`,
          [id, payment.token, 'job', 'approved', payment.title, payment.company, payment.location, 
           payment.phone, payment.url, payment.description, expiresAt]
        );
      } else {
        await pool.query(
          `INSERT INTO ads (id, token, type, status, business, link, text, image, paymentref, created_at, expires_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)`,
          [id, payment.token, 'ad', 'approved', payment.business, payment.link, payment.text, 
           payment.image, tx_ref, expiresAt]
        );
      }

      delete pendingPayments[tx_ref];
      res.redirect('/?payment=success');
    } else {
      res.redirect('/?payment=failed');
    }
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?payment=failed');
  }
});

// Edit and delete routes
app.post('/ads/edit', async (req, res) => {
  const { id, token, title, location, company, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE ads SET title=$1, location=$2, company=$3, description=$4 
       WHERE id=$5 AND token=$6 AND type='job'`,
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
      `DELETE FROM ads WHERE id=$1 AND token=$2 AND type='job'`,
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
      `UPDATE ads SET business=$1, link=$2, text=$3 
       WHERE id=$4 AND token=$5 AND type='ad'`,
      [title, location, description, id, token]
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
      `DELETE FROM ads WHERE id=$1 AND token=$2 AND type='ad'`,
      [id, token]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
