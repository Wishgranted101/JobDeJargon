// API.js - Credit System + Daily Free Analysis
// Updated for simplified personality system
// COMPLETE VERSION with all helper functions

// Fetch job analysis with credit/daily free checking
async function fetchJobAnalysis(jobDescription, personality = 'brutal-truth') {
    // Check if user can analyze
    const canAnalyze = await canUserAnalyze();
    
    if (!canAnalyze.allowed) {
        if (canAnalyze.reason === 'not_logged_in') {
            showAuthModal();
            throw new Error('Authentication required');
        } else if (canAnalyze.reason === 'no_credits') {
            showBuyCreditsModal();
            throw new Error('No credits available');
        }
    }
    
    try {
        showSpinner();
        
        // Call serverless function with new personality parameter
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription,
                personality
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Deduct credit or mark daily free as used
        await useAnalysis();
        
        // Update UI to show new credit count
        updateUserUI();
        
        hideSpinner();
        return data.analysis;
        
    } catch (error) {
        hideSpinner();
        console.error('Error fetching job analysis:', error);
        showToast('Analysis failed. Please try again.');
        throw error;
    }
}

// Get demo analysis (no authentication required)
function getDemoAnalysis() {
    return `## What They Really Mean (The Translation):

• "Fast-paced environment" → You'll be constantly firefighting with tight deadlines and shifting priorities. Work-life balance? What's that?

• "Wear many hats" → Your actual job title is irrelevant. You'll be doing 3-4 jobs for the price of one, and none of them will be in your job description.

• "Self-starter who thrives with minimal supervision" → We don't have time to train you or provide guidance. Figure it out yourself or drown trying.

• "Competitive salary" → We'll pay you slightly above minimum wage and act like we're doing you a favor. "Competitive" with what, exactly? The Great Depression?

• "Dynamic team environment" → Office politics galore. Everyone's stressed, burned out, and passive-aggressive in Slack.

• "Opportunity for growth" → You'll grow alright - grow gray hair from stress. Actual promotions? Rare as unicorns.

• "Must be comfortable with ambiguity" → We have no idea what we're doing. Our strategy changes weekly. You'll get conflicting instructions from 5 different managers.

## Action Plan: How to Tailor Your Resume:

1. **Summary/Professional Profile:** Lead with "Results-driven professional with [X years] experience thriving in fast-paced, ambiguous environments." Add specific metrics: "Managed 15+ concurrent projects while reducing turnaround time by 30%."

2. **Skills Section:** Mirror their language exactly. Add: "Cross-functional collaboration, rapid prototyping, stakeholder management, agile methodologies, self-directed problem-solving." Stack these keywords to beat ATS filters.

3. **Experience Bullets:** Rewrite 3-4 bullets to emphasize multitasking and autonomy. Example: "Led 3 simultaneous product launches with minimal oversight, coordinating across 5 departments and delivering 2 weeks ahead of schedule."

4. **Quantify everything:** Replace vague claims with numbers. Instead of "Improved processes," write "Streamlined workflows, reducing processing time by 40% and saving $50K annually."

## Salary Expectations:

**$55,000 - $75,000** depending on experience level and location.

Given the red flags (vague responsibilities, heavy workload), they're likely offering on the lower end. The "competitive salary" claim is often code for "barely market rate." If they really valued the role, they'd post a salary range. Negotiate hard and don't accept less than $65K for this workload.

## Red Flags:

🚩 **"Minimal supervision" = No mentorship or support.** You're expected to figure everything out on your own, which is brutal for anyone early in their career.

🚩 **"Wear many hats" = Scope creep nightmare.** Today you're doing marketing, tomorrow you're IT support, next week you're the janitor. No specialization = no career growth.

🚩 **"Fast-paced environment" without specifics = Chaos.** Legitimate fast-paced companies describe their workflow (agile sprints, quarterly goals). Vagueness here suggests disorganization.

🚩 **No mention of team size, structure, or support systems.** This screams "skeleton crew." You'll be overwhelmed and isolated.

## Bottom Line:

**Proceed with extreme caution.** This job reeks of burnout potential. If you desperately need experience or a paycheck, go for it - but have an exit strategy within 12-18 months. 

Ask these questions in the interview:
- "What does success look like in the first 90 days?"
- "How many people are currently in this role or similar?"
- "What's your turnover rate?"
- "Can you walk me through a typical week?"

If they dodge these questions or give vague answers, RUN. There are better opportunities out there that won't sacrifice your mental health. 💀

---

**💡 This is a DEMO analysis.** Sign up free to analyze YOUR job descriptions with your choice of AI advisor!`;
}

// Show modals
function showAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showBuyCreditsModal(customMessage = null) {
    const modal = document.getElementById('buyCreditsModal');
    const message = document.getElementById('buyCreditsMessage');
    
    if (modal) {
        if (customMessage && message) {
            message.textContent = customMessage;
        } else if (message) {
            // Default message based on situation
            const today = new Date().toISOString().split('T')[0];
            const lastFree = window.currentUser?.last_free_analysis_date;
            
            if (lastFree === today) {
                message.textContent = "You've used your free analysis for today! Buy credits to continue analyzing, or come back tomorrow.";
            } else {
                message.textContent = "You're out of credits! Buy more to keep analyzing job descriptions.";
            }
        }
        modal.classList.add('active');
    }
}

function closeBuyCreditsModal() {
    const modal = document.getElementById('buyCreditsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showProModal(message) {
    const modal = document.getElementById('proModal');
    const modalMessage = document.getElementById('proModalMessage');
    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.classList.add('active');
    }
}

function closeProModal() {
    const modal = document.getElementById('proModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'block';
    }
}

function hideSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

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
