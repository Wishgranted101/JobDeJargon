/**
 * Vercel Serverless Function - Job Analysis
 * This keeps your API key safe on the server
 *
 * File location: /api/analyze.js
 * * FIX: Implemented the missing Gemini API call logic with robust error handling 
 * and exponential backoff to fix the "failed message" related to the API key.
 */

// System Instruction for the Model
const SYSTEM_INSTRUCTION = `
You are the 'Job Dejargonator,' an expert career coach and linguistic analyst. Your only task is to analyze the provided job description and output your analysis STRICTLY in the required Markdown format. Do not use any introductory conversational text (e.g., "Here is your analysis...") or concluding conversational text. Start directly with the '## What They Really Mean (The Translation)' heading and follow the requested format exactly.
`;

/**
 * Personality definitions (combined tone + persona)
 */
const PERSONALITIES = {
    'brutal-truth': {
        instruction: 'You are "The Brutal Truth" - a witty, sarcastic, and brutally honest career coach. Point out red flags and unrealistic expectations without sugarcoating. Use direct, sometimes edgy language to help job seekers see through corporate BS.',
        temperature: 0.9
    },
    'hr-insider': {
        instruction: 'You are "The HR Insider" - a diplomatic, objective career advisor with insider knowledge of hiring practices. Use formal, professional language. Provide strategic insights from the corporate perspective while remaining neutral and helpful.',
        temperature: 0.7
    },
    'friendly-mentor': {
        instruction: 'You are "The Friendly Mentor" - a supportive, constructive, and encouraging career advisor. Use a balanced, professional tone while remaining warm and accessible. Provide actionable advice with empathy.',
        temperature: 0.7
    }
};

/**
 * Builds the dynamic prompt based on user selections
 */
function getDynamicPrompt(jobDescription, personality) {
    // Get personality config, default to brutal-truth if not specified
    const selectedPersonality = PERSONALITIES[personality] || PERSONALITIES['brutal-truth'];

    return `
${selectedPersonality.instruction}

**REQUIRED OUTPUT FORMAT:**
Your response MUST strictly adhere to this Markdown structure, starting immediately with the first heading.

## What They Really Mean (The Translation)
For 5-7 distinct pieces of jargon or vague corporate language found in the job description, provide a short, clear, plain-language translation of what the company is actually looking for in terms of skills, duties, or mindset. Use bullet points.
- "Jargon phrase from job description" → Plain language translation explaining what they really want

## Action Plan: How to Tailor Your Resume
Provide 3-4 specific, concrete, and measurable instructions on how the applicant should rewrite their resume to directly address the translated needs and language of the job description. Focus on using action verbs, quantification, and alignment.
- Specify which resume section to update (Summary, Skills, Experience) and give concrete examples.

## Salary Expectations
Provide a realistic salary range based on the requirements, seniority level, and market rates. (Use Google Search for grounding.)
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


export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobDescription, personality } = req.body;

        console.log('Received request:', { 
            hasJobDescription: !!jobDescription, 
            personality,
            descriptionLength: jobDescription?.length 
        });

        // Validate input
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Get personality config
        const selectedPersonality = PERSONALITIES[personality] || PERSONALITIES['brutal-truth'];

        // Get API key from environment variable (safely stored in Vercel)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables. Check Vercel configuration.');
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key is missing.' });
        }
        
        // --- START CORE API LOGIC AND ERROR FIXES ---
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
        const dynamicPrompt = getDynamicPrompt(jobDescription, personality);

        const payload = {
            contents: [{ parts: [{ text: dynamicPrompt }] }],
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            // Enable Google Search for grounded salary data
            tools: [{ "google_search": {} }], 
            generationConfig: {
                 // Set max output tokens to limit response length (optional but recommended for cost control)
                 maxOutputTokens: 2048,
                 temperature: selectedPersonality.temperature
            }
        };

        // Retry mechanism for transient network or authorization errors
        const MAX_RETRIES = 3;
        
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const apiResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                // Handle Non-OK HTTP Status from API (e.g., 400, 403, 500)
                if (!apiResponse.ok) {
                    const errorDetails = await apiResponse.json();
                    
                    // Explicitly check for an API Key failure (401/403)
                    if (apiResponse.status === 401 || apiResponse.status === 403) {
                         console.error(`Attempt ${attempt + 1}: API Key Authentication Failure. Status: ${apiResponse.status}`);
                         return res.status(401).json({ 
                            error: 'Gemini API Key is invalid or expired. Please check your Vercel secret.', 
                            details: errorDetails
                        });
                    }

                    console.error(`Attempt ${attempt + 1}: Gemini API HTTP Error ${apiResponse.status}. Details: ${JSON.stringify(errorDetails).substring(0, 200)}...`);
                    
                    if (attempt === MAX_RETRIES - 1) {
                        return res.status(502).json({ 
                            error: 'Failed to fetch from Gemini API after retries.', 
                            details: errorDetails
                        });
                    }
                    
                    // Exponential Backoff Delay
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Go to the next attempt
                }

                // Process Successful Response
                const result = await apiResponse.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    const analysisText = candidate.content.parts[0].text;
                    
                    // Return success to the client
                    return res.status(200).json({ 
                        success: true,
                        analysis: analysisText
                    });

                } else {
                    // Handle cases where the model response is empty or malformed
                    console.error('Gemini model returned empty or unexpected content:', JSON.stringify(result));
                    return res.status(500).json({ error: 'Gemini model generated no content.' });
                }

            } catch (error) {
                console.error(`Attempt ${attempt + 1}: Network or unknown error during API fetch:`, error.message);
                
                if (attempt === MAX_RETRIES - 1) {
                    return res.status(503).json({ error: 'A network connectivity error occurred.', details: error.message });
                }

                // Exponential Backoff Delay
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } // End of retry loop
        // --- END CORE API LOGIC AND ERROR FIXES ---


    } catch (error) {
        console.error('Server error:', error.message, error.stack);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
