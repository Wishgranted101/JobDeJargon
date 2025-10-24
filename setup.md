# JobDeJargon Pro - Complete Setup Guide

This guide will walk you through setting up and deploying JobDeJargon Pro from scratch.

---

## 📋 Prerequisites

- A text editor (VS Code, Sublime, etc.)
- Git installed (optional but recommended)
- Google account (for Gemini API)
- Vercel account (free)

---

## 🎯 Step-by-Step Setup

### Step 1: Get the Project Files

Create a new folder called `jobdejargon-pro` with this structure:

```
jobdejargon-pro/
├── index.html
├── login.html
├── signup.html
├── job-analysis.html
├── resume-generator.html
├── dashboard.html
├── pro-features.html
├── settings.html
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   ├── job-analysis.js
│   ├── resume-generator.js
│   └── dashboard.js
├── .gitignore
├── vercel.json
├── package.json
└── README.md
```

Copy all the HTML, CSS, and JavaScript files into their respective locations.

---

### Step 2: Get Your Gemini API Key

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API Key"
   - Choose "Create API key in new project" (or select existing project)
   - Copy the generated API key
   - **Important:** Keep this key secure!

3. **Enable Gemini Pro API:**
   - The API should be enabled by default
   - If prompted, enable the Generative Language API

---

### Step 3: Configure the API Key

1. Open `js/api.js` in your text editor

2. Find this line:
   ```javascript
   GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
   ```

3. Replace with your actual API key:
   ```javascript
   GEMINI_API_KEY: 'AIzaSyC_your_actual_key_here',
   ```

4. Save the file

---

### Step 4: Test Locally

#### Option A: Simple File Open
- Double-click `index.html` to open in browser
- **Note:** Some features may not work due to CORS

#### Option B: Local Server (Recommended)

**Using Python (if installed):**
```bash
cd jobdejargon-pro
python -m http.server 8000
```

**Using Node.js:**
```bash
cd jobdejargon-pro
npx http-server
```

**Using PHP:**
```bash
cd jobdejargon-pro
php -S localhost:8000
```

Then open: http://localhost:8000

---

### Step 5: Test the Features

1. **Homepage:**
   - Open http://localhost:8000
   - Click "Try Free Analysis"

2. **Job Analysis:**
   - Paste a job description (try a real one from LinkedIn/Indeed)
   - Select tone and persona
   - Click "Analyze This Job"
   - Wait for AI response (may take 5-10 seconds)

3. **Test Free Tier Limit:**
   - Try analyzing 4 jobs
   - On the 4th attempt, you should see the Pro upgrade modal

4. **Test Resume Generation:**
   - After analyzing a job, click "Generate Resume"
   - Enter your experience
   - Generate and review output

5. **Test Dashboard:**
   - "Save" an analyzed job
   - Go to Dashboard
   - Verify the job appears in "Analyzed" section

---

### Step 6: Deploy to Vercel

#### Option A: GitHub + Vercel (Recommended)

1. **Initialize Git Repository:**
   ```bash
   cd jobdejargon-pro
   git init
   git add .
   git commit -m "Initial commit: JobDeJargon Pro MVP"
   ```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Create repository named `jobdejargon-pro`
   - **Don't** initialize with README (we already have one)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/jobdejargon-pro.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy on Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects settings
   - Click "Deploy"
   - Wait 30-60 seconds
   - Your site is live! 🎉

#### Option B: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd jobdejargon-pro
   vercel
   ```
   
4. **Follow prompts:**
   - Set up and deploy? Y
   - Scope: (select your account)
   - Link to existing project? N
   - Project name: jobdejargon-pro
   - Directory: ./
   - Deploy? Y

5. **Production Deploy:**
   ```bash
   vercel --prod
   ```

#### Option 3: Drag & Drop

1. **Zip your folder** (exclude node_modules if any)
2. Go to https://vercel.com/new
3. Drag and drop the folder
4. Deploy instantly!

---

### Step 7: Post-Deployment Checklist

- [ ] Visit your live URL (e.g., https://jobdejargon-pro.vercel.app)
- [ ] Test job analysis on live site
- [ ] Verify API key works in production
- [ ] Test on mobile devices
- [ ] Check all pages load correctly
- [ ] Share with test users

---

## 🔒 Security Reminder

### ⚠️ Important: API Key Security

**Current Setup (MVP):**
- API key is in `js/api.js` (client-side)
- This is **NOT secure for production**
- Anyone can view your API key in browser DevTools

**For Production:**
1. **Create a backend API** (Node.js, Python, etc.)
2. **Move API key to backend** environment variables
3. **Proxy Gemini requests** through your backend
4. **Add rate limiting** to prevent abuse

**Quick Backend Example (Node.js):**
```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/analyze', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY; // Secure!
  // Call Gemini API here
  // Return results to frontend
});

app.listen(3000);
```

---

## 🐛 Troubleshooting

### Issue: API Key Not Working

**Check:**
1. API key is correctly copied (no extra spaces)
2. Gemini Pro API is enabled in Google Cloud
3. Billing is set up (even for free tier)
4. Check browser console for error messages

**Solution:**
- Regenerate API key in Google AI Studio
- Check API quotas and limits
- Try the mock data fallback first

---

### Issue: Free Tier Limit Not Working

**Check:**
1. Open browser console
2. Type: `localStorage.getItem('userState')`
3. Verify `usageCount` is incrementing

**Solution:**
- Clear localStorage: `localStorage.clear()`
- Reload page and try again

---

### Issue: Dashboard Empty

**Check:**
1. Did you click "Save" after analyzing?
2. Is user "logged in"? (Check userState.isLoggedIn)
3. Check localStorage: `localStorage.getItem('savedJobs')`

**Solution:**
- Manually set: `userState.isLoggedIn = true; saveUserState();`
- Save an analysis again

---

### Issue: Vercel Deployment Fails

**Check:**
1. Correct file structure?
2. No syntax errors in code?
3. Vercel.json is valid JSON?

**Solution:**
- Check Vercel build logs
- Try deploying without vercel.json first
- Contact Vercel support

---

## 🚀 Next Steps

### Immediate Improvements

1. **Add Loading States:**
   - Better spinner animations
   - Progress indicators
   - Skeleton screens

2. **Error Handling:**
   - More descriptive error messages
   - Retry logic for failed requests
   - Offline mode

3. **UX Enhancements:**
   - Keyboard shortcuts
   - Tooltips and help text
   - Onboarding tour

### Production Readiness

1. **Backend Setup:**
   - Choose: Supabase, Firebase, or custom Node.js
   - Move API calls to backend
   - Implement proper authentication

2. **Database:**
   - Replace localStorage with real database
   - User profiles and data persistence
   - Data backup and export

3. **Payment Integration:**
   - Stripe or Paddle for Pro subscriptions
   - Trial period handling
   - Subscription management

4. **Analytics:**
   - Google Analytics or Plausible
   - Track feature usage
   - Monitor error rates

---

## 📊 Performance Tips

1. **Optimize Images:**
   ```bash
   # If you add images later
   npm install -g imageoptim-cli
   imageoptim assets/*.png
   ```

2. **Minify Code (Optional):**
   - For production, consider minifying JS/CSS
   - Use tools like UglifyJS or Terser

3. **CDN for Assets:**
   - Vercel automatically handles this
   - For images, consider Cloudinary

---

## 📝 Customization Guide

### Change Branding

**1. Update Title & Tagline:**
- Edit `index.html`: Change "JobDeJargon Pro"
- Edit all `<title>` tags across HTML files

**2. Update Colors:**
- Edit `css/style.css`: Modify `:root` variables
- Example: Change to purple theme:
  ```css
  --primary: #9333EA;
  --primary-dark: #7E22CE;
  ```

**3. Add Logo:**
- Create `assets/` folder
- Add your logo.png
- Update header in all HTML files:
  ```html
  <div class="logo">
      <img src="assets/logo.png" alt="Your Brand">
  </div>
  ```

### Modify AI Behavior

**Make it More/Less Snarky:**
- Edit `js/api.js` → `buildJobAnalysisPrompt()`
- Adjust tone instructions:
  ```javascript
  'snarky': 'Be even MORE sarcastic and blunt...'
  ```

**Add New Persona:**
- Edit `job-analysis.html`: Add button
- Edit `js/api.js`: Add persona instructions
- Example: "Tech Bro Translator"

**Adjust Output Length:**
```javascript
generationConfig: {
    maxOutputTokens: 2048, // Increase for longer output
}
```

---

## ✅ Launch Checklist

Before sharing with users:

- [ ] API key configured and working
- [ ] All pages tested manually
- [ ] Free tier limits working correctly
- [ ] Pro modal appears when expected
- [ ] Mobile responsive (test on phone)
- [ ] Dashboard save/load works
- [ ] Resume generator works
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] Custom domain set up (optional)
- [ ] Analytics installed
- [ ] Terms of Service added
- [ ] Privacy Policy added

---

## 🎉 You're Done!

Your JobDeJargon Pro MVP is now live and ready to use!

**Share your deployment:**
- Tweet about it
- Share on LinkedIn
- Post in developer communities
- Get feedback from users

**Need help?**
- Check browser console for errors
- Review Gemini API documentation
- Test with mock data fallback
- Reach out to community forums

---

**Happy job hunting!** 🚀
