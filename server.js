import express from 'express';

const app = express();
const PORT = process.env.PORT || 10000;

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const AI_CHAT_URL = process.env.AI_CHAT_URL || 'https://your-ai-chat.onrender.com';
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_YOUR_KEY_HERE';

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JobAI Uganda</title>
  <script src="https://js.paystack.co/v1/inline.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    header { background: #111; color: white; padding: 16px; text-align: center; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .hero h1 { font-size: 28px; margin-bottom: 10px; }
    .hero p { font-size: 15px; opacity: 0.9; margin-bottom: 25px; }
    .pricing { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 600px; margin: 30px auto; padding: 0 20px; }
    .price-card { background: white; padding: 25px 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
    .price-card h3 { font-size: 18px; margin-bottom: 8px; }
    .price { font-size: 28px; font-weight: 700; color: #667eea; margin: 15px 0; }
    .price-card p { font-size: 13px; color: #666; margin-bottom: 20px; }
    .btn { padding: 12px 20px; border-radius: 10px; border: none; font-size: 15px; font-weight: 600; width: 100%; cursor: pointer; }
    .btn-seeker { background: #007bff; color: white; }
    .btn-employer { background: #28a745; color: white; }
    .container { max-width: 900px; margin: 30px auto; padding: 0 20px; }
    .job-card { background: white; padding: 16px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .job-card h3 { font-size: 16px; margin-bottom: 6px; }
    .job-card p { font-size: 14px; color: #666; }
    .apply-btn { margin-top: 10px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 8px; width: 100%; cursor: pointer; }
    .loading { text-align: center; padding: 40px; color: #666; }
    @media (max-width: 600px) { .pricing { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header><h2>JobAI Uganda</h2></header>
  
  <div class="hero">
    <h1>Get Connected to Jobs & Workers</h1>
    <p>AI-powered matching for Uganda, UAE, Canada, UK & Saudi Arabia</p>
  </div>

  <div class="pricing">
    <div class="price-card">
      <h3>For Job Seekers</h3>
      <div class="price">5,000 UGX</div>
      <p>One-time connection fee. Get AI CV rewrite, interview prep, and apply to jobs.</p>
      <button class="btn btn-seeker" onclick="paySeeker()">Get Connected</button>
    </div>
    
    <div class="price-card">
      <h3>For Employers</h3>
      <div class="price">20,000 UGX</div>
      <p>Post jobs, find workers, get AI-screened candidates instantly.</p>
      <button class="btn btn-employer" onclick="payEmployer()">Hire Workers</button>
    </div>
  </div>

  <div class="container">
    <h2 style="margin-bottom: 16px;">Latest Jobs in Uganda</h2>
    <div id="jobs" class="loading">Loading jobs...</div>
  </div>

  <script>
    function paySeeker() {
      let handler = PaystackPop.setup({
        key: '${PAYSTACK_PUBLIC_KEY}',
        email: prompt('Enter your email to continue:'),
        amount: 500000,
        currency: 'UGX',
        callback: function(response) {
          alert('Payment successful! Redirecting to AI...');
          window.location.href = '${AI_CHAT_URL}?role=seeker&ref=' + response.reference;
        },
        onClose: function() { alert('Payment cancelled'); }
      });
      handler.openIframe();
    }

    function payEmployer() {
      let handler = PaystackPop.setup({
        key: '${PAYSTACK_PUBLIC_KEY}',
        email: prompt('Enter your company email to continue:'),
        amount: 2000000,
        currency: 'UGX',
        callback: function(response) {
          alert('Payment successful! Redirecting to AI...');
          window.location.href = '${AI_CHAT_URL}?role=employer&ref=' + response.reference;
        },
        onClose: function() { alert('Payment cancelled'); }
      });
      handler.openIframe();
    }

    async function loadJobs() {
      try {
        const res = await fetch('/jobs');
        const jobs = await res.json();
        document.getElementById('jobs').innerHTML = jobs.map(j => `
          <div class="job-card">
            <h3>${j.title}</h3>
            <p>${j.location} • ${j.company} • ${j.salary}</p>
            <button class="apply-btn" onclick="alert('Pay 5,000 UGX connection fee first')">
              AI Apply
            </button>
          </div>
        `).join('');
      } catch (e) {
        document.getElementById('jobs').innerHTML = '<p>Failed to load jobs</p>';
      }
    }
    loadJobs();
  </script>
</body>
</html>

app.get('/jobs', async (req, res) => {
  try {
    const response = await fetch(
      \`https://api.adzuna.com/v1/api/jobs/ug/search/1?app_id=\${ADZUNA_APP_ID}&app_key=\${ADZUNA_APP_KEY}&results_per_page=10\`
    );
    const data = await response.json();
    
    const jobs = (data.results || []).map(j => ({
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      salary: j.salary_min ? \`UGX \${Math.round(j.salary_min * 3700).toLocaleString()}\` : 'Negotiable'
    }));
    
    res.json(jobs);
  } catch (err) {
    res.json([{ title: 'Error loading jobs', company: err.message, location: '', salary: '' }]);
  }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
