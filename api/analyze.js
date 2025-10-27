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

        // Validate input
        if (!jobDescription) {
            return res.status(400).json({ error: 'Job description is required' });
        }

        // Get API key from environment variable (safely stored in Vercel)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
       
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Build the prompt
        const prompt = buildJobAnalysisPrompt(jobDescription, tone || 'professional', persona || 'friendly-mentor');

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
 * Build prompt for job analysis
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

    return `You are analyzing a job description. ${personaInstructions[persona] || personaInstructions['friendly-mentor']} ${toneInstructions[tone] || toneInstructions['professional']}

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
