const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Load Adzuna keys from Render environment variables
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jobai - Get Connected to Jobs & Workers</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #f5f7fa; 
      color: #333;
    }
    .hero { 
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); 
      color: white; 
      padding: 60px 20px; 
      text-align: center; 
    }
    .hero h1 { 
      font-size: 36px; 
      margin-bottom: 10px; 
      font-weight: 700;
    }
    .hero p { 
      font-size: 18px; 
      opacity: 0.95;
    }
    .container { 
      max-width: 1000px; 
      margin: 40px auto; 
      padding: 0 20px; 
    }
    .container h2 {
      margin-bottom: 20px;
      font-size: 28px;
      color: #1a1a1a;
    }
    .job-card { 
      background: white; 
      padding: 24px; 
      margin-bottom: 16px; 
      border-radius: 12px; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .job-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .job-card h3 { 
      margin: 0 0 8px 0; 
      color: #1a73e8;
      font-size: 20px;
    }
    .job-card p { 
      margin: 0 0 16px 0; 
      color: #666;
      font-size: 15px;
    }
    .loading { 
      text-align: center; 
      color: #666; 
      padding: 40px;
      font-size: 16px;
    }
    .error { 
      text-align: center; 
      color: #d32f2f; 
      padding: 40px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Get Connected to Jobs & Workers</h1>
    <p>AI-powered matching for Uganda, UAE, Canada, UK & Saudi Arabia</p>
  </div>

  <div class="container">
    <h2>Latest Jobs in Uganda</h2>
    <div id="jobs" class="loading">Loading jobs...</div>
  </div>

  <script>
    async function loadJobs() {
      try {
        const res = await fetch('/jobs');
        const jobs = await res.json();
        
        if (!jobs.length) {
          document.getElementById('jobs').innerHTML = '<div class="error">No jobs found right now. Check back later.</div>';
          return;
        }

        document.getElementById('jobs').innerHTML = jobs.map(j => \`
          <div class="job-card">
            <h3>\${j.title}</h3>
            <p>\${j.location} • \${j.company}</p>
          </div>
        \`).join('');
      } catch (e) {
        document.getElementById('jobs').innerHTML = '<div class="error">Failed to load jobs. Please refresh the page.</div>';
      }
    }
    loadJobs();
  </script>
</body>
</html>
  `);
});

app.get('/jobs', async (req, res) => {
  try {
    if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
      console.error('Missing Adzuna credentials');
      return res.json([]);
    }
    
    const url = \`https://api.adzuna.com/v1/api/jobs/ug/search/1?app_id=\${ADZUNA_APP_ID}&app_key=\${ADZUNA_API_KEY}&results_per_page=20&content-type=application/json\`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(\`Adzuna API error: \${response.status}\`);
    }
    
    const data = await response.json();
    
    const jobs = (data.results || []).map(j => ({
      title: j.title || 'Job Title',
      company: j.company?.display_name || 'Unknown Company',
      location: j.location?.display_name || 'Uganda'
    }));
    
    res.json(jobs);
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
