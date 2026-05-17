import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';

const PRICE_UGX = 2000;
const MTN_NUMBER = '0707880128';
const AIRTEL_NUMBER = '0776686096';
const WHATSAPP_NUMBER = '256707880128'; // Use 256 country code for WhatsApp links

// In-memory storage
let userAds = [];
let monthlyPosts = {}; // { "IP-YYYY-MM": { count: 1, paid: 0 } }

app.use(express.json());
app.use(express.static('public'));

// Helper: get IP and current month key
function getMonthKey(req) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return { key: `${ip}-${month}`, ip };
}

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
    '.hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 60px 20px; text-align: center; }' +
    '.hero h1 { font-size: 36px; margin-bottom: 10px; font-weight: 700; }' +
    '.hero p { font-size: 18px; opacity: 0.95; }' +
    '.container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }' +
    '.controls { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; }' +
    '.controls input,.controls select { padding: 10px 14px; border-radius: 8px; border: 1px solid #ddd; font-size: 14px; background: white; }' +
    '.controls input { flex: 1; min-width: 200px; }' +
    '.section { margin-bottom: 48px; }' +
    '.section h2 { margin: 0 0 20px 0; font-size: 26px; color: #1a1a1a; }' +
    '.job-card { background: white; padding: 24px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 20px; }' +
    '.job-meta { margin: 0 0 12px 0; color: #666; font-size: 14px; }' +
    '.job-meta span { margin-right: 12px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.paid-tag { background: #e8f5e9; color: #2e7d32; }' +
    '.btn-group { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.call-btn { background: #34a853; }' +
    '.call-btn:hover { background: #2d9147; }' +
    '.pay-btn { background: #9c27b0; }' +
    '.pay-btn:hover { background: #7b1fa2; }' +
    '.whatsapp-btn { background: #25D366; }' +
    '.whatsapp-btn:hover { background: #1ebe5a; }' +
    '.phone-display { color: #34a853; font-weight: 600; margin-top: 8px; display: none; }' +
    '.loading { text-align: center; color: #666; padding: 40px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 40px; }' +
    '.ad-form { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 32px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; }' +
    '.limit-msg { background: #fff3e0; color: #e65100; padding: 12px; border-radius: 8px; margin-bottom: 12px; display: none; }' +
    '.payment-box { background: #f3e5f5; padding: 16px; border-radius: 8px; margin-top: 12px; display: none; }' +
    ' </style>' +
    '</head>' +
    '<body>' +
    ' <div class="hero">' +
    ' <h1>Get Connected to Jobs & Workers</h1>' +
    ' <p>AI-powered matching for Uganda, UAE, Canada, UK & Saudi Arabia</p>' +
    ' </div>' +
    ' <div class="container">' +
    ' <div class="controls">' +
    ' <input type="text" id="searchInput" placeholder="Search jobs: developer, nurse, driver..." />' +
    ' <select id="dateFilter">' +
    ' <option value="7">Last 7 days</option>' +
    ' <option value="all">All time</option>' +
    ' <option value="3">Last 3 days</option>' +
    ' <option value="1">Last 24 hours</option>' +
    ' </select>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Trending Jobs</h2>' +
    ' <div id="jobs" class="loading">Loading jobs...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Post a Job</h2>' +
    ' <div class="ad-form">' +
    ' <h3>Advertise your job</h3>' +
    ' <div id="limitMsg" class="limit-msg">You used your 1 free job this month. Extra posts cost 2000 UGX each.</div>' +
    ' <input type="text" id="adTitle" placeholder="Job title" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location" required>' +
    ' <input type="tel" id="adPhone" placeholder="Phone number for applicants">' +
    ' <input type="url" id="adUrl" placeholder="Apply link (optional)">' +
    ' <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>' +
    ' <button class="connect-btn" id="postBtn" onclick="submitAd()">Post Job</button>' +
    ' <div id="paymentBox" class="payment-box">' +
    ' <p><strong>Payment required: 2000 UGX per post</strong></p>' +
    ' <p>Send to MTN: ' + MTN_NUMBER + ' or Airtel: ' + AIRTEL_NUMBER + '</p>' +
    ' <p>Use reference: <strong id="payRef"></strong></p>' +
    ' <div class="btn-group">' +
    ' <a href="https://wa.me/' + WHATSAPP_NUMBER + '" target="_blank" class="connect-btn whatsapp-btn">Send Receipt on WhatsApp</a>' +
    ' </div>' +
    ' <input type="text" id="txId" placeholder="Enter transaction ID after payment">' +
    ' <button class="connect-btn pay-btn" onclick="confirmPayment()">I Paid</button>' +
    ' </div>' +
    ' <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <h2>Community Job Posts</h2>' +
    ' <div id="userAds" class="loading">Loading...</div>' +
    ' </div>' +
    ' </div>' +
    ' <script>' +
    ' let allJobs = [];' +
    ' let pendingAd = null;' +
    ' let payRef = "";' +
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
    ' document.getElementById("userAds").innerHTML = ads.map(function(j, idx) {' +
    ' let buttons = "<div class=\\"btn-group\\">";' +
    ' if (j.url && j.url!== "#") {' +
    ' buttons += "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"connect-btn\\">Apply Now</a>";' +
    ' }' +
    ' if (j.phone) {' +
    ' buttons += "<button class=\\"connect-btn call-btn\\" onclick=\\"showPhone(' + idx + ')\\">Show Contact</button>";' +
    ' }' +
    ' buttons += "</div>";' +
    ' let phoneHtml = j.phone? "<p class=\\"phone-display\\" id=\\"phone-' + idx + '\\">Phone: <a href=\\"tel:' + j.phone + '\\" class=\\"connect-btn call-btn\\">Call " + j.phone + "</a></p>" : "";' +
    ' let paidBadge = j.paid? "<span class=\\"source-tag paid-tag\\">Promoted</span>" : "";' +
    ' return "<div class=\\"job-card\\"><span class=\\"country-tag user-ad-tag\\">Community</span>" + paidBadge + "<h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p>" + phoneHtml + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' function showPhone(idx) {' +
    ' document.getElementById("phone-" + idx).style.display = "block";' +
    ' event.target.style.display = "none";' +
    ' }' +
    ' async function checkLimit() {' +
    ' const res = await fetch("/ads/limit");' +
    ' const data = await res.json();' +
    ' if (!data.canPostFree) {' +
    ' document.getElementById("limitMsg").style.display = "block";' +
    ' }' +
    ' }' +
    ' async function submitAd() {' +
    ' const data = {' +
    ' title: document.getElementById("adTitle").value,' +
    ' company: document.getElementById("adCompany").value,' +
    ' location: document.getElementById("adLocation").value,' +
    ' phone: document.getElementById("adPhone").value,' +
    ' url: document.getElementById("adUrl").value,' +
    ' description: document.getElementById("adDesc").value' +
    ' };' +
    ' if (!data.title ||!data.company ||!data.location) {' +
    ' document.getElementById("adMsg").textContent = "Please fill title, company and location.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' const res = await fetch("/ads", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (result.status === "free") {' +
    ' document.getElementById("adMsg").textContent = "Job posted for free!";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' clearForm();' +
    ' loadUserAds();' +
    ' checkLimit();' +
    ' } else if (result.status === "pay") {' +
    ' pendingAd = data;' +
    ' payRef = result.ref;' +
    ' document.getElementById("payRef").textContent = payRef;' +
    ' document.getElementById("paymentBox").style.display = "block";' +
    ' document.getElementById("adMsg").textContent = "Payment required for this post.";' +
    ' document.getElementById("adMsg").style.color = "#f57c00";' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = result.error || "Failed to post job.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' async function confirmPayment() {' +
    ' const txId = document.getElementById("txId").value;' +
    ' if (!txId) { alert("Enter transaction ID"); return; }' +
    ' const res = await fetch("/ads/pay", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ad: pendingAd, ref: payRef, txId})});' +
    ' const result = await res.json();' +
    ' if (result.success) {' +
    ' document.getElementById("adMsg").textContent = "Payment received! Job posted.";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' document.getElementById("paymentBox").style.display = "none";' +
    ' clearForm();' +
    ' loadUserAds();' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Payment verification failed.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' function clearForm() {' +
    ' document.getElementById("adTitle").value = "";' +
    ' document.getElementById("adCompany").value = "";' +
    ' document.getElementById("adLocation").value = "";' +
    ' document.getElementById("adPhone").value = "";' +
    ' document.getElementById("adUrl").value = "";' +
    ' document.getElementById("adDesc").value = "";' +
    ' pendingAd = null;' +
    ' }' +
    ' async function loadJobs() {' +
    ' const query = document.getElementById("searchInput").value || "developer";' +
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
    ' document.getElementById("searchInput").addEventListener("input", loadJobs);' +
    ' document.getElementById("dateFilter").addEventListener("change", loadJobs);' +
    ' loadJobs();' +
    ' loadUserAds();' +
    ' checkLimit();' +
    ' </script>' +
    '</body>' +
    '</html>'
  );
});

// Check if user can post free
app.get('/ads/limit', (req, res) => {
  const { key } = getMonthKey(req);
  const data = monthlyPosts[key] || { count: 0, paid: 0 };
  res.json({ canPostFree: data.count === 0 });
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
    const query = req.query || 'developer';
    const recentDays = parseInt(req.query.recent) || 7;
    const countries = [
      { code: 'ug', name: 'Uganda' },
      { code: 'ae', name: 'United Arab Emirates' },
      { code: 'ca', name: 'Canada' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'sa', name: 'Saudi Arabia' }
    ];

    const jsearchResults = await Promise.all(
      countries.map(c => fetchJSearchJobs(query, c.name))
    );

    let allJobs = [];
    for (let i = 0; i < countries.length; i++) {
      if (jsearchResults[i].length > 0) {
        allJobs.push(...jsearchResults[i]);
      } else {
        const adzunaJobs = await fetchAdzunaJobs(countries[i].code, countries[i].name, query);
        allJobs.push(...adzunaJobs);
      }
    }

    if (recentDays > 0) {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    res.json(allJobs.slice(0, 15));
  } catch (err) {
    res.json([]);
  }
});

app.get('/ads', (req, res) => {
  res.json(userAds.filter(a => a.approved).slice().reverse());
});

app.post('/ads', (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { key } = getMonthKey(req);
  const data = monthlyPosts[key] || { count: 0, paid: 0 };

  if (data.count === 0) {
    // First post is free
    monthlyPosts[key] = { count: 1, paid: 0 };
    userAds.push({
      title, company, location, phone: phone || null, url: url || null, description,
      date_posted: new Date().toISOString(), approved: true, paid: false
    });
    return res.json({ status: 'free' });
  } else {
    // Need payment for extra posts
    const ref = 'JB' + Date.now();
    return res.json({ status: 'pay', ref });
  }
});

app.post('/ads/pay', (req, res) => {
  const { ad, ref, txId } = req.body;
  if (!ad ||!ref ||!txId) return res.status(400).json({ error: 'Invalid payment' });

  // TODO: Verify txId with MTN/Airtel API here
  // For now we auto-approve after user submits transaction ID

  const { key } = getMonthKey(req);
  monthlyPosts[key] = monthlyPosts[key] || { count: 1, paid: 0 };
  monthlyPosts[key].paid += 1;

  userAds.push({
...ad,
    date_posted: new Date().toISOString(),
    approved: true,
    paid: true,
    txId,
    ref
  });

  res.json({ success: true });
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
