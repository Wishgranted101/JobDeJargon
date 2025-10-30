/**
 * Vercel Serverless Function - Resume & Cover Letter Generator
 * File location: /api/generate-document.js
 */

const SYSTEM_INSTRUCTION = `
You are a professional career advisor and document writer. Your task is to create tailored, ATS-friendly resumes and cover letters that highlight the candidate's qualifications while matching the job requirements.

Key principles:
- Use action verbs and quantifiable achievements
- Optimize for Applicant Tracking Systems (ATS)
- Match keywords from the job description naturally
- Be concise and impactful
- Professional tone throughout
`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { type, jobDescription, userInput, jobAnalysis } = req.body;

        // Validate input
        if (!type || !jobDescription || !userInput) {
            return res.status(400).json({ 
                error: 'Missing required fields: type, jobDescription, userInput' 
            });
        }

        if (!['resume', 'cover-letter'].includes(type)) {
            return res.status(400).json({ 
                error: 'Invalid type. Must be "resume" or "cover-letter"' 
            });
        }

        // Get API key
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Build prompt
        const prompt = buildPrompt(type, jobDescription, userInput, jobAnalysis);

        // Call Gemini API
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(API_URL, {
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
                systemInstruction: {
                    parts: [{
                        text: SYSTEM_INSTRUCTION
                    }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to generate document',
                details: errorText
            });
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            console.error('Unexpected API response');
            return res.status(500).json({ 
                error: 'Unexpected response from AI' 
            });
        }

        const content = data.candidates[0].content.parts[0].text;

        return res.status(200).json({
            success: true,
            content: content,
            type: type
        });

    } catch (error) {
        console.error('Server error:', error.message);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * Build prompt based on document type
 */
function buildPrompt(type, jobDescription, userInput, jobAnalysis) {
    if (type === 'resume') {
        return buildResumePrompt(jobDescription, userInput, jobAnalysis);
    } else {
        return buildCoverLetterPrompt(jobDescription, userInput, jobAnalysis);
    }
}

/**
 * Build resume generation prompt
 */
function buildResumePrompt(jobDescription, currentResume, jobAnalysis) {
    return `
You are tasked with creating an ATS-optimized, tailored resume for the following job posting.

**JOB DESCRIPTION:**
${jobDescription}

**CANDIDATE'S CURRENT RESUME:**
${currentResume}

${jobAnalysis ? `**JOB ANALYSIS INSIGHTS:**\n${extractKeyInsights(jobAnalysis)}\n` : ''}

**YOUR TASK:**
Create a tailored version of the candidate's resume that:
1. Maintains all factual information (don't invent experience)
2. Rewords descriptions to match job keywords naturally
3. Emphasizes relevant skills and achievements
4. Uses strong action verbs (Led, Developed, Implemented, etc.)
5. Includes quantifiable results where possible
6. Is ATS-friendly (simple formatting, no graphics)
7. Prioritizes most relevant experience

**FORMAT:**
Return ONLY the resume text in this structure:
- Professional Summary (2-3 sentences highlighting relevant experience)
- Core Skills (bullet points of relevant technical/soft skills)
- Professional Experience (reverse chronological, with bullet achievements)
- Education
- Optional: Certifications, Awards, or Projects if relevant

Do not include any meta-commentary. Start directly with the resume content.
`;
}

/**
 * Build cover letter generation prompt
 */
function buildCoverLetterPrompt(jobDescription, experienceSummary, jobAnalysis) {
    return `
You are tasked with writing a compelling, professional cover letter for the following job posting.

**JOB DESCRIPTION:**
${jobDescription}

**CANDIDATE'S BACKGROUND:**
${experienceSummary}

${jobAnalysis ? `**JOB ANALYSIS INSIGHTS:**\n${extractKeyInsights(jobAnalysis)}\n` : ''}

**YOUR TASK:**
Write a tailored cover letter (3-4 paragraphs) that:
1. Opens with enthusiasm and mentions the specific role
2. Highlights 2-3 relevant achievements that match job requirements
3. Demonstrates knowledge of the company/role (based on job description)
4. Shows personality while remaining professional
5. Closes with a strong call to action

**FORMAT:**
Return ONLY the cover letter text in standard business letter format:
- Opening paragraph (express interest)
- 1-2 body paragraphs (relevant experience and skills)
- Closing paragraph (call to action)
- Professional sign-off

Use [Your Name], [Your Email], and [Your Phone] as placeholders for contact info.

Do not include "Dear Hiring Manager" or address - start directly with the opening paragraph.
Do not include any meta-commentary.
`;
}

/**
 * Extract key insights from job analysis
 */
function extractKeyInsights(analysis) {
    if (!analysis) return '';
    
    // Extract first 500 characters of key sections
    const sections = ['What They Really Mean', 'Action Plan', 'Red Flags'];
    let insights = '';
    
    sections.forEach(section => {
        const sectionMatch = analysis.match(new RegExp(`##\\s*${section}[\\s\\S]*?(?=##|$)`, 'i'));
        if (sectionMatch) {
            const sectionText = sectionMatch[0].substring(0, 300);
            insights += sectionText + '\n\n';
        }
    });
    
    return insights || 'No additional insights available.';
}
