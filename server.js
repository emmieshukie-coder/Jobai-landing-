import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';

// In-memory storage for user ads
let userAds = [];

app.use(express.json());
app.use(express.static('public'));

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
    '.job-card { background: white; padding: 24px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; display: block; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 20px; }' +
    '.job-meta { margin: 0 0 12px 0; color: #666; font-size: 14px; }' +
    '.job-meta span { margin-right: 12px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.loading { text-align: center; color: #666; padding: 40px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 40px; }' +
    '.ad-form { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 32px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; }' +
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
    ' <h3>Advertise your job for free</h3>' +
    ' <input type="text" id="adTitle" placeholder="Job title" required>' +
    ' <input type="text" id="adCompany" placeholder="Company name" required>' +
    ' <input type="text" id="adLocation" placeholder="Location" required>' +
    ' <input type="url" id="adUrl" placeholder="Apply link" required>' +
    ' <textarea id="adDesc" placeholder="Short description" rows="3"></textarea>' +
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
    ' function filterJobs(jobs, days) {' +
    ' if (days === "all") return jobs;' +
    ' const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;' +
    ' return jobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);' +
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
    ' return "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"job-card\\"><span class=\\"country-tag user-ad-tag\\">Community</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><span class=\\"connect-btn\\">Apply Now</span></a>";' +
    ' }).join("");' +
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
    ' async function submitAd() {' +
    ' const data = {' +
    ' title: document.getElementById("adTitle").value,' +
    ' company: document.getElementById("adCompany").value,' +
    ' location: document.getElementById("adLocation").value,' +
    ' url: document.getElementById("adUrl").value,' +
    ' description: document.getElementById("adDesc").value' +
    ' };' +
    ' if (!data.title ||!data.company ||!data.location ||!data.url) {' +
    ' document.getElementById("adMsg").textContent = "Please fill all required fields.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' return;' +
    ' }' +
    ' const res = await fetch("/ads", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)});' +
    ' if (res.ok) {' +
    ' document.getElementById("adMsg").textContent = "Job posted successfully!";' +
    ' document.getElementById("adMsg").style.color = "green";' +
    ' document.getElementById("adTitle").value = "";' +
    ' document.getElementById("adCompany").value = "";' +
    ' document.getElementById("adLocation").value = "";' +
    ' document.getElementById("adUrl").value = "";' +
    ' document.getElementById("adDesc").value = "";' +
    ' loadUserAds();' +
    ' } else {' +
    ' document.getElementById("adMsg").textContent = "Failed to post job.";' +
    ' document.getElementById("adMsg").style.color = "red";' +
    ' }' +
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
  res.json(userAds.slice().reverse());
});

app.post('/ads', (req, res) => {
  const { title, company, location, url, description } = req.body;
  if (!title ||!company ||!location ||!url) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  userAds.push({
    title, company, location, url, description,
    date_posted: new Date().toISOString()
  });
  res.json({ success: true });
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
