/**
 * Resume & Cover Letter Generator - Full-Screen Modal Version
 * File: js/resume-generator.js
 */

// State
let currentJobAnalysis = null;
let currentGenerationType = 'resume'; // 'resume' or 'cover-letter'
let generatedContent = null;

/**
 * Initialize modal system
 */
function initializeGeneratorModals() {
    // Create full-screen modal HTML if it doesn't exist
    if (!document.getElementById('generatorModal')) {
        createGeneratorModal();
    }
    
    // Load current job analysis from page
    loadCurrentJobAnalysis();
}

/**
 * Create full-screen modal HTML
 */
function createGeneratorModal() {
    const modalHTML = `
        <div id="generatorModal" class="fullscreen-modal">
            <div class="fullscreen-modal-container">
                <!-- Header -->
                <div class="fullscreen-modal-header">
                    <h2 class="fullscreen-modal-title">
                        <span id="modalTitleIcon">✨</span>
                        <span id="modalTitleText">Generate Resume</span>
                    </h2>
                    <button class="fullscreen-modal-close" onclick="closeGeneratorModal()">&times;</button>
                </div>
                
                <!-- Body -->
                <div class="fullscreen-modal-body">
                    <!-- Step 1: Input -->
                    <div id="step1Input" class="modal-step active">
                        <div class="modal-input-section">
                            <h3 id="inputStepTitle">📋 Paste Your Current Resume</h3>
                            <textarea 
                                id="generatorInput" 
                                placeholder="Paste your resume or key experience here..."
                            ></textarea>
                            <div class="modal-tip">
                                <strong>💡 Tip:</strong> Include your work experience, skills, and education for best results. The AI will tailor it to match the job requirements.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Loading -->
                    <div id="stepLoading" class="modal-loading">
                        <div class="modal-loading-spinner"></div>
                        <div class="modal-loading-text">Generating your tailored content...</div>
                    </div>
                    
                    <!-- Step 2: Results -->
                    <div id="step2Results" class="modal-step">
                        <!-- Mobile tabs -->
                        <div class="modal-tabs">
                            <button class="modal-tab active" onclick="switchModalTab('generated')">
                                Generated
                            </button>
                            <button class="modal-tab" onclick="switchModalTab('reference')">
                                Reference
                            </button>
                        </div>
                        
                        <!-- Split view -->
                        <div class="modal-split-view">
                            <!-- Generated content -->
                            <div class="modal-content-panel active" data-tab="generated">
                                <h4>
                                    <span id="generatedContentIcon">📝</span>
                                    <span id="generatedContentTitle">Your Tailored Resume</span>
                                </h4>
                                <div 
                                    id="generatedContentEditable" 
                                    class="modal-editable-content" 
                                    contenteditable="true"
                                    spellcheck="true"
                                >
                                    <!-- Generated content appears here -->
                                </div>
                            </div>
                            
                            <!-- Reference (Job Analysis) -->
                            <div class="modal-content-panel" data-tab="reference">
                                <h4>📊 Job Analysis Reference</h4>
                                <div id="referenceContent" class="modal-reference-content">
                                    <!-- Job analysis summary appears here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="fullscreen-modal-footer">
                    <div class="modal-footer-left">
                        <button id="backToInputBtn" class="btn-secondary" style="display: none;" onclick="backToInput()">
                            ← Back to Edit
                        </button>
                    </div>
                    <div class="modal-footer-right">
                        <button id="cancelBtn" class="btn-secondary" onclick="closeGeneratorModal()">
                            Cancel
                        </button>
                        <button id="generateBtn" class="btn-primary" onclick="handleGenerate()">
                            ✨ Generate
                        </button>
                        <button id="copyBtn" class="btn-secondary" style="display: none;" onclick="copyToClipboard()">
                            📋 Copy
                        </button>
                        <button id="downloadPdfBtn" class="btn-secondary" style="display: none;" onclick="handleDownloadPDF()">
                            💾 Download PDF
                        </button>
                        <button id="regenerateBtn" class="btn-secondary" style="display: none;" onclick="handleRegenerate()">
                            🔄 Regenerate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Load current job analysis from the page
 */
function loadCurrentJobAnalysis() {
    // Get job description from textarea
    const jobDescTextarea = document.getElementById('jobDescription');
    if (jobDescTextarea && jobDescTextarea.value) {
        currentJobAnalysis = {
            jobDescription: jobDescTextarea.value,
            analysis: window.currentAnalysis || null
        };
    }
}

/**
 * Open resume generator modal
 */
function openResumeGenerator() {
    currentGenerationType = 'resume';
    loadCurrentJobAnalysis();
    
    if (!currentJobAnalysis || !currentJobAnalysis.jobDescription) {
        showToast('Please analyze a job first!');
        return;
    }
    
    // Update modal titles
    document.getElementById('modalTitleText').textContent = 'AI Resume Generator';
    document.getElementById('inputStepTitle').textContent = '📋 Paste Your Current Resume';
    document.getElementById('generatedContentTitle').textContent = 'Your Tailored Resume';
    
    // Reset modal
    resetModal();
    
    // Show modal
    document.getElementById('generatorModal').classList.add('active');
}

/**
 * Open cover letter generator modal
 */
function openCoverLetterGenerator() {
    currentGenerationType = 'cover-letter';
    loadCurrentJobAnalysis();
    
    if (!currentJobAnalysis || !currentJobAnalysis.jobDescription) {
        showToast('Please analyze a job first!');
        return;
    }
    
    // Update modal titles
    document.getElementById('modalTitleText').textContent = 'AI Cover Letter Generator';
    document.getElementById('inputStepTitle').textContent = '📋 Brief Summary of Your Experience';
    document.getElementById('generatedContentTitle').textContent = 'Your Tailored Cover Letter';
    
    // Reset modal
    resetModal();
    
    // Show modal
    document.getElementById('generatorModal').classList.add('active');
}

/**
 * Close modal
 */
function closeGeneratorModal() {
    document.getElementById('generatorModal').classList.remove('active');
    resetModal();
}

/**
 * Reset modal to initial state
 */
function resetModal() {
    // Clear input
    document.getElementById('generatorInput').value = '';
    
    // Clear generated content
    document.getElementById('generatedContentEditable').textContent = '';
    
    // Show step 1, hide others
    document.getElementById('step1Input').classList.add('active');
    document.getElementById('stepLoading').classList.remove('active');
    document.getElementById('step2Results').classList.remove('active');
    
    // Reset buttons
    document.getElementById('generateBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('backToInputBtn').style.display = 'none';
    document.getElementById('copyBtn').style.display = 'none';
    document.getElementById('downloadPdfBtn').style.display = 'none';
    document.getElementById('regenerateBtn').style.display = 'none';
}

/**
 * Handle generate button click
 */
async function handleGenerate() {
    const userInput = document.getElementById('generatorInput').value.trim();
    
    if (!userInput) {
        showToast('Please enter your resume or experience!');
        return;
    }
    
    if (!currentJobAnalysis || !currentJobAnalysis.jobDescription) {
        showToast('No job analysis found. Please analyze a job first.');
        closeGeneratorModal();
        return;
    }
    
    try {
        // Show loading
        document.getElementById('step1Input').classList.remove('active');
        document.getElementById('stepLoading').classList.add('active');
        
        // Call API
        const content = await generateResumeCoverLetter(
            currentGenerationType,
            currentJobAnalysis.jobDescription,
            userInput,
            currentJobAnalysis.analysis
        );
        
        // Store generated content
        generatedContent = {
            type: currentGenerationType,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        // Display results
        displayResults(content);
        
        showToast(`${currentGenerationType === 'resume' ? 'Resume' : 'Cover letter'} generated successfully!`);
        
    } catch (error) {
        console.error('Generation error:', error);
        showToast('Failed to generate content. Please try again.');
        
        // Go back to input
        document.getElementById('stepLoading').classList.remove('active');
        document.getElementById('step1Input').classList.add('active');
    }
}

/**
 * Display generated results
 */
function displayResults(content) {
    // Hide loading
    document.getElementById('stepLoading').classList.remove('active');
    
    // Show results
    document.getElementById('step2Results').classList.add('active');
    
    // Set generated content
    document.getElementById('generatedContentEditable').textContent = content;
    
    // Set reference content (job analysis summary)
    if (currentJobAnalysis.analysis) {
        document.getElementById('referenceContent').innerHTML = formatJobAnalysisReference(currentJobAnalysis.analysis);
    } else {
        document.getElementById('referenceContent').innerHTML = '<p style="color: var(--text-secondary);">Job analysis not available.</p>';
    }
    
    // Update buttons
    document.getElementById('generateBtn').style.display = 'none';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('backToInputBtn').style.display = 'inline-block';
    document.getElementById('copyBtn').style.display = 'inline-block';
    document.getElementById('downloadPdfBtn').style.display = 'inline-block';
    document.getElementById('regenerateBtn').style.display = 'inline-block';
}

/**
 * Format job analysis for reference panel
 */
function formatJobAnalysisReference(analysis) {
    // Extract key sections from analysis
    const sections = analysis.split('\n##');
    let html = '';
    
    sections.forEach(section => {
        if (section.includes('What They Really Mean')) {
            html += '<h5>🔍 Key Requirements</h5>';
            html += '<div style="font-size: 0.85rem;">' + extractBulletPoints(section) + '</div>';
        } else if (section.includes('Red Flags')) {
            html += '<h5 style="margin-top: 1.5rem;">🚩 Red Flags</h5>';
            html += '<div style="font-size: 0.85rem;">' + extractBulletPoints(section) + '</div>';
        } else if (section.includes('Salary')) {
            html += '<h5 style="margin-top: 1.5rem;">💰 Salary Range</h5>';
            html += '<div style="font-size: 0.85rem;">' + extractSalaryInfo(section) + '</div>';
        }
    });
    
    return html || '<p>No analysis available</p>';
}

/**
 * Extract bullet points from section
 */
function extractBulletPoints(section) {
    const lines = section.split('\n');
    const bullets = lines.filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    return '<ul>' + bullets.map(b => '<li>' + b.replace(/^[•\-]\s*/, '') + '</li>').join('') + '</ul>';
}

/**
 * Extract salary info
 */
function extractSalaryInfo(section) {
    const lines = section.split('\n');
    return lines.slice(1, 4).join('<br>');
}

/**
 * Copy to clipboard
 */
function copyToClipboard() {
    const content = document.getElementById('generatedContentEditable').textContent;
    
    navigator.clipboard.writeText(content).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy. Please select and copy manually.');
    });
}

/**
 * Handle download PDF
 */
function handleDownloadPDF() {
    // Check if Pro user
    if (!window.currentUser || !window.currentUser.is_pro) {
        showProModal('Upgrade to Pro to export as PDF!');
        return;
    }
    
    // TODO: Implement actual PDF export in production
    showToast('PDF export feature coming soon!');
}

/**
 * Handle regenerate
 */
function handleRegenerate() {
    // Go back to input with existing content
    document.getElementById('step2Results').classList.remove('active');
    document.getElementById('step1Input').classList.add('active');
    
    // Reset buttons
    document.getElementById('generateBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('backToInputBtn').style.display = 'none';
    document.getElementById('copyBtn').style.display = 'none';
    document.getElementById('downloadPdfBtn').style.display = 'none';
    document.getElementById('regenerateBtn').style.display = 'none';
}

/**
 * Back to input
 */
function backToInput() {
    handleRegenerate();
}

/**
 * Switch tabs on mobile
 */
function switchModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.modal-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update content panels
    document.querySelectorAll('.modal-content-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

/**
 * API: Generate resume or cover letter
 */
async function generateResumeCoverLetter(type, jobDescription, userInput, jobAnalysis) {
    try {
        const response = await fetch('/api/generate-document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: type, // 'resume' or 'cover-letter'
                jobDescription: jobDescription,
                userInput: userInput,
                jobAnalysis: jobAnalysis // Optional: include previous analysis for context
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content;
        
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGeneratorModals);
} else {
    initializeGeneratorModals();
}
