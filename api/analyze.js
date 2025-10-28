/**
 * Vercel Serverless Function - Job Analysis
 * This keeps your API key safe on the server
 *
 * File location: /api/analyze.js
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobDescription, tone, persona } = req.body;

        console.log('Received request:', { 
            hasJobDescription: !!jobDescription, 
            tone, 
            persona,
            descriptionLength: jobDescription?.length 
        });

        // Validate input
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Get API key from environment variable (safely stored in Vercel)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
       
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment');
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('API key found, building prompt...');

        // Build the prompt
        const prompt = buildJobAnalysisPrompt(jobDescription, tone || 'professional', persona || 'friendly-mentor');

        console.log('Calling Gemini API...');

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
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
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        console.log('Gemini API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', response.status, errorData);
            return res.status(500).json({
                error: 'Failed to analyze job',
                details: errorData,
                status: response.status
            });
        }

        const data = await response.json();
        console.log('Gemini response received, has candidates:', !!data.candidates);

        if (!data.candidates || !data.candidates[0]) {
            console.error('No candidates in response:', JSON.stringify(data));
            return res.status(500).json({ 
                error: 'Unexpected response from AI',
                details: 'No analysis generated' 
            });
        }

        const analysis = data.candidates[0].content.parts[0].text;
        console.log('Analysis successful, length:', analysis.length);

        // Return the analysis
        return res.status(200).json({
            success: true,
            analysis: analysis
        });

    } catch (error) {
        console.error('Server error:', error.message, error.stack);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

/**
 * Build prompt for job analysis - UPDATED VERSION
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

    return `You are the "Job Dejargonator," an expert career coach and linguistic analyst. Your role is to critically examine corporate jargon in a job description and translate it into clear, actionable sections.

${personaInstructions[persona] || personaInstructions['friendly-mentor']} ${toneInstructions[tone] || toneInstructions['professional']}

Your output must strictly follow this format:

**What They Really Mean (The Translation):**
For 5-7 distinct pieces of jargon or vague corporate language found in the job description, provide a short, clear, plain-language translation of what the company is actually looking for in terms of skills, duties, or mindset. Use bullet points.

Format each bullet as:
- "Jargon phrase from job description" → Plain language translation explaining what they really want

**Action Plan: How to Tailor Your Resume:**
Provide 3-4 specific, concrete, and measurable instructions on how the applicant should rewrite their resume to directly address the translated needs and language of the job description. Focus on using action verbs, quantification, and alignment.

Each instruction should:
- Specify which resume section to update (Summary, Skills, Experience)
- Include specific keywords or phrases to add
- Show how to quantify achievements with numbers/percentages
- Give concrete examples

**Salary Expectations:**
Provide a realistic salary range based on the requirements, seniority level, and market rates.
Format: $XX,XXX - $XX,XXX with brief justification

**Red Flags:**
List 2-4 warning signs or unrealistic expectations found in the job description. Be specific about what's concerning and why.

**Bottom Line:**
Should you apply or run? Provide final advice in one paragraph.

---

Job Description:
${jobDescription}

Provide a clear, structured analysis following the format above:`;
}
