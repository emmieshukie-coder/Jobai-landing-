import dotenv from 'dotenv';
dotenv.config();
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const ADZUNA_APP_ID = 'cd82aca8';
const ADZUNA_API_KEY = '39952eab2d2de243ff1ceffc7dc36478';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '  <meta charset="UTF-8">' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '  <title>Jobai - Get Connected to Jobs & Workers</title>' +
    '  <style>' +
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 0; background: #f5f7fa; color: #333; }' +
    '    .hero { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); color: white; padding: 60px 20px; text-align: center; }' +
    '    .hero h1 { font-size: 36px; margin-bottom: 10px; font-weight: 700; }' +
    '    .hero p { font-size: 18px; opacity: 0.95; }' +
    '    .container { max-width: 1000px; margin: 40px auto; padding: 0 20px; }' +
    '    .container h2 { margin-bottom: 20px; font-size: 28px; color: #1a1a1a; }' +
    '    .job-card { background: white; padding: 24px; margin-bottom: 16px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: inherit; display: block; }' +
    '    .job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }' +
    '    .job-card h3 { margin: 0 0 8px 0; color: #1a73e8; font-size: 20px; }' +
    '    .job-card p { margin: 0 0 16px 0; color: #666; font-size: 15px; }' +
    '    .country-tag { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }' +
    '    .connect-btn { display: inline-block; background: #1a73e8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; }' +
    '    .connect-btn:hover { background: #1557b0; }' +
    '    .loading { text-align: center; color: #666; padding: 40px; font-size: 16px; }' +
    '    .error { text-align: center; color: #d32f2f; padding: 40px; }' +
    '  </style>' +
    '</head>' +
    '<body>' +
    '  <div class="hero">' +
    '    <h1>Get Connected to Jobs & Workers</h1>' +
    '    <p>AI-powered matching for Uganda, UAE, Canada, UK & Saudi Arabia</p>' +
    '  </div>' +
    '  <div class="container">' +
    '    <h2>Trending Jobs Across 5 Countries</h2>' +
    '    <div id="jobs" class="loading">Loading jobs...</div>' +
    '  </div>' +
    '  <script>' +
    '    async function loadJobs() {' +
    '      try {' +
    '        const res = await fetch("/jobs");' +
    '        const jobs = await res.json();' +
    '        if (!jobs.length) {' +
    '          document.getElementById("jobs").innerHTML = "<div class=\\"error\\">No jobs found right now. Check back later.</div>";' +
    '          return;' +
    '        }' +
    '        document.getElementById("jobs").innerHTML = jobs.map(function(j) {' +
    '          return "<a href=\\"" + j.url + "\\" target=\\"_blank\\" class=\\"job-card\\"><span class=\\"country-tag\\">" + j.country + "</span><h3>" + j.title + "</h3><p>" + j.location + " • " + j.company + "</p><span class=\\"connect-btn\\">Connect & Apply</span></a>";' +
    '        }).join("");' +
    '      } catch (e) {' +
    '        document.getElementById("jobs").innerHTML = "<div class=\\"error\\">Failed to load jobs. Please refresh the page.</div>";' +
    '      }' +
    '    }' +
    '    loadJobs();' +
    '  </script>' +
    '</body>' +
    '</html>'
  );
});

async function fetchJobsForCountry(country) {
  try {
    const url = 'https://api.adzuna.com/v1/api/jobs/' + country + '/search/1?app_id=' + ADZUNA_APP_ID + '&app_key=' + ADZUNA_API_KEY + '&results_per_page=5&content-type=application/json';
    const response = await fetch(url);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.results || []).map(function(j) {
      return {
        title: j.title || 'Job Title',
        company: j.company?.display_name || 'Unknown Company',
        location: j.location?.display_name || country.toUpperCase(),
        country: country.toUpperCase(),
        url: j.redirect_url || '#'
      };
    });
  } catch (err) {
    console.error('Error fetching ' + country + ':', err);
    return [];
  }
}

app.get('/jobs', async (req, res) => {
  try {
    const countries = ['ug', 'ae', 'ca', 'gb', 'sa'];
    const results = await Promise.all(countries.map(fetchJobsForCountry));
    
    const allJobs = results.flat().slice(0, 15);
    res.json(allJobs);
  } catch (err) {
    console.error('Jobs fetch error:', err);
    res.json([]);
  }
});

app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});
