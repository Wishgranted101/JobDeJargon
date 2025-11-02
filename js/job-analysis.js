/**
 * Job Analysis Page Logic - Simplified Personality System
 * TESTING VERSION - Daily limit removed
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
        
        // ⚠️ TESTING MODE: Daily limit check REMOVED
        // This allows unlimited testing of analyze feature
        // TODO: Re-enable credit checks before production
        /*
        // Check if user can analyze (has credits or daily free)
        const canAnalyze = await canUserAnalyze();
        
        if (!canAnalyze.allowed) {
            if (canAnalyze.reason === 'no_credits') {
                showBuyCreditsModal();
                return;
            }
        }
        */
        
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
            
            // ✅ CRITICAL FIX: Also store in window for resume/cover letter generators
            window.currentAnalysis = currentAnalysis;
            
            // Display results
            displayAnalysis(analysis);
            
            // Show credit status (for testing only)
            showToast('Analysis complete! (Testing mode - no credits deducted)');
            
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
        
        // ✅ Store demo analysis so Save/Resume/Cover Letter buttons work
        currentAnalysis = {
            jobDescription: document.getElementById('jobDescription')?.value || 'Demo Job Description',
            analysis: demoAnalysis,
            personality: selectedPersonality,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        // ✅ Also store in window for resume/cover letter generators
        window.currentAnalysis = currentAnalysis;
        
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
    // Save Analysis - ✅ FIXED to handle errors gracefully
    const saveBtn = document.getElementById('saveAnalysisBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!currentAnalysis) {
                showToast('No analysis to save!');
                return;
            }
            
            if (!isUserLoggedIn()) {
                showToast('Please log in to save analyses');
                showAuthModal();
                return;
            }
            
            // Show loading state
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '💾 Saving...';
            
            try {
                // ✅ Check if Supabase is loaded
                if (typeof supabase === 'undefined') {
                    throw new Error('Supabase is not initialized. Please refresh the page.');
                }
                
                // Save to Supabase using YOUR column names
                const { data, error } = await supabase
                    .from('analyses')
                    .insert([{
                        user_id: window.currentUser.id,
                        job_description: currentAnalysis.jobDescription,
                        analysis_result: currentAnalysis.analysis, // ✅ Using YOUR column name
                        personality: currentAnalysis.personality,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw new Error(error.message);
                }
                
                console.log('✅ Analysis saved successfully:', data);
                showToast('✅ Analysis saved to dashboard!');
                
                // Optional: Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    if (confirm('View saved analysis in dashboard?')) {
                        window.location.href = 'dashboard.html';
                    }
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error saving analysis:', error);
                showToast(`Error saving: ${error.message}`, 'error');
            } finally {
                // Reset button
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
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
            
            // Check if logged in
            if (!isUserLoggedIn()) {
                showToast('Please log in to generate resumes');
                showAuthModal();
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
            
            // Check if logged in
            if (!isUserLoggedIn()) {
                showToast('Please log in to generate cover letters');
                showAuthModal();
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
