/**
 * API.js - Now calls secure serverless function
 */

const API_CONFIG = {
    FREE_TIER_LIMIT: 5, // Free users limited to 5 analyses per day
};

const userState = {
    isLoggedIn: false,
    isPro: false,
    usageCount: 0,
    savedJobs: [],
};

function isProUser() {
    return userState.isPro;
}

function checkFreeTierLimit() {
    if (!isProUser() && userState.usageCount >= API_CONFIG.FREE_TIER_LIMIT) {
        return false;
    }
    return true;
}

/**
 * Fetch job analysis - NOW CALLS SERVERLESS FUNCTION (Secure!)
 */
async function fetchJobAnalysis(jobDescription, tone = 'professional', persona = 'friendly-mentor') {
    if (!checkFreeTierLimit()) {
        showToast('You\'ve reached your free limit (5/day). Upgrade to Pro for unlimited!');
        throw new Error('Free tier limit exceeded');
    }

    try {
        showSpinner();
       
        // Call YOUR serverless function (not Gemini directly)
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription,
                tone,
                persona
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
       
        userState.usageCount++;
        saveUserState();
       
        hideSpinner();
        return data.analysis;
       
    } catch (error) {
        hideSpinner();
        console.error('Error fetching job analysis:', error);
        return getMockJobAnalysis(tone, persona);
    }
}

/**
 * Mock data for demo/fallback
 */
function getMockJobAnalysis(tone, persona) {
    return `**Real Job Title**: Sample Position

**Key Responsibilities**:
• Sample responsibility 1
• Sample responsibility 2

**Required Skills**:
• Must-haves: Sample skills
• Nice-to-haves: Additional skills

**Red Flags**:
⚠️ This is mock data - add your API key to see real analysis

**Salary Expectations**:
$XX,XXX - $XX,XXX

**Bottom Line**:
This is demo data. Configure your API key for real analysis.`;
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

function saveToLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function loadFromLocal(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return null;
    }
}

function initUserState() {
    const saved = loadFromLocal('userState');
    if (saved) {
        Object.assign(userState, saved);
    }
}

function saveUserState() {
    saveToLocal('userState', userState);
}

if (typeof window !== 'undefined') {
    initUserState();
}
