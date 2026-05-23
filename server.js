import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Jobai Test</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px}' +
    '.container{max-width:800px;margin:0 auto}' +
    '.job-card{background:white;padding:20px;margin-bottom:16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);position:relative}' +
    '.job-card h3{margin:8px 0;color:#1a73e8;font-size:18px}' +
    '.job-meta{margin:0 0 14px 0;color:#666;font-size:14px}' +
    '.country-tag{display:inline-block;background:#e3f2fd;color:#1976d2;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:8px}' +
    '.source-tag{display:inline-block;background:#f5f5f5;color:#666;padding:4px 10px;border-radius:20px;font-size:11px;margin-left:6px}' +
    '.user-ad-tag{background:#fff3e0;color:#f57c00}' +
    '.section h2{margin:0 0 16px 0;font-size:24px}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
    '<div class="section">' +
    '<h2>Trending Jobs</h2>' +
    '<div id="jobs">Loading jobs...</div>' +
    '</div>' +
    '<div class="section">' +
    '<h2>Community Job Posts</h2>' +
    '<div id="userAds">Loading...</div>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'function timeAgo(dateStr){' +
    'if(!dateStr)return"";' +
    'const date=new Date(dateStr);' +
    'if(isNaN(date.getTime()))return"";' +
    'const now=new Date();' +
    'const diffMs=now-date;' +
    'const diffDay=Math.floor(diffMs/(1000*60*60*24));' +
    'if(diffDay>2)return"";' +
    'if(diffMs<0)return"";' +
    'const diffSec=Math.floor(diffMs/1000);' +
    'const diffMin=Math.floor(diffSec/60);' +
    'const diffHr=Math.floor(diffMin/60);' +
    'if(diffSec<60)return"just now";' +
    'if(diffMin<60)return diffMin+"m ago";' +
    'if(diffHr<24)return diffHr+"h ago";' +
    'if(diffDay===1)return"1d ago";' +
    'return diffDay+"d ago";' +
    '}' +
    'function renderJobs(jobs){' +
    'if(!jobs.length){document.getElementById("jobs").innerHTML="<div>No jobs found.</div>";return}' +
    'document.getElementById("jobs").innerHTML=jobs.map(j=>"' +
    '<div class=\\"job-card\\">' +
    '<span class=\\"country-tag\\">"+j.country+"</span>' +
    '<span class=\\"source-tag\\">"+j.source+"</span>' +
    '<h3>"+j.title+"</h3>' +
    '<p class=\\"job-meta\\"><span>"+j.location+"</span> • <span>"+j.company+"</span> • <span>"+timeAgo(j.date_posted)+"</span></p>' +
    '</div>'
    ).join("")' +
    '}' +
    'function renderUserAds(ads){' +
    'if(!ads.length){document.getElementById("userAds").innerHTML="<div>No community posts yet.</div>";return}' +
    'document.getElementById("userAds").innerHTML=ads.map(j=>{' +
    'let timeHtml=timeAgo(j.created_at)?\'<span class="source-tag">\'+timeAgo(j.created_at)+\'</span>\':"";' +
    'return"<div class=\\"job-card\\">"+
    '<span class=\\"country-tag user-ad-tag\\">Community</span>"+timeHtml+
    '<h3>"+j.title+"</h3>"+
    '<p class=\\"job-meta\\"><span>"+j.location+"</span> • <span>"+j.company+"</span></p>"+
    '<p>"+(j.description||"")+"</p>"+
    '</div>' +
    '}).join("")' +
    '}' +
    'async function loadJobs(){' +
    'try{' +
    'const res=await fetch("/jobs");' +
    'const jobs=await res.json();' +
    'renderJobs(jobs)' +
    '}catch(e){document.getElementById("jobs").innerHTML="Failed to load jobs"}' +
    '}' +
    'async function loadUserAds(){' +
    'const res=await fetch("/ads");' +
    'const ads=await res.json();' +
    'renderUserAds(ads)' +
    '}' +
    'loadJobs();' +
    'loadUserAds();' +
    '</script>' +
    '</body>' +
    '</html>'
  );
});

// Mock jobs endpoint for testing
app.get('/jobs', async (req, res) => {
  res.json([
    {
      title: "Nurse Needed",
      company: "City Hospital",
      location: "Nairobi",
      country: "Kenya",
      source: "Adzuna",
      date_posted: new Date().toISOString()
    },
    {
      title: "Teacher",
      company: "Green School",
      location: "Kampala",
      country: "Uganda",
      source: "JSearch",
      date_posted: new Date(Date.now() - 2*60*60*1000).toISOString()
    },
    {
      title: "Old Job",
      company: "Old Corp",
      location: "Dar",
      country: "Tanzania",
      source: "Jooble",
      date_posted: new Date(Date.now() - 5*24*60*60*1000).toISOString()
    }
  ]);
});

// Get approved job ads from DB
app.get('/ads', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ads WHERE type = 'job' AND status = 'approved' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
