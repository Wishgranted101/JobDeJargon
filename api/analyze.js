/**
 * Vercel Serverless Function - Job Analysis
 * File location: /api/analyze.js
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try { 
        const { jobDescription, tone, persona } = req.body;

        // Validate input
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Get API key from environment variable (safely stored in Vercel)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Build the prompt using the Job Dejargonator format
        const prompt = buildJobDejargonatorPrompt(jobDescription, tone || 'professional', persona || 'friendly-mentor');

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', errorData);
            return res.status(response.status).json({ 
                error: 'Failed to analyze job',
                details: errorData 
            });
        }

        const data = await response.json();
        const analysis = data.candidates[0].content.parts[0].text;

        // Return the analysis
        return res.status(200).json({ 
            success: true,
            analysis: analysis 
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

/**
 * Build Job Dejargonator prompt with tone and persona
 */
function buildJobDejargonatorPrompt(jobDescription, tone, persona) {
    // Base system instruction - always included
    const systemInstruction = `You are the "Job Dejargonator," an expert career coach and linguistic analyst. Your role is to critically examine corporate jargon in a job description and translate it into clear, actionable sections.`;

    // Tone instructions - affects HOW the analysis is written
    const toneInstructions = {
        'snarky': 'Write with wit, sarcasm, and brutal honesty. Point out absurdities and unrealistic expectations with humor. Use phrases like "Translation: They want a unicorn for peanuts" or "In other words, prepare to be overworked."',
        'professional': 'Maintain a balanced, constructive, and professional tone. Be direct but diplomatic. Provide objective analysis without excessive criticism.',
        'formal': 'Use formal, structured, and diplomatic language. Maintain utmost professionalism. Avoid casual language or humor entirely.'
    };

    // Persona instructions - affects the PERSPECTIVE and expertise
    const personaInstructions = {
        'brutally-honest': 'Act as a no-nonsense career coach who tells it like it is. Don\'t sugarcoat red flags. Call out unrealistic expectations directly.',
        'friendly-mentor': 'Act as a supportive mentor who provides encouraging guidance while being honest about challenges. Balance criticism with constructive advice.',
        'hr-insider': 'Act as an HR professional with insider knowledge. Reveal what companies really mean behind the corporate speak. Explain hiring practices and expectations.',
        'corporate-translator': 'Act as a neutral, expert translator who objectively decodes corporate jargon into plain language. Focus purely on accurate translation without judgment.'
    };

    const selectedTone = toneInstructions[tone] || toneInstructions['professional'];
    const selectedPersona = personaInstructions[persona] || personaInstructions['friendly-mentor'];

    // Build the complete prompt
    return `${systemInstruction}

${selectedPersona} ${selectedTone}

Your output must STRICTLY follow this format:

## What They Really Mean (The Translation):
For 5-7 distinct pieces of jargon or vague corporate language found in the job description, provide a short, clear, plain-language translation of what the company is actually looking for. Use bullet points. Each bullet should:
- Quote the specific jargon from the job description
- Translate it into plain language
- Explain what skill, duty, or mindset they actually want

Example format:
• "Synergistic growth enabler" → They want a marketing/operations generalist who can wear multiple hats
• "Cross-functional deep dives" → You'll attend lots of meetings with different departments
• "High-velocity environment" → Expect tight deadlines and frequent pivots

## Action Plan: How to Tailor Your Resume:
Provide 3-4 specific, concrete, and MEASURABLE instructions on how the applicant should rewrite their resume to directly address the translated needs. Focus on:
- Using action verbs that match the job description
- Adding quantifiable metrics and achievements
- Aligning language with the company's terminology
- Specific sections to update (Summary, Skills, Experience)

Example format:
1. In your Summary section, replace generic phrases with: "Results-driven professional with 5+ years driving cross-functional collaboration..." Include metrics showing team size or projects managed.
2. Under Skills, add: "Agile methodologies, stakeholder management, data-driven decision making" - directly matching their requirements.
3. Rewrite 2-3 bullet points in your Experience section to include: "Led cross-functional initiatives resulting in X% growth" or "Drove strategic partnerships across Y verticals."

## Salary Expectations:
Provide a realistic salary range based on:
- The seniority level indicated by the requirements
- Market rates for this type of role
- Geographic considerations (if mentioned)
- Red flags that might indicate lower compensation

Format: $XX,XXX - $XX,XXX (with brief explanation)

## Red Flags:
List 2-4 warning signs or unrealistic expectations found in the job description. Be specific about what's concerning and why.

## Bottom Line:
One paragraph summary: Should they apply? What's the real opportunity here? Any final advice?

---

Now analyze this job description following the format above:

${jobDescription}`;
}
