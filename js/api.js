/**
 * API.js - Frontend logic with Pro feature gating
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
 * Fetch job analysis - calls serverless function
 */
async function fetchJobAnalysis(jobDescription, tone = 'professional', persona = 'friendly-mentor') {
    if (!checkFreeTierLimit()) {
        showToast('You\'ve reached your free limit (5/day). Upgrade to Pro for unlimited analyses!');
        throw new Error('Free tier limit exceeded');
    }

    // For free users, ALWAYS use friendly-mentor regardless of what's selected
    const actualPersona = isProUser() ? persona : 'friendly-mentor';

    try {
        showSpinner();
        
        // Call serverless function
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobDescription,
                tone,
                persona: actualPersona  // Use the corrected persona
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
        showToast('Analysis failed. Please try again.');
        throw error;
    }
}

/**
 * Initialize Pro feature locks on page load
 */
function initProFeatureLocks() {
    if (!isProUser()) {
        // Lock all persona buttons except Friendly Mentor
        const personaButtons = document.querySelectorAll('[data-persona]');
        personaButtons.forEach(button => {
            const personaValue = button.getAttribute('data-persona');
            if (personaValue !== 'friendly-mentor') {
                // Add pro lock indicator
                button.classList.add('pro-locked');
                
                // Add lock icon if not already present
                if (!button.querySelector('.pro-lock-icon')) {
                    const lockIcon = document.createElement('span');
                    lockIcon.innerHTML = ' 🔒';
                    lockIcon.className = 'pro-lock-icon';
                    button.appendChild(lockIcon);
                }
                
                // Add click handler to show upgrade modal
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showProModal('Unlock all AI Personas with Pro! Get access to Brutally Honest Coach, HR Insider, and Corporate Translator.');
                    
                    // Auto-select Friendly Mentor instead
                    const friendlyMentorBtn = document.querySelector('[data-persona="friendly-mentor"]');
                    if (friendlyMentorBtn) {
                        // Remove active from all persona buttons
                        document.querySelectorAll('[data-persona]').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        // Activate friendly mentor
                        friendlyMentorBtn.classList.add('active');
                    }
                });
            }
        });
        
        // Ensure Friendly Mentor is selected by default for free users
        const friendlyMentorBtn = document.querySelector('[data-persona="friendly-mentor"]');
        if (friendlyMentorBtn && !document.querySelector('[data-persona].active')) {
            friendlyMentorBtn.classList.add('active');
        }
    }
}

/**
 * Get selected tone and persona from UI
 */
function getSelectedOptions() {
    const toneButton = document.querySelector('[data-tone].active');
    const personaButton = document.querySelector('[data-persona].active');
    
    // Default to friendly-mentor for free users
    let persona = personaButton ? personaButton.getAttribute('data-persona') : 'friendly-mentor';
    if (!isProUser() && persona !== 'friendly-mentor') {
        persona = 'friendly-mentor';
    }
    
    return {
        tone: toneButton ? toneButton.getAttribute('data-tone') : 'professional',
        persona: persona
    };
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

// Initialize on page load
if (typeof window !== 'undefined') {
    initUserState();
    
    // Initialize Pro locks when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProFeatureLocks);
    } else {
        initProFeatureLocks();
    }
}
