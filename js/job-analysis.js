/**
 * Job Analysis Page Logic - Simplified Personality System
 */

let selectedPersonality = 'brutal-truth'; // Default
let currentAnalysis = null;

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    setupPersonalitySelector();
    setupAnalyzeButton();
    setupDemoButton();
    setupActionButtons();
    
    // Wait for auth to load, then update UI
    setTimeout(() => {
        updateAuthUI();
    }, 1500);
});

/**
 * Setup personality selector (combined tone + persona)
 */
function setupPersonalitySelector() {
    const personalityButtons = document.querySelectorAll('#personalitySelector .selector-btn');
    
    personalityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            personalityButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPersonality = btn.getAttribute('data-personality');
        });
    });
}

/**
 * Setup analyze button
 */
function setupAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const jobDescInput = document.getElementById('jobDescription');
    
    if (!analyzeBtn || !jobDescInput) return;
    
    analyzeBtn.addEventListener('click', async () => {
        const jobDescription = jobDescInput.value.trim();
        
        // Validate input
        if (!jobDescription) {
            showToast('Please paste a job description first!');
            return;
        }
        
        if (jobDescription.length < 50) {
            showToast('Job description seems too short. Please paste the full posting.');
            return;
        }
        
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            showAuthModal();
            return;
        }
        
        // Check if user can analyze (has credits or daily free)
        const canAnalyze = await canUserAnalyze();
        
        if (!canAnalyze.allowed) {
            if (canAnalyze.reason === 'no_credits') {
                showBuyCreditsModal();
                return;
            }
        }
        
        // Fetch analysis
        try {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '⏳ Analyzing...';
            
            // Call API with combined personality
            const analysis = await fetchJobAnalysis(
                jobDescription, 
                selectedPersonality
            );
            
            // Store current analysis
            currentAnalysis = {
                jobDescription,
                analysis,
                personality: selectedPersonality,
                timestamp: new Date().toISOString(),
                id: Date.now()
            };
            
            // Display results
            displayAnalysis(analysis);
            
            // Show credit status
            if (window.currentUser) {
                const credits = window.currentUser.credits || 0;
                if (credits === 0) {
                    const today = new Date().toISOString().split('T')[0];
                    const lastFree = window.currentUser.last_free_analysis_date;
                    
                    if (lastFree === today) {
                        showToast('Free daily analysis used! Buy credits for more.');
                    } else {
                        showToast('Analysis complete! You have 1 free analysis per day.');
                    }
                } else {
                    showToast(`Analysis complete! ${credits} credit${credits === 1 ? '' : 's'} remaining.`);
                }
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            // Error already shown by fetchJobAnalysis
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analyze This Job';
        }
    });
}

/**
 * Setup demo button
 */
function setupDemoButton() {
    const demoBtn = document.getElementById('demoBtn');
    
    if (!demoBtn) return;
    
    demoBtn.addEventListener('click', () => {
        const demoAnalysis = getDemoAnalysis();
        displayAnalysis(demoAnalysis);
        
        // Scroll to results
        const outputDiv = document.getElementById('analysisOutput');
        if (outputDiv) {
            outputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        showToast('This is a demo! Sign up to analyze YOUR job descriptions.');
        
        // Show signup CTA after a moment
        setTimeout(() => {
            if (!isUserLoggedIn()) {
                showToast('Like what you see? Sign up free for 1 analysis per day!', 5000);
            }
        }, 3000);
    });
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis) {
    const outputDiv = document.getElementById('analysisOutput');
    const contentDiv = document.getElementById('analysisContent');
    
    if (!contentDiv || !outputDiv) return;
    
    contentDiv.innerHTML = formatAnalysis(analysis);
    outputDiv.style.display = 'block';
    
    // Scroll to results
    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Format analysis text with better styling
 */
function formatAnalysis(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^## (.*$)/gim, '<h3>$1</h3>')
        .replace(/^# (.*$)/gim, '<h2>$1</h2>')
        .replace(/^• /gm, '&bull; ')
        .replace(/^- /gm, '&bull; ')
        .replace(/\n\n/g, '</p><p>')
        .replace(/🚩/g, '<span style="color: var(--danger);">🚩</span>')
        .replace(/✅/g, '<span style="color: var(--success);">✅</span>')
        .replace(/⚠️/g, '<span style="color: var(--warning);">⚠️</span>');
    
    return `<p>${formatted}</p>`;
}

/**
 * Setup action buttons (Save, Resume, Cover Letter)
 */
function setupActionButtons() {
    // Save Analysis
    const saveBtn = document.getElementById('saveAnalysisBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentAnalysis) {
                showToast('No analysis to save!');
                return;
            }
            
            if (!isUserLoggedIn()) {
                showToast('Please log in to save analyses');
                return;
            }
            
            try {
                // Save to Supabase
                const { error } = await supabase
                    .from('analyses')
                    .insert([{
                        user_id: window.currentUser.id,
                        job_description: currentAnalysis.jobDescription,
                        analysis_result: currentAnalysis.analysis,
                        personality: currentAnalysis.personality
                    }]);
                
                if (error) throw error;
                
                showToast('Analysis saved to dashboard!');
            } catch (error) {
                console.error('Error saving analysis:', error);
                showToast('Error saving analysis. Please try again.');
            }
        });
    }
    
    // Generate Resume (Pro feature - connected to modal)
    const resumeBtn = document.getElementById('generateResumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (!currentAnalysis) {
                showToast('Please analyze a job first!');
                return;
            }
            
            // Open full-screen resume generator modal
            openResumeGenerator();
        });
    }
    
    // Generate Cover Letter (Pro feature - connected to modal)
    const coverLetterBtn = document.getElementById('generateCoverLetterBtn');
    if (coverLetterBtn) {
        coverLetterBtn.addEventListener('click', () => {
            if (!currentAnalysis) {
                showToast('Please analyze a job first!');
                return;
            }
            
            // Open full-screen cover letter generator modal
            openCoverLetterGenerator();
        });
    }
}

/**
 * Update UI based on login status
 */
function updateAuthUI() {
    const userInfo = document.getElementById('userInfo');
    const guestInfo = document.getElementById('guestInfo');
    const creditDisplay = document.getElementById('creditDisplay');
    
    if (isUserLoggedIn()) {
        if (userInfo) {
            userInfo.style.display = 'flex';
            userInfo.style.alignItems = 'center';
            userInfo.style.gap = '1rem';
        }
        if (guestInfo) {
            guestInfo.style.display = 'none';
        }
        
        if (creditDisplay && window.currentUser) {
            const credits = window.currentUser.credits || 0;
            creditDisplay.textContent = `💳 ${credits} credit${credits === 1 ? '' : 's'}`;
        }
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (guestInfo) {
            guestInfo.style.display = 'flex';
            guestInfo.style.alignItems = 'center';
            guestInfo.style.gap = '1rem';
        }
    }
}
