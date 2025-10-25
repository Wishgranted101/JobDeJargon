/**
 * Job Analysis Page Logic
 */

let selectedTone = 'snarky';
let selectedPersona = 'brutally-honest';
let currentAnalysis = null;

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    setupToneSelector();
    setupPersonaSelector();
    setupAnalyzeButton();
    setupActionButtons();
});

/**
 * Setup tone selector buttons
 */
function setupToneSelector() {
    const toneButtons = document.querySelectorAll('#toneSelector .selector-btn');
    
    toneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            toneButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Update selected tone
            selectedTone = btn.getAttribute('data-tone');
        });
    });
}

/**
 * Setup persona selector buttons
 */
function setupPersonaSelector() {
    const personaButtons = document.querySelectorAll('#personaSelector .selector-btn');
    
    personaButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            personaButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            // Update selected persona
            selectedPersona = btn.getAttribute('data-persona');
        });
    });
}

/**
 * Setup analyze button
 */
function setupAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const jobDescInput = document.getElementById('jobDescription');
    
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
        
        // Fetch analysis
        try {
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '⏳ Analyzing...';
            
            const analysis = await fetchJobAnalysis(jobDescription, selectedTone, selectedPersona);
            
            // Store current analysis
            currentAnalysis = {
                jobDescription,
                analysis,
                tone: selectedTone,
                persona: selectedPersona,
                timestamp: new Date().toISOString(),
                id: Date.now()
            };
            
            // Display results
            displayAnalysis(analysis);
            
            showToast('Analysis complete!');
            
        } catch (error) {
            console.error('Analysis error:', error);
            if (error.message !== 'Free tier limit exceeded') {
                showToast('Error analyzing job. Please try again.');
            }
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analyze This Job';
        }
    });
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis) {
    const outputDiv = document.getElementById('analysisOutput');
    const contentDiv = document.getElementById('analysisContent');
    
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
        .replace(/• /g, '&bull; ')
        .replace(/\n\n/g, '</p><p>')
        .replace(/🚩/g, '<span style="color: var(--danger);">🚩</span>')
        .replace(/✓/g, '<span style="color: var(--success);">✓</span>')
        .replace(/⚠️/g, '<span style="color: var(--warning);">⚠️</span>');
    
    return `<p>${formatted}</p>`;
}

/**
 * Setup action buttons (Save, Resume, Cover Letter)
 */
function setupActionButtons() {
    // Save Analysis
    document.getElementById('saveAnalysisBtn').addEventListener('click', () => {
        if (!currentAnalysis) {
            showToast('No analysis to save!');
            return;
        }
        
        // Check if user is logged in (simulated)
        if (!userState.isLoggedIn) {
            showToast('Please log in to save analyses');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }
        
        // Save to localStorage (simulated database)
        const savedJobs = loadFromLocal('savedJobs') || [];
        savedJobs.push(currentAnalysis);
        saveToLocal('savedJobs', savedJobs);
        
        showToast('Analysis saved to dashboard!');
    });
    
    // Generate Resume
    document.getElementById('generateResumeBtn').addEventListener('click', () => {
        if (!currentAnalysis) {
            showToast('Please analyze a job first!');
            return;
        }
        
        // Check if Pro user
        if (!isProUser()) {
            showProModal('Resume generation is a Pro feature! Upgrade to create unlimited AI-tailored resumes.');
            return;
        }
        
        // Store job data for resume generator
        saveToLocal('currentJobForResume', currentAnalysis);
        
        // Redirect to resume generator
        window.location.href = 'resume-generator.html?type=resume';
    });
    
    // Generate Cover Letter
    document.getElementById('generateCoverLetterBtn').addEventListener('click', () => {
        if (!currentAnalysis) {
            showToast('Please analyze a job first!');
            return;
        }
        
        // Check if Pro user
        if (!isProUser()) {
            showProModal('Cover letter generation is a Pro feature! Upgrade to create unlimited AI-tailored cover letters.');
            return;
        }
        
        // Store job data for cover letter generator
        saveToLocal('currentJobForResume', currentAnalysis);
        
        // Redirect to resume generator
        window.location.href = 'resume-generator.html?type=cover-letter';
    });
}
