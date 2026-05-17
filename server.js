import express from 'express';
import dotenv from 'dotenv';
import Flutterwave from 'flutterwave-node-v3';
import crypto from 'crypto';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

let userAds = [];
let pendingPayments = new Map();

app.use(express.json());
app.use(express.static('public'));
app.use('/webhook', express.raw({type: 'application/json'}));

app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    ' <meta charset="UTF-8">' +
    ' <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    ' <title>Jobai - Get Connected to Jobs & Workers</title>' +
    ' <script src="https://checkout.flutterwave.com/v3.js"></script>' +
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
    '.job-card { background: white; padding: 24px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; display: block; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card.featured { border: 2px solid #ffc107; background: #fffdf5; }' +
    '.job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 20px; }' +
    '.job-meta { margin: 0 0 12px 0; color: #666; font-size: 14px; }' +
    '.job-meta span { margin-right: 12px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.featured-tag { background: #ffc107; color: #000; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.btn-group { display: flex; gap: 10px; flex-wrap: wrap; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.feature-btn { background: #ffc107; color: #000; }' +
    '.feature-btn:hover { background: #e0a800; }' +
    '.call-btn { background: #34a853; }' +
    '.call-btn:hover { background: #2d9147; }' +
    '.loading { text-align: center; color: #666; padding: 40px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 40px; }' +
    '.ad-form { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 32px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; }' +
    '.phone-display { color: #34a853; font-weight: 600; }' +
    ' </style>' +
    '</head>' +
    '<body>' +
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
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Trending Jobs</h2>' +
    ' <div id="jobs" class="loading">Loading jobs...</div>' +
    ' </div>' +
    ' <div class="section">' +
    ' <h2>Post a Job</h2>' +
    ' <div class="ad-form">' +
    ' <h3>Advertise your job for free</h3>' +
    ' <input type="text" id="adTitle" placeholder="Job title" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location" required>' +
    ' <input type="tel" id="adPhone" placeholder="Phone number for applicants">' +
    ' <input type="email" id="adEmail" placeholder="Your email for payment">' +
    ' <input type="url" id="adUrl" placeholder="Apply link (optional)">' +
    ' <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>' +
    ' <label><input type="checkbox" id="adFeatured"> Feature this job for 24h - $3</label>' +
    ' <button class="connect-btn" onclick="submitAd()">Post Job</button>' +
    ' <p id="adMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <h2>Community Job Posts</h2>' +
    ' <div id="userAds" class="loading">Loading...</div>' +
    ' </div>' +
    ' </div>' +
    ' <script>' +
    ' let allJobs = [];' +
    ' function timeAgo(dateStr) {' +
    ' if (!dateStr) return "";' +
    ' const date = new Date(dateStr);' +
    ' const now = new Date();' +
    ' const diff = Math.floor((now - date) / 1000 / 60 / 60 / 24);' +
    ' if (diff === 0) return "Today";' +
    ' if (diff === 1) return "1 day ago";' +
    ' return diff + " days ago";' +
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
    ' let featuredBadge = j.featured? "<span class=\\"source-tag featured-tag\\">Featured</span>" : "";' +
    ' return "<div class=\\"job-card ' + (j.featured? 'featured' : '') + '\\"><span class=\\"country-tag user-ad-tag\\">Community</span>' + featuredBadge + '<h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "Phone: " + j.phone : "") + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' async function submitAd() {' +
    ' const data = {' +
    ' title: document.getElementById("adTitle").value,' +
    ' company: document.getElementById("adCompany").value,' +
    ' location: document.getElementById("adLocation").value,' +
    ' phone: document.getElementById("adPhone").value,' +
    ' email: document.getElementById("adEmail").value,' +
    ' url: document.getElementById("adUrl").value,' +
    ' description: document.getElementById("adDesc").value,' +
    ' featured: document.getElementById("adFeatured").checked' +
    ' };' +
    ' if (!data.title ||!data.company ||!data.location) {' +
    ' document.getElementById("adMsg").textContent = "Please fill title, company and location.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' if (data.featured &&!data.email) {' +
    ' document.getElementById("adMsg").textContent = "Email required for featured posts.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' const res = await fetch("/ads", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' const result = await res.json();' +
    ' if (res.ok) {' +
    ' if (result.paymentLink) {' +
    ' FlutterwaveCheckout({' +
    ' public_key: "' + process.env.FLW_PUBLIC_KEY + '",' +
    ' tx_ref: result.tx_ref,' +
    ' amount: 3,' +
    ' currency: "USD",' +
    ' payment_options: "mobilemoneyuganda,mobilemoneyrwanda,mobilemoneyzambia,card",' +
    ' customer: {email: data.email, name: data.company},' +
    ' callback: function(data) { window.location.reload(); }' +
    ' });' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Job posted successfully!";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' loadUserAds();' +
    ' }' +
    ' document.getElementById("adTitle").value = "";' +
    ' document.getElementById("adCompany").value = "";' +
    ' document.getElementById("adLocation").value = "";' +
    ' document.getElementById("adPhone").value = "";' +
    ' document.getElementById("adEmail").value = "";' +
    ' document.getElementById("adUrl").value = "";' +
    ' document.getElementById("adDesc").value = "";' +
    ' document.getElementById("adFeatured").checked = false;' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Failed to post job.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
    ' }' +
    ' async function loadJobs() {' +
    ' const query = document.getElementById("searchInput").value || "cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant";' +
    ' const days = document.getElementById("dateFilter").value;' +
    ' document.getElementById("jobs").innerHTML = "<div class=\\"loading\\">Loading jobs...</div>";' +
    ' try {' +
    ' const res = await fetch("/jobs?query=" + encodeURIComponent(query) + "&recent=" + days);' +
    ' allJobs = await res.json();' +
    ' document.getElementById("jobs").innerHTML = allJobs.map(function(j) {' +
    ' return "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"job-card\\"><span class=\\"country-tag\\">" + j.country + "</span><span class=\\"source-tag\\">" + j.source + "</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span><span>•</span><span>" + timeAgo(j.date_posted) + "</span></p><span class=\\"connect-btn\\">Connect & Apply</span></a>";' +
    ' }).join("");' +
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
    ' </script>' +
    '</body>' +
    '</html>'
  );
});

// All your existing fetch functions stay the same
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

async function fetchBrighterMondayJobs(query) {
  try {
    const searchQuery = query + ' brighter monday';
    const url = `https://api.adzuna.com/v1/api/jobs/ug/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=5&content-type=application/json&max_days_old=7&what=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company?.display_name || 'Unknown Company',
      location: j.location?.display_name || 'Uganda',
      country: 'Uganda',
      url: j.redirect_url || '#',
      date_posted: j.created,
      source: 'Brighter Monday'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchIndeedJobs(query, location) {
  try {
    const url = `https://indeed12.p.rapidapi.com/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=1&limit=5`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'indeed12.p.rapidapi.com'
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company || 'Unknown Company',
      location: j.location || location,
      country: location,
      url: j.link || '#',
      date_posted: j.date,
      source: 'Indeed'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchNaukriJobs(query) {
  try {
    const url = `https://naukri-jobs-postings.p.rapidapi.com/api/jobs/search?keywords=${encodeURIComponent(query)}&location=India&page=1&limit=5`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'naukri-jobs-postings.p.rapidapi.com'
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company || 'Unknown Company',
      location: j.location || 'India',
      country: 'India',
      url: j.link || '#',
      date_posted: j.posted_at,
      source: 'Naukri'
    }));
  } catch (err) {
    return [];
  }
}

async function fetchBaytJobs(query) {
  try {
    const url = `https://bayt-jobs-postings.p.rapidapi.com/api/jobs/search?keywords=${encodeURIComponent(query)}&location=UAE&page=1&limit=5`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'bayt-jobs-postings.p.rapidapi.com'
      }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.jobs || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company || 'Unknown Company',
      location: j.location || 'UAE',
      country: 'UAE',
      url: j.link || '#',
      date_posted: j.posted_at,
      source: 'Bayt'
    }));
  } catch (err) {
    return [];
  }
}

app.get('/jobs', async (req, res) => {
  try {
    const query = req.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant';
    const recentDays = parseInt(req.query.recent) || 7;

    const countries = [
      { code: 'ug', name: 'Uganda' },
      { code: 'ke', name: 'Kenya' },
      { code: 'tz', name: 'Tanzania' },
      { code: 'rw', name: 'Rwanda' },
      { code: 'bi', name: 'Burundi' },
      { code: 'sd', name: 'Sudan' },
      { code: 'in', name: 'India' },
      { code: 'ae', name: 'United Arab Emirates' },
      { code: 'sa', name: 'Saudi Arabia' },
      { code: 'fr', name: 'France' },
      { code: 'bg', name: 'Bulgaria' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'ca', name: 'Canada' },
      { code: 'cn', name: 'China' },
      { code: 'tw', name: 'Taiwan' },
      { code: 'th', name: 'Thailand' }
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

    const brighterMondayJobs = await fetchBrighterMondayJobs(query);
    allJobs.push(...brighterMondayJobs);

    const indeedResults = await Promise.all(
      countries.map(c => fetchIndeedJobs(query, c.name))
    );
    indeedResults.forEach(arr => allJobs.push(...arr));

    const naukriJobs = await fetchNaukriJobs(query);
    allJobs.push(...naukriJobs);

    const baytJobs = await fetchBaytJobs(query);
    allJobs.push(...baytJobs);

    if (recentDays > 0) {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    res.json(allJobs.slice(0, 50));
  } catch (err) {
    res.json([]);
  }
});

app.get('/ads', (req, res) => {
  const now = new Date();
  const activeAds = userAds
   .filter(ad =>!ad.expires_at || new Date(ad.expires_at) > now)
   .sort((a, b) => (b.featured? 1 : 0) - (a.featured? 1 : 0));
  res.json(activeAds);
});

app.post('/ads', async (req, res) => {
  const { title, company, location, phone, email, url, description, featured } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const adId = Date.now().toString();
  const tx_ref = 'jobai_' + adId;

  const newAd = {
    id: adId,
    title, company, location,
    phone: phone || null,
    url: url || null,
    description,
    featured: false,
    expires_at: null,
    date_posted: new Date().toISOString()
  };

  userAds.push(newAd);

  if (featured && email) {
    pendingPayments.set(tx_ref, adId);
    return res.json({ success: true, paymentLink: true, tx_ref });
  }

  res.json({ success: true });
});

app.post('/webhook', async (req, res) => {
  const hash = crypto.createHmac('sha256', process.env.FLW_SECRET_KEY)
   .update(req.body)
   .digest('hex');

  if (hash!== req.headers['verif-hash']) {
    return res.status(401).send('Unauthorized');
  }

  const payload = JSON.parse(req.body.toString());

  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    const tx_ref = payload.data.tx_ref;
    const adId = pendingPayments.get(tx_ref);

    if (adId) {
      const ad = userAds.find(a => a.id === adId);
      if (ad) {
        ad.featured = true;
        ad.expires_at = new Date(Date.now() + 24*60*60*1000).toISOString();
      }
      pendingPayments.delete(tx_ref);
    }
  }

  res.status(200).send('OK');
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
