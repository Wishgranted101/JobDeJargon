/**
 * Job Analysis Page Logic - Simplified Personality System
 * TESTING VERSION - Daily limit removed + Auto-save enabled
 * Last Updated: November 3, 2025
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
        
        // Fetch analysis
        try {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '⏳ Analyzing...';
            
            // Call API with combined personality
            const analysis = await fetchJobAnalysis(
                jobDescription, 
                selectedPersonality
            );
            
            // ✅ VALIDATION: Check if API returned the prompt instead of analysis
            if (analysis.includes('You are an AI job description analyzer') || 
                analysis.includes('For 5-7 distinct pieces of jargon') ||
                analysis.length < 100) {
                throw new Error('Invalid response from AI. Please try again.');
            }
            
            // Store current analysis
            currentAnalysis = {
                jobDescription,
                analysis,
                personality: selectedPersonality,
                timestamp: new Date().toISOString(),
                id: Date.now()
            };
            
            // ✅ CRITICAL: Also store in window for resume/cover letter generators
            window.currentAnalysis = currentAnalysis;
            
            // Display results
            displayAnalysis(analysis);
            
            // ✅ AUTO-SAVE: Automatically save to Supabase
            if (isUserLoggedIn()) {
                await autoSaveAnalysis(currentAnalysis);
            }
            
            // Show success message
            showToast('Analysis complete! (Testing mode - no credits deducted)');
            
        } catch (error) {
            console.error('Analysis error:', error);
            showToast(error.message || 'Analysis failed. Please try again.', 'error');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analyze This Job';
        }
    });
}

/**
 * Auto-save analysis to Supabase (happens automatically after successful analysis)
 */
async function autoSaveAnalysis(analysis) {
    try {
        console.log('💾 Auto-saving analysis to Supabase...');
        
        // Check if Supabase is loaded
        if (typeof supabase === 'undefined') {
            console.warn('⚠️ Supabase not initialized, skipping auto-save');
            return;
        }
        
        // Save to Supabase
        const { data, error } = await supabase
            .from('analyses')
            .insert([{
                user_id: window.currentUser.id,
                job_description: analysis.jobDescription,
                analysis_result: analysis.analysis,
                tone: analysis.personality,
                persona: analysis.personality,
                status: 'analyzed',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Auto-save error:', error);
            // Don't show error to user - it's a background save
            return;
        }
        
        console.log('✅ Analysis auto-saved to Supabase:', data);
        
        // Update Save button to show it's already saved
        const saveBtn = document.getElementById('saveAnalysisBtn');
        if (saveBtn) {
            saveBtn.textContent = '✓ Saved';
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';
        }
        
        // Show subtle success notification
        showToast('✅ Analysis saved to dashboard!', 'success');
        
    } catch (error) {
        console.error('❌ Auto-save failed:', error);
        // Silently fail - don't interrupt user experience
    }
}

/**
 * Setup demo button
 */
function setupDemoButton() {
    const demoBtn = document.getElementById('demoBtn');
    
    if (!demoBtn) return;
    
    demoBtn.addEventListener('click', () => {
        const demoAnalysis = getDemoAnalysis();
        
        // Store demo analysis so Save/Resume/Cover Letter buttons work
        currentAnalysis = {
            jobDescription: document.getElementById('jobDescription')?.value || 'Demo Job Description',
            analysis: demoAnalysis,
            personality: selectedPersonality,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };
        
        // Also store in window for resume/cover letter generators
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
    // Save Analysis - Manual backup (auto-save already happens)
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
            
            // Check if already saved
            if (saveBtn.textContent === '✓ Saved') {
                showToast('Already saved! Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                return;
            }
            
            // Show loading state
            saveBtn.disabled = true;
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '💾 Saving...';
            
            try {
                // Check if Supabase is loaded
                if (typeof supabase === 'undefined') {
                    throw new Error('Supabase is not initialized. Please refresh the page.');
                }
                
                // Save to Supabase
                const { data, error } = await supabase
                    .from('analyses')
                    .insert([{
                        user_id: window.currentUser.id,
                        job_description: currentAnalysis.jobDescription,
                        analysis_result: currentAnalysis.analysis,
                        tone: currentAnalysis.personality,
                        persona: currentAnalysis.personality,
                        status: 'analyzed',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) {
                    console.error('Supabase save error:', error);
                    throw new Error(error.message);
                }
                
                console.log('✅ Analysis saved successfully:', data);
                saveBtn.textContent = '✓ Saved';
                showToast('✅ Analysis saved to dashboard!');
                
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                
            } catch (error) {
                console.error('❌ Error saving analysis:', error);
                showToast(`Error saving: ${error.message}`, 'error');
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }
        });
    }
    
    // Generate Resume (Pro feature)
    const resumeBtn = document.getElementById('generateResumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (!currentAnalysis) {
                showToast('Please analyze a job first!');
                return;
            }
            
            if (!isUserLoggedIn()) {
                showToast('Please log in to generate resumes');
                showAuthModal();
                return;
            }
            
            // Open full-screen resume generator modal
            openResumeGenerator();
        });
    }
    
    // Generate Cover Letter (Pro feature)
    const coverLetterBtn = document.getElementById('generateCoverLetterBtn');
    if (coverLetterBtn) {
        coverLetterBtn.addEventListener('click', () => {
            if (!currentAnalysis) {
                showToast('Please analyze a job first!');
                return;
            }
            
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
