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
        'corporate-translator': 'Act as a neutral translator who decodes corporate jargon.'
    };
    
    // Fallback in case selections are missing
    const selectedTone = tone || 'professional';
    const selectedPersona = persona || 'friendly-mentor';

    return `
Analyze the following job description. Apply the following instructions to guide your output:
- **Tone:** ${toneInstructions[selectedTone] || toneInstructions['professional']}
- **Persona:** ${personaInstructions[selectedPersona] || personaInstructions['friendly-mentor']}

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
            console.error('GEMINI_API_KEY not found in environment variables. Check Vercel configuration.');
            return res.status(500).json({ error: 'Server configuration error: Gemini API Key is missing.' });
        }
        
        // --- START CORE API LOGIC AND ERROR FIXES ---
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
        const dynamicPrompt = getDynamicPrompt(jobDescription, tone, persona);

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
