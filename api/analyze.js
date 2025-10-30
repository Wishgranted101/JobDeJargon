/**
 * Vercel Serverless Function - Job Analysis
 * File location: /api/analyze.js
 */

// System Instruction for the Model
const SYSTEM_INSTRUCTION = `
You are the 'Job Dejargonator,' an expert career coach and linguistic analyst. Your only task is to analyze the provided job description and output your analysis STRICTLY in the required Markdown format. Do not use any introductory conversational text (e.g., "Here is your analysis...") or concluding conversational text. Start directly with the '## What They Really Mean (The Translation)' heading and follow the requested format exactly.
`;

/**
 * Builds the dynamic prompt based on user selections
 */
function getDynamicPrompt(jobDescription, tone, persona) {
    const toneInstructions = {
        'snarky': 'Use a witty, sarcastic, and brutally honest tone. Point out red flags and unrealistic expectations.',
        'professional': 'Use a balanced, constructive, and professional tone. Provide objective analysis.',
        'formal': 'Use a formal, structured, and diplomatic tone. Use precise and professional language throughout.'
    };

    const personaInstructions = {
        'brutally-honest': 'Act as a no-nonsense career coach who tells it like it is.',
        'friendly-mentor': 'Act as a supportive mentor who provides encouraging guidance.',
        'hr-insider': 'Act as an HR professional with insider knowledge of hiring practices.',
        'corporate-translator': 'Act as a neutral translator who decodes corporate jargon objectively.'
    };

    const selectedTone = toneInstructions[tone] || toneInstructions['professional'];
    const selectedPersona = personaInstructions[persona] || personaInstructions['friendly-mentor'];

    return `
${selectedPersona} ${selectedTone}

**REQUIRED OUTPUT FORMAT:**
Your response MUST strictly adhere to this Markdown structure, starting immediately with the first heading.

## What They Really Mean (The Translation)
For 5-7 distinct pieces of jargon or vague corporate language found in the job description, provide a short, clear, plain-language translation of what the company is actually looking for in terms of skills, duties, or mindset. Use bullet points.
- "Jargon phrase from job description" → Plain language translation explaining what they really want

## Action Plan: How to Tailor Your Resume
Provide 3-4 specific, concrete, and measurable instructions on how the applicant should rewrite their resume to directly address the translated needs and language of the job description. Focus on using action verbs, quantification, and alignment.
- Specify which resume section to update (Summary, Skills, Experience) and give concrete examples.

## Salary Expectations
Provide a realistic salary range based on the requirements, seniority level, and market rates.
Format: $XX,XXX - $XX,XXX with brief justification

## Red Flags
List 2-4 warning signs or unrealistic expectations found in the job description. Be specific about what's concerning and why.

## Bottom Line
Should you apply or run? Provide final advice in one paragraph.

---

**JOB DESCRIPTION TO ANALYZE:**
${jobDescription}

Provide your analysis now, starting with the "What They Really Mean" heading.
`;
}

/**
 * Core serverless function handler
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobDescription, tone, persona } = req.body;

        // Validate input
        if (!jobDescription || typeof jobDescription !== 'string') {
            return res.status(400).json({ error: 'Job description is required and must be a string.' });
        }

        // Get API key
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Build prompt
        const dynamicPrompt = getDynamicPrompt(jobDescription, tone || 'professional', persona || 'friendly-mentor');

        console.log('Calling Gemini API...');

        // Call Gemini API
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: dynamicPrompt
                    }]
                }],
                systemInstruction: {
                    parts: [{
                        text: SYSTEM_INSTRUCTION
                    }]
                },
                generationConfig: {
                    temperature: tone === 'snarky' ? 0.9 : 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        console.log('Gemini API response status:', response.status);

        // Handle errors
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to analyze job',
                details: errorText
            });
        }

        // Parse response
        const data = await response.json();
        
        // Extract analysis
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
            console.error('Unexpected API response structure:', JSON.stringify(data));
            return res.status(500).json({ 
                error: 'Unexpected response from AI',
                details: 'No analysis generated' 
            });
        }

        const analysis = data.candidates[0].content.parts[0].text;
        console.log('Analysis successful, length:', analysis.length);

        // Return success
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
