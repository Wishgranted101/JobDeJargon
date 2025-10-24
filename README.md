# jobdejargon
JobDeJargon | Translate job listings from corporate jargon into brutally honest, plain-language explanations.

# JobDeJargon Pro

**"The co-pilot that tells you if this job is actually worth it."**

An AI-powered web application that translates job descriptions into brutally honest, human-readable summaries. Generate tailored resumes and cover letters, track your job applications, and get company insights—all powered by Google's Gemini AI.

---

## 🚀 Features

### Free Tier
- ✅ AI-powered job analysis with multiple tones (Snarky, Professional, Formal)
- ✅ 4 AI personas (Brutally Honest Coach, Friendly Mentor, HR Insider, Corporate Translator)
- ✅ Generate resumes and cover letters
- ✅ Job application dashboard
- ✅ Save analyzed jobs (requires account)
- ❌ Limited to 3 analyses per day

### Pro Tier ($9.99/month)
- ✅ Everything in Free
- ✅ Unlimited job analyses
- ✅ Save and export documents as PDF
- ✅ Company analysis with ratings, pros/cons, salary ranges
- ✅ 4 additional AI personas (Corporate Burnout Therapist, Recruiter Decoder, Career Strategist, Salary Negotiation Coach)
- ✅ Rich text editor
- ✅ Priority API access

---

## 📁 Project Structure

```
job-dejargon/
├── index.html              # Landing page
├── login.html              # Login page
├── signup.html             # Signup page
├── job-analysis.html       # Job analysis interface
├── resume-generator.html   # Resume/cover letter generator
├── dashboard.html          # Job application tracker
├── pro-features.html       # Pro features showcase
├── settings.html           # User settings
├── css/
│   └── style.css          # Global styles
├── js/
│   ├── api.js             # Gemini API integration
│   ├── job-analysis.js    # Job analysis logic
│   ├── resume-generator.js # Resume/cover letter logic
│   └── dashboard.js        # Dashboard logic
└── README.md              # This file
```

---

## 🛠️ Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure API Key

Open `js/api.js` and replace the placeholder:

```javascript
const API_CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE', // Replace this
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    FREE_TIER_LIMIT: 3,
};
```

### 3. Local Development

Simply open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

---

## 🌐 Deploy to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: JobDeJargon Pro MVP"
   git branch -M main
   git remote add origin https://github.com/yourusername/jobdejargon-pro.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it as a static site
   - Click "Deploy"

3. **Add Environment Variable (Optional):**
   - In Vercel dashboard → Settings → Environment Variables
   - Add `GEMINI_API_KEY` (if you want to keep it server-side later)

### Option 2: Direct Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to deploy
```

### Option 3: Vercel Drag & Drop

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag and drop your project folder
3. Deploy instantly

---

## 🔧 Configuration Options

### Enable Pro Features for Testing

In `js/api.js`, modify:

```javascript
const userState = {
    isLoggedIn: true,  // Set to true
    isPro: true,       // Set to true for Pro testing
    usageCount: 0,
    savedJobs: [],
};
```

### Adjust Free Tier Limits

In `js/api.js`:

```javascript
const API_CONFIG = {
    // ...
    FREE_TIER_LIMIT: 3, // Change this number
};
```

### Customize AI Behavior

Modify prompts in `js/api.js`:

- `buildJobAnalysisPrompt()` - Adjust job analysis instructions
- `buildResumePrompt()` - Customize resume generation
- `buildCoverLetterPrompt()` - Customize cover letter generation

---

## 🎨 Customization

### Branding

1. **Logo:** Replace text in header with image:
   ```html
   <div class="logo">
       <img src="assets/logo.png" alt="JobDeJargon Pro">
   </div>
   ```

2. **Colors:** Edit CSS variables in `css/style.css`:
   ```css
   :root {
       --primary: #4F46E5;  /* Change brand color */
       --primary-dark: #4338CA;
       /* ... */
   
