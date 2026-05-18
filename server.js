import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = '96a9c08353msh17930481ae22721p150e24jsn49eed442acdc';
const FLW_SECRET_KEY = 'FLWSECK_TEST-db21f2fde386569639177dd0b2786d06-X';

let userAds = [];
let paidAds = [];
let pendingPayments = {};
const AD_PRICE = 500;
const AD_DURATION_DAYS = 7;

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
    '.job-card { background: white; padding: 20px; margin-bottom: 14px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; display: block; }' +
    '.job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '.job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 18px; }' +
    '.job-meta { margin: 0 0 10px 0; color: #666; font-size: 14px; }' +
    '.job-meta span { margin-right: 10px; }' +
    '.country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '.source-tag { display: inline-block; background: #f5f5f5; color: #666; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; margin-bottom: 8px; margin-left: 6px; }' +
    '.user-ad-tag { background: #fff3e0; color: #f57c00; }' +
    '.btn-group { display: flex; gap: 10px; flex-wrap: wrap; }' +
    '.connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; border: none; cursor: pointer; }' +
    '.connect-btn:hover { background: #1557b0; }' +
    '.call-btn { background: #34a853; }' +
    '.call-btn:hover { background: #2d9147; }' +
    '.loading { text-align: center; color: #666; padding: 30px; font-size: 16px; }' +
    '.error { text-align: center; color: #d32f2f; padding: 30px; }' +
    '.ad-form { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }' +
    '.ad-form input,.ad-form textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; font-family: inherit; }' +
    '.ad-form h3 { margin-top: 0; font-size: 18px; }' +
    '.phone-display { color: #34a853; font-weight: 600; }' +
    '.ad-unit { margin: 0; padding: 0; min-height: 0; }' +
    '.ad-unit ins.adsbygoogle[data-ad-status="unfilled"] { display: none!important; }' +
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
    ' <input type="url" id="adImg" placeholder="Image URL (optional)">' +
    ' <button class="connect-btn" style="background:#f57c00;" onclick="submitPaidAd()">Pay ' + AD_PRICE + ' KES & Run Ad</button>' +
    ' <p id="adPayMsg" style="margin-top:10px; font-size:14px;"></p>' +
    ' </div>' +
    ' <div id="paidAds" class="loading">Loading ads...</div>' +
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
    ' return "<div class=\\"job-card\\"><span class=\\"country-tag user-ad-tag\\">Community</span><h3>" + j.title + "</h3><p class=\\"job-meta\\"><span>" + j.location + "</span><span>•</span><span>" + j.company + "</span></p><p>" + (j.description || "") + "</p><p class=\\"phone-display\\">" + (j.phone? "Phone: " + j.phone : "") + "</p>" + buttons + "</div>";' +
    ' }).join("");' +
    ' }' +
    ' function renderPaidAds(ads) {' +
    ' if (!ads.length) {' +
    ' document.getElementById("paidAds").innerHTML = "<div class=\\"error\\">No sponsors yet.</div>";' +
    ' return;' +
    ' }' +
    ' document.getElementById("paidAds").innerHTML = ads.map(function(ad) {' +
    ' let img = ad.image? \'<img src="\' + ad.image + \'" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:10px;">\' : \'\';' +
    ' return \'<div class="job-card" style="border:2px solid #f57c00;">\' +' +
    ' \'<span class="country-tag user-ad-tag">Sponsored</span>\' +' +
    ' img +' +
    ' \'<h3>\' + ad.business + \'</h3>\' +' +
    ' \'<p>\' + ad.text + \'</p>\' +' +
    ' \'<a href="\' + ad.link + \'" target="_blank" class="connect-btn" style="background:#f57c00;">Visit</a>\' +' +
    ' \'</div>\';' +
    ' }).join("");' +
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
    ' const data = {' +
    ' business: document.getElementById("adBizName").value,' +
    ' link: document.getElementById("adLink").value,' +
    ' text: document.getElementById("adText").value,' +
    ' image: document.getElementById("adImg").value' +
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
    ' document.getElementById("searchInput").addEventListener("input", loadJobs);' +
    ' document.getElementById("dateFilter").addEventListener("change", loadJobs);' +
    ' loadJobs();' +
    ' loadUserAds();' +
    ' loadPaidAds();' +
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
    const query = req.query || 'cleaner OR helper OR maid OR nurse OR teacher OR engineer OR farmer OR manager OR shop attendant';
    const recentDays = parseInt(req.query.recent) || 7;

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

    if (recentDays > 0 && recentDays!== 'all') {
      const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
      allJobs = allJobs.filter(j => j.date_posted && new Date(j.date_posted).getTime() > cutoff);
    }

    res.json(allJobs.slice(0, 50));
  } catch (err) {
    res.json([]);
  }
});

app.get('/ads', (req, res) => {
  res.json(userAds.filter(ad => ad.status === 'approved').reverse());
});

app.get('/paid-ads', (req, res) => {
  const now = Date.now();
  const activeAds = paidAds.filter(ad =>
    ad.status === 'approved' && new Date(ad.expires_at).getTime() > now
  );
  res.json(activeAds.reverse());
});

app.post('/ads/initiate-payment', async (req, res) => {
  const { title, company, location, phone, url, description } = req.body;
  if (!title ||!company ||!location) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'jobai_' + Date.now();
  pendingPayments[tx_ref] = { title, company, location, phone, url, description, type: 'job' };

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
    res.status(500).json({ error: 'Payment error' });
  }
});

app.post('/paid-ads/initiate-payment', async (req, res) => {
  const { business, link, text, image } = req.body;
  if (!business ||!link ||!text) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tx_ref = 'ad_' + Date.now();
  pendingPayments[tx_ref] = { business, link, text, image, type: 'ad' };

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
        if (jobData.type === 'ad') {
          const expires = new Date();
          expires.setDate(expires.getDate() + AD_DURATION_DAYS);
          paidAds.push({
         ...jobData,
            status: 'approved',
            paymentRef: transaction_id,
            created_at: new Date().toISOString(),
            expires_at: expires.toISOString()
          });
        } else {
          userAds.push({
         ...jobData,
            status: 'approved',
            paymentRef: transaction_id,
            date_posted: new Date().toISOString()
          });
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
    res.redirect('/?payment=failed');
  }
});

app.get('/manual-approve/:txid', (req, res) => {
  const txid = req.params.txid;
  let jobData = null;
  let txRefKey = null;
  for (let key in pendingPayments) {
    jobData = pendingPayments[key];
    txRefKey = key;
    break;
  }

  if (!jobData) {
    return res.send('No pending job found. Pay again or check if server restarted.');
  }

  if (jobData.type === 'ad') {
    const expires = new Date();
    expires.setDate(expires.getDate() + AD_DURATION_DAYS);
    paidAds.push({
   ...jobData,
      status: 'approved',
      paymentRef: txid,
      created_at: new Date().toISOString(),
      expires_at: expires.toISOString()
    });
  } else {
    userAds.push({
   ...jobData,
      status: 'approved',
      paymentRef: txid,
      date_posted: new Date().toISOString()
    });
  }

  delete pendingPayments[txRefKey];
  res.send('Approved! Go back to the site and refresh.');
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
