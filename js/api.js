/**
 * API Configuration and Gemini Integration
 * Replace YOUR_GEMINI_API_KEY with actual API key from Google AI Studio
 */

const API_CONFIG = {
    GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
    GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    FREE_TIER_LIMIT: 3, // Free users limited to 3 analyses per day
};

/**
 * User state management (simulated for MVP)
 * In production, replace with actual authentication
 */
const userState = {
    isLoggedIn: false,
    isPro: false,
    usageCount: 0,
    savedJobs: [],
};

/**
 * Check if user is Pro tier
 */
function isProUser() {
    return userState.isPro;
}

/**
 * Check if free user has exceeded limits
 */
function checkFreeTierLimit() {
    if (!isProUser() && userState.usageCount >= API_CONFIG.FREE_TIER_LIMIT) {
        return false;
    }
    return true;
}

/**
 * Fetch job analysis from Gemini API
 * @param {string} jobDescription - The job posting text
 * @param {string} tone - Selected tone (snarky, professional, formal)
 * @param {string} persona - Selected AI persona
 * @returns {Promise<string>} - AI-generated analysis
 */
async function fetchJobAnalysis(jobDescription, tone = 'snarky', persona = 'brutally-honest') {
    // Check free tier limits
    if (!checkFreeTierLimit()) {
        showProModal('You\'ve reached your free analysis limit. Upgrade to Pro for unlimited analyses!');
        throw new Error('Free tier limit exceeded');
    }

    // Build the prompt with tone and persona
    const prompt = buildJobAnalysisPrompt(jobDescription, tone, persona);

    try {
        showSpinner();
        
        // Call Gemini API
        const response = await fetch(`${API_CONFIG.GEMINI_ENDPOINT}?key=${API_CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: tone === 'snarky' ? 0.9 : 0.7,
                    maxOutputTokens: isProUser() ? 2048 : 1024,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const analysis = data.candidates[0].content.parts[0].text;
        
        // Increment usage count
        userState.usageCount++;
        
        hideSpinner();
        return analysis;
        
    } catch (error) {
        hideSpinner();
        console.error('Error fetching job analysis:', error);
        
        // Fallback to mock data for demo purposes
        return getMockJobAnalysis(tone, persona);
    }
}

/**
 * Build prompt for job analysis based on tone and persona
 */
function buildJobAnalysisPrompt(jobDescription, tone, persona) {
    const toneInstructions = {
        'snarky': 'Be witty, sarcastic, and brutally honest. Point out red flags and unrealistic expectations.',
        'professional': 'Be balanced, constructive, and professional. Provide objective analysis.',
        'formal': 'Be formal, structured, and diplomatic. Use professional language throughout.'
    };

    const personaInstructions = {
        'brutally-honest': 'Act as a no-nonsense career coach who tells it like it is.',
        'friendly-mentor': 'Act as a supportive mentor who provides encouraging guidance.',
        'hr-insider': 'Act as an HR professional with insider knowledge of hiring practices.',
        'corporate-translator': 'Act as a neutral translator who decodes corporate jargon objectively.'
    };

    return `You are analyzing a job description. ${personaInstructions[persona]} ${toneInstructions[tone]}

Analyze this job description and provide:
1. **Real Job Title**: What this role actually is
2. **Key Responsibilities**: What you'll actually be doing
3. **Required Skills**: Must-haves vs nice-to-haves
4. **Red Flags**: Warning signs or unrealistic expectations
5. **Salary Expectations**: Realistic range based on requirements
6. **Bottom Line**: Should you apply or run?

Job Description:
${jobDescription}

Provide a clear, structured analysis:`;
}

/**
 * Generate resume/cover letter using Gemini
 */
async function generateResumeCoverLetter(type, jobDescription, userResume, tone = 'professional') {
    if (!checkFreeTierLimit()) {
        showProModal('Upgrade to Pro to generate and save unlimited resumes and cover letters!');
        throw new Error('Free tier limit exceeded');
    }

    const prompt = type === 'resume' 
        ? buildResumePrompt(jobDescription, userResume, tone)
        : buildCoverLetterPrompt(jobDescription, userResume, tone);

    try {
        showSpinner();
        
        const response = await fetch(`${API_CONFIG.GEMINI_ENDPOINT}?key=${API_CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates[0].content.parts[0].text;
        
        userState.usageCount++;
        hideSpinner();
        return content;
        
    } catch (error) {
        hideSpinner();
        console.error('Error generating content:', error);
        return getMockResumeCoverLetter(type);
    }
}

/**
 * Build resume generation prompt
 */
function buildResumePrompt(jobDescription, userResume, tone) {
    return `Generate a tailored resume based on the following:

Job Description:
${jobDescription}

Current Resume/Experience:
${userResume}

Tone: ${tone}

Create a professional resume that:
1. Highlights relevant skills from the job description
2. Quantifies achievements where possible
3. Uses action verbs
4. Matches keywords from the job posting
5. Is ATS-friendly

Format the resume with clear sections.`;
}

/**
 * Build cover letter generation prompt
 */
function buildCoverLetterPrompt(jobDescription, userResume, tone) {
    return `Generate a compelling cover letter based on:

Job Description:
${jobDescription}

Candidate Background:
${userResume}

Tone: ${tone}

Create a cover letter that:
1. Opens with a strong hook
2. Connects candidate's experience to job requirements
3. Shows enthusiasm for the role
4. Demonstrates knowledge of the company
5. Closes with a clear call to action

Keep it concise (300-400 words).`;
}

/**
 * Mock data for demo/fallback
 */
function getMockJobAnalysis(tone, persona) {
    const mockAnalyses = {
        'snarky': `
**Real Job Title**: "Unicorn Hunter with Reality Check"

**Key Responsibilities**:
• Doing the work of 3 people for the salary of 0.5
• Being "passionate" about increasing shareholder value
• Attending meetings that could've been emails
• "Wearing many hats" (translation: no clear job description)

**Required Skills**:
• Must-haves: 10 years experience in a 5-year-old technology
• Nice-to-haves: Ability to read minds, work for exposure

**Red Flags**:
🚩 "Fast-paced environment" = constant chaos
🚩 "Rockstar developer" = they want a hero to save their sinking ship
🚩 "Competitive salary" = they're definitely lowballing

**Salary Expectations**: 
They're offering $60K for what should be $90K+ based on requirements.

**Bottom Line**: 
Run. Unless you enjoy being overworked and underpaid while they call it "opportunity for growth."
        `,
        'professional': `
**Real Job Title**: Senior Software Engineer

**Key Responsibilities**:
• Lead development of web applications using modern frameworks
• Collaborate with cross-functional teams on product features
• Mentor junior developers and conduct code reviews
• Contribute to technical architecture decisions

**Required Skills**:
• Must-haves: 5+ years JavaScript, React, Node.js experience
• Nice-to-haves: AWS/cloud experience, TypeScript knowledge

**Red Flags**:
⚠️ Broad skill requirements may indicate understaffing
⚠️ "Fast-paced" suggests tight deadlines
✓ Clear tech stack is a positive sign

**Salary Expectations**: 
$90,000-$120,000 based on experience level and location

**Bottom Line**: 
Solid opportunity if team structure and work-life balance align with your goals. Ask about team size and sprint planning in interviews.
        `,
        'formal': `
**Real Job Title**: Software Development Engineer II

**Key Responsibilities**:
• Design, develop, and maintain software solutions
• Participate in full software development lifecycle
• Ensure code quality through testing and reviews
• Collaborate with stakeholders on requirements

**Required Skills**:
• Must-haves: Bachelor's degree or equivalent, 3-5 years experience
• Nice-to-haves: Advanced certifications, domain expertise

**Red Flags**:
• Extensive responsibility list may indicate resource constraints
• Compensation structure requires clarification

**Salary Expectations**: 
Market rate appears to be $85,000-$110,000 for this position level

**Bottom Line**: 
This represents a standard mid-level engineering position. Recommend inquiring about team dynamics, growth opportunities, and benefits package during interview process.
        `
    };

    return mockAnalyses[tone] || mockAnalyses['professional'];
}

function getMockResumeCoverLetter(type) {
    if (type === 'resume') {
        return `# John Doe
**Software Engineer** | john.doe@email.com | (555) 123-4567 | LinkedIn: /in/johndoe

## Professional Summary
Results-driven Software Engineer with 5+ years of experience building scalable web applications. Proven track record of delivering high-quality code and mentoring junior developers.

## Technical Skills
• **Languages**: JavaScript, TypeScript, Python, Java
• **Frameworks**: React, Node.js, Express, Next.js
• **Tools**: Git, Docker, AWS, Jenkins

## Professional Experience

**Senior Software Engineer** | Tech Company Inc. | 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Reduced API response time by 40% through optimization
• Mentored 3 junior engineers, improving team productivity by 25%

**Software Engineer** | Startup Co. | 2019 - 2021
• Built customer-facing dashboard using React and Node.js
• Implemented automated testing, increasing code coverage to 85%
• Collaborated with design team on UX improvements

## Education
**Bachelor of Science in Computer Science** | State University | 2019`;
    } else {
        return `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company. With over 5 years of experience developing scalable web applications and a proven track record of delivering high-quality solutions, I am excited about the opportunity to contribute to your team.

In my current role as Senior Software Engineer at Tech Company Inc., I have led the development of microservices architecture serving over 1 million users. My work has resulted in a 40% improvement in API response times and significant enhancements to system reliability. These experiences have prepared me well for the challenges outlined in your job description.

What particularly excites me about this opportunity is your company's commitment to innovation and excellence. Your focus on user-centric design aligns perfectly with my approach to software development, where I prioritize both technical excellence and user experience.

I am confident that my technical skills, leadership experience, and passion for building exceptional software make me an ideal candidate for this position. I would welcome the opportunity to discuss how I can contribute to your team's success.

Thank you for your consideration. I look forward to speaking with you soon.

Best regards,
John Doe`;
    }
}

/**
 * Show Pro upgrade modal
 */
function showProModal(message) {
    const modal = document.getElementById('proModal');
    const modalMessage = document.getElementById('proModalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.classList.add('active');
    }
}

/**
 * Close Pro modal
 */
function closeProModal() {
    const modal = document.getElementById('proModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Show loading spinner
 */
function showSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'block';
    }
}

/**
 * Hide loading spinner
 */
function hideSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, duration);
    }
}

/**
 * Save to localStorage (for MVP demo)
 */
function saveToLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load from localStorage
 */
function loadFromLocal(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

/**
 * Initialize user state from localStorage
 */
function initUserState() {
    const saved = loadFromLocal('userState');
    if (saved) {
        Object.assign(userState, saved);
    }
}

/**
 * Save user state to localStorage
 */
function saveUserState() {
    saveToLocal('userState', userState);
}

// Initialize on page load
if (typeof window !== 'undefined') {
    initUserState();
}
        
