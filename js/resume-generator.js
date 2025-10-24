/**
 * Resume & Cover Letter Generator Logic
 */

let selectedTone = 'professional';
let generationType = 'resume';
let currentJob = null;
let generatedContent = null;

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', () => {
    // Determine if generating resume or cover letter
    const urlParams = new URLSearchParams(window.location.search);
    generationType = urlParams.get('type') || 'resume';
    
    // Update page title
    document.getElementById('pageTitle').textContent = 
        generationType === 'resume' ? 'Generate Resume' : 'Generate Cover Letter';
    
    // Load job context
    loadJobContext();
    
    // Setup selectors and buttons
    setupToneSelector();
    setupGenerateButton();
    setupActionButtons();
});

/**
 * Load job context from storage
 */
function loadJobContext() {
    currentJob = loadFromLocal('currentJobForResume');
    
    if (currentJob) {
        const infoElement = document.getElementById('targetJobInfo');
        // Extract job title from description (simple heuristic)
        const jobTitle = extractJobTitle(currentJob.jobDescription);
        infoElement.innerHTML = `
            <strong>${jobTitle}</strong><br>
            <small>Analyzed: ${new Date(currentJob.timestamp).toLocaleDateString()}</small><br>
            <small>Tone: ${currentJob.tone} | Persona: ${currentJob.persona}</small>
        `;
    }
}

/**
 * Extract job title from description
 */
function extractJobTitle(description) {
    // Try to find job title in first few lines
    const lines = description.split('\n');
    for (let line of lines.slice(0, 5)) {
        if (line.trim() && !line.startsWith('http')) {
            return line.trim().substring(0, 80);
        }
    }
    return 'Job Position';
}

/**
 * Setup tone selector
 */
function setupToneSelector() {
    const toneButtons = document.querySelectorAll('#toneSelector .selector-btn');
    
    toneButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toneButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTone = btn.getAttribute('data-tone');
        });
    });
}

/**
 * Setup generate button
 */
function setupGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    const userResumeInput = document.getElementById('userResume');
    
    generateBtn.addEventListener('click', async () => {
        const userResume = userResumeInput.value.trim();
        
        // Validate input
        if (!userResume) {
            showToast('Please enter your resume or experience details!');
            return;
        }
        
        if (!currentJob) {
            showToast('No job selected. Please analyze a job first.');
            setTimeout(() => {
                window.location.href = 'job-analysis.html';
            }, 2000);
            return;
        }
        
        // Generate content
        try {
            generateBtn.disabled = true;
            generateBtn.textContent = '⏳ Generating...';
            
            const content = await generateResumeCoverLetter(
                generationType,
                currentJob.jobDescription,
                userResume,
                selectedTone
            );
            
            generatedContent = {
                type: generationType,
                content,
                jobId: currentJob.id,
                timestamp: new Date().toISOString()
            };
            
            displayGeneratedContent(content);
            showToast(`${generationType === 'resume' ? 'Resume' : 'Cover letter'} generated!`);
            
        } catch (error) {
            console.error('Generation error:', error);
            if (error.message !== 'Free tier limit exceeded') {
                showToast('Error generating content. Please try again.');
            }
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ Generate';
        }
    });
}

/**
 * Display generated content
 */
function displayGeneratedContent(content) {
    const outputDiv = document.getElementById('generatedOutput');
    const contentDiv = document.getElementById('generatedContent');
    
    contentDiv.textContent = content;
    outputDiv.style.display = 'block';
    
    // Scroll to results
    outputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    // Copy to clipboard
    document.getElementById('copyBtn').addEventListener('click', () => {
        const content = document.getElementById('generatedContent').textContent;
        
        navigator.clipboard.writeText(content).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('Failed to copy. Please select and copy manually.');
        });
    });
    
    // Export PDF (Pro feature)
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        if (!isProUser()) {
            showProModal('Upgrade to Pro to export as PDF!');
            return;
        }
        
        // In production, implement actual PDF export
        showToast('PDF export would happen here (Pro feature)');
    });
    
    // Save (Pro feature)
    document.getElementById('saveBtn').addEventListener('click', () => {
        if (!isProUser()) {
            showProModal('Upgrade to Pro to save your resumes and cover letters!');
            return;
        }
        
        if (!generatedContent) {
            showToast('Nothing to save yet!');
            return;
        }
        
        // Save to localStorage
        const savedDocs = loadFromLocal('savedDocuments') || [];
        savedDocs.push(generatedContent);
        saveToLocal('savedDocuments', savedDocs);
        
        showToast('Saved successfully!');
    });
}
