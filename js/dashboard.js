/**
 * Dashboard Logic - Job Application Tracker
 * FIXED: All action buttons now work properly
 * FIXED: Move modal has clickable options
 * Last Updated: November 5, 2025
 */

let dashboardData = {
    analyzed: [],
    toApply: [],
    applied: [],
    interviewed: [],
    offers: [],
    rejected: []
};

let currentJobForModal = null;

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard page loaded, waiting for auth...');
    
    // Setup move modal click handlers
    setupMoveModalHandlers();
    
    // Setup close buttons for modals
    setupModalCloseButtons();
    
    // First, check if the session is already loaded (for fast page navigation)
    if (window.currentUser && window.currentUser.id) {
        console.log('✅ User session already loaded, initializing dashboard...');
        initializeDashboard();
    } else {
        console.log('⏳ Waiting for userSessionChanged event...');
        // Wait for the custom event fired by auth.js when the session loads
        window.addEventListener('userSessionChanged', () => {
            console.log('✅ userSessionChanged event received!');
            initializeDashboard();
        }, { once: true });
    }

    // Also run a timeout check in case the event fires too quickly or is missed
    setTimeout(() => {
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ Session check timed out after 3 seconds. User may not be logged in.');
            hideLoadingState();
            showToast('Please log in to view your dashboard', 'warning');
        }
    }, 3000); // 3-second timeout
});

/**
 * Setup move modal handlers - Make status options clickable
 */
function setupMoveModalHandlers() {
    console.log('🔧 Setting up move modal handlers...');
    
    // Add click handlers to each status button
    const statusButtons = [
        { id: 'moveToAnalyzed', status: 'analyzed' },
        { id: 'moveToToApply', status: 'toApply' },
        { id: 'moveToApplied', status: 'applied' },
        { id: 'moveToInterviewed', status: 'interviewed' },
        { id: 'moveToOffers', status: 'offers' },
        { id: 'moveToRejected', status: 'rejected' }
    ];
    
    statusButtons.forEach(({ id, status }) => {
        const button = document.getElementById(id);
        if (button) {
            // Remove any existing listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add new click listener
            newButton.addEventListener('click', () => {
                console.log(`✅ Status button clicked: ${status}`);
                moveJobTo(status);
            });
            
            console.log(`✅ Added click handler for: ${id}`);
        } else {
            console.warn(`⚠️ Button not found: ${id}`);
        }
    });
}

/**
 * Setup modal close buttons
 */
function setupModalCloseButtons() {
    // Close job detail modal
    const closeDetailBtn = document.querySelector('#jobDetailModal .close-modal');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeJobDetailModal);
    }
    
    // Close move modal
    const closeMoveBtn = document.querySelector('#moveJobModal .close-modal');
    if (closeMoveBtn) {
        closeMoveBtn.addEventListener('click', closeMoveJobModal);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
            if (e.target.id === 'jobDetailModal') closeJobDetailModal();
            if (e.target.id === 'moveJobModal') closeMoveJobModal();
        }
    });
}

/**
 * The main loading function - only runs after auth is confirmed
 */
async function initializeDashboard() {
    if (!window.currentUser || !window.currentUser.id) {
        console.error('❌ Cannot initialize dashboard - no user session');
        return;
    }
    
    console.log('✅ Auth confirmed. Loading dashboard data...');
    
    // Show loading state
    showLoadingState();
    
    // Load data from Supabase
    await loadDashboardData();
    
    // Render everything
    renderAllSections();
    updateStats();
    
    // Hide loading state
    hideLoadingState();
    
    console.log('✅ Dashboard loaded successfully');
}

/**
 * Show loading state
 */
function showLoadingState() {
    const container = document.querySelector('.dashboard-container') || document.body;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'dashboardLoading';
    loadingDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
            <div>Loading your saved analyses...</div>
        </div>
    `;
    container.prepend(loadingDiv);
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    const loading = document.getElementById('dashboardLoading');
    if (loading) loading.remove();
}

/**
 * Load dashboard data from Supabase
 */
async function loadDashboardData() {
    console.log('🔍 Loading dashboard data...');
    console.log('📊 Current User:', window.currentUser);
    console.log('🔌 Supabase available?', typeof supabase !== 'undefined');
    
    try {
        // Check if user is logged in
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ User not logged in');
            showToast('Please log in to view your dashboard', 'warning');
            return;
        }
        
        console.log('✅ User ID:', window.currentUser.id);
        
        // Fetch analyses from Supabase
        console.log('📡 Fetching from Supabase...');
        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });
        
        console.log('📥 Supabase response:', { data, error });
        
        if (error) {
            console.error('❌ Error loading analyses:', error);
            showToast('Error loading saved analyses', 'error');
            return;
        }
        
        console.log(`✅ Loaded ${data?.length || 0} analyses from Supabase`);
        
        // Clear existing data
        dashboardData = {
            analyzed: [],
            toApply: [],
            applied: [],
            interviewed: [],
            offers: [],
            rejected: []
        };
        
        // Convert Supabase data to dashboard format
        if (data && data.length > 0) {
            data.forEach(analysis => {
                const job = {
                    id: analysis.id,
                    jobDescription: analysis.job_description,
                    analysis: analysis.analysis_result,
                    tone: analysis.tone || 'brutal-truth',
                    persona: analysis.persona || analysis.tone || 'brutal-truth',
                    timestamp: analysis.created_at,
                    status: analysis.status || 'analyzed'
                };
                
                // Add to appropriate status array
                const status = job.status || 'analyzed';
                if (dashboardData[status]) {
                    dashboardData[status].push(job);
                    console.log(`📌 Added job to ${status}:`, job.id);
                }
            });
            
            console.log('📊 Dashboard data loaded:', {
                analyzed: dashboardData.analyzed.length,
                toApply: dashboardData.toApply.length,
                applied: dashboardData.applied.length,
                interviewed: dashboardData.interviewed.length,
                offers: dashboardData.offers.length,
                rejected: dashboardData.rejected.length
            });
        } else {
            console.log('ℹ️ No saved analyses found');
        }
        
        // Save to localStorage for offline access
        saveDashboardData();
        
    } catch (error) {
        console.error('❌ Error in loadDashboardData:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

/**
 * Save dashboard data to localStorage (for offline access)
 */
function saveDashboardData() {
    saveToLocal('dashboardData', dashboardData);
}

/**
 * Save status update to Supabase
 */
async function updateJobStatusInSupabase(jobId, newStatus) {
    try {
        const { error } = await supabase
            .from('analyses')
            .update({ status: newStatus })
            .eq('id', jobId);
        
        if (error) {
            console.error('Error updating status in Supabase:', error);
            return false;
        } else {
            console.log(`✅ Updated job ${jobId} status to ${newStatus}`);
            return true;
        }
    } catch (error) {
        console.error('Error updating Supabase:', error);
        return false;
    }
}

/**
 * Render all dashboard sections
 */
function renderAllSections() {
    console.log('🎨 Rendering all sections...');
    renderSection('analyzed', dashboardData.analyzed);
    renderSection('toApply', dashboardData.toApply);
    renderSection('applied', dashboardData.applied);
    renderSection('interviewed', dashboardData.interviewed);
    renderSection('offers', dashboardData.offers);
    renderSection('rejected', dashboardData.rejected);
}

/**
 * Render a specific dashboard section
 */
function renderSection(sectionId, jobs) {
    const container = document.getElementById(`${sectionId}Section`);
    
    if (!container) {
        console.warn(`⚠️ Container not found for section: ${sectionId}`);
        return;
    }
    
    if (jobs.length === 0) {
        const emptyMessages = {
            analyzed: 'No analyzed jobs yet. Start by analyzing a job description!',
            toApply: 'Move jobs here when you\'re ready to apply.',
            applied: 'No applications submitted yet.',
            interviewed: 'No interviews scheduled yet.',
            offers: 'No offers received yet.',
            rejected: 'No rejections tracked.'
        };
        container.innerHTML = `<p style="color: var(--text-secondary);">${emptyMessages[sectionId]}</p>`;
        return;
    }
    
    container.innerHTML = jobs.map(job => createJobCard(job, sectionId)).join('');
    
    // ✅ CRITICAL: Add event listeners AFTER HTML is rendered
    jobs.forEach(job => {
        const card = document.querySelector(`[data-job-id="${job.id}"][data-status="${sectionId}"]`);
        if (!card) {
            console.warn(`⚠️ Card not found for job ${job.id} in ${sectionId}`);
            return;
        }
        
        console.log(`✅ Adding listeners to job ${job.id} in ${sectionId}`);
        
        // Click on card to open details
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.job-actions') && !e.target.closest('.icon-btn')) {
                openJobDetailModal(job, sectionId);
            }
        });
        
        // ✅ Get the action buttons
        const moveBtn = card.querySelector('[data-action="move"]');
        const duplicateBtn = card.querySelector('[data-action="duplicate"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        
        // ✅ Add click handlers - Make sure to stop propagation
        if (moveBtn) {
            moveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔄 Move button clicked for job:', job.id);
                currentJobForModal = { job, status: sectionId };
                openMoveJobModal();
            });
        }
        
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('📋 Duplicate button clicked for job:', job.id);
                duplicateJob(job.id, sectionId);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Delete button clicked for job:', job.id);
                if (confirm('⚠️ Delete this job analysis?\n\nThis cannot be undone. Consider moving it to "Rejected" instead if you want to keep the analysis.')) {
                    deleteJob(job.id, sectionId);
                }
            });
        }
    });
}

/**
 * Create job card HTML
 */
function createJobCard(job, status) {
    const jobTitle = extractJobTitle(job.jobDescription);
    const date = new Date(job.timestamp).toLocaleDateString();
    
    return `
        <div class="job-card" data-job-id="${job.id}" data-status="${status}">
            <div class="job-card-header">
                <div>
                    <div class="job-title">${jobTitle}</div>
                    <div class="job-company" style="margin-top: 0.25rem;">
                        ${job.tone || 'brutal-truth'} • ${job.persona || job.tone || 'brutal-truth'}
                    </div>
                </div>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                Added: ${date}
            </p>
            <div class="job-actions">
                <button class="icon-btn" data-action="move" title="Move to another stage">
                    ➡️
                </button>
                <button class="icon-btn" data-action="duplicate" title="Duplicate this analysis">
                    📋
                </button>
                <button class="icon-btn" data-action="delete" title="Delete permanently">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

/**
 * Extract job title from description
 */
function extractJobTitle(description) {
    const lines = description.split('\n');
    for (let line of lines.slice(0, 5)) {
        if (line.trim() && !line.startsWith('http')) {
            return line.trim().substring(0, 60) + (line.length > 60 ? '...' : '');
        }
    }
    return 'Job Position';
}

/**
 * Update statistics
 */
function updateStats() {
    const statElements = {
        statAnalyzed: dashboardData.analyzed.length,
        statToApply: dashboardData.toApply.length,
        statApplied: dashboardData.applied.length,
        statInterviewed: dashboardData.interviewed.length,
        statOffers: dashboardData.offers.length,
        statRejected: dashboardData.rejected.length
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    console.log('📊 Stats updated:', statElements);
}

/**
 * Open job detail modal
 */
function openJobDetailModal(job, currentStatus) {
    currentJobForModal = { job, status: currentStatus };
    
    const modal = document.getElementById('jobDetailModal');
    const title = document.getElementById('modalJobTitle');
    const content = document.getElementById('modalJobContent');
    
    if (!modal || !title || !content) return;
    
    title.textContent = extractJobTitle(job.jobDescription);
    
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Status:</strong> ${formatStatus(currentStatus)}<br>
            <strong>Analyzed:</strong> ${new Date(job.timestamp).toLocaleString()}<br>
            <strong>Tone:</strong> ${job.tone || 'brutal-truth'}<br>
            <strong>Persona:</strong> ${job.persona || job.tone || 'brutal-truth'}
        </div>
        <div style="background: var(--surface); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
            <strong>Job Description:</strong>
            <p style="white-space: pre-wrap; margin-top: 0.5rem; color: var(--text-secondary); max-height: 150px; overflow-y: auto;">
                ${job.jobDescription}
            </p>
        </div>
        <div style="background: var(--surface); padding: 1rem; border-radius: 6px;">
            <strong>Analysis:</strong>
            <div style="white-space: pre-wrap; margin-top: 0.5rem; color: var(--text-secondary);">
                ${job.analysis}
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    const moveBtn = document.getElementById('modalMoveBtn');
    const duplicateBtn = document.getElementById('modalDuplicateBtn');
    const deleteBtn = document.getElementById('modalDeleteBtn');
    
    if (moveBtn) {
        moveBtn.onclick = () => {
            closeJobDetailModal();
            openMoveJobModal();
        };
    }
    
    if (duplicateBtn) {
        duplicateBtn.onclick = () => {
            duplicateJob(job.id, currentStatus);
            closeJobDetailModal();
        };
    }
    
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm('⚠️ Delete this job analysis?\n\nThis cannot be undone. Consider moving it to "Rejected" instead if you want to keep the analysis.')) {
                deleteJob(job.id, currentStatus);
                closeJobDetailModal();
            }
        };
    }
}

/**
 * Close job detail modal
 */
function closeJobDetailModal() {
    const modal = document.getElementById('jobDetailModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Format status for display
 */
function formatStatus(status) {
    const statusMap = {
        analyzed: '📂 Analyzed',
        toApply: '🕓 To Apply',
        applied: '✅ Applied',
        interviewed: '💬 Interviewed',
        offers: '🏆 Offers',
        rejected: '❌ Rejected'
    };
    return statusMap[status] || status;
}

/**
 * Open move job modal
 */
function openMoveJobModal() {
    console.log('📂 Opening move modal for job:', currentJobForModal);
    const modal = document.getElementById('moveJobModal');
    if (modal) {
        modal.classList.add('active');
        // Re-setup handlers each time modal opens (in case DOM was updated)
        setupMoveModalHandlers();
    } else {
        console.error('❌ Move modal not found in DOM');
    }
}

/**
 * Close move job modal
 */
function closeMoveJobModal() {
    const modal = document.getElementById('moveJobModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Move job to different status
 */
async function moveJobTo(newStatus) {
    console.log('🚀 Moving job to:', newStatus);
    
    if (!currentJobForModal) {
        console.error('❌ No job selected to move');
        return;
    }
    
    const { job, status: oldStatus } = currentJobForModal;
    
    console.log(`Moving job ${job.id} from ${oldStatus} to ${newStatus}`);
    
    // Don't move if already in that status
    if (oldStatus === newStatus) {
        console.log('ℹ️ Job already in that status');
        closeMoveJobModal();
        return;
    }
    
    // Remove from old status
    const oldIndex = dashboardData[oldStatus].findIndex(j => j.id === job.id);
    if (oldIndex !== -1) {
        dashboardData[oldStatus].splice(oldIndex, 1);
        console.log(`✅ Removed from ${oldStatus}`);
    }
    
    // Add to new status
    job.status = newStatus;
    dashboardData[newStatus].push(job);
    console.log(`✅ Added to ${newStatus}`);
    
    // Update in Supabase
    const success = await updateJobStatusInSupabase(job.id, newStatus);
    
    if (success) {
        // Save to localStorage
        saveDashboardData();
        
        // Re-render sections
        renderAllSections();
        updateStats();
        
        // Close modals
        closeMoveJobModal();
        closeJobDetailModal();
        
        showToast(`✅ Moved to ${formatStatus(newStatus)}!`);
        console.log('✅ Move completed successfully');
    } else {
        // Revert on error
        dashboardData[newStatus] = dashboardData[newStatus].filter(j => j.id !== job.id);
        job.status = oldStatus;
        dashboardData[oldStatus].push(job);
        showToast('❌ Error moving job. Please try again.', 'error');
        console.error('❌ Move failed, reverted');
    }
}

/**
 * Duplicate job
 */
async function duplicateJob(jobId, status) {
    console.log(`📋 Duplicating job ${jobId} from ${status}`);
    
    const job = dashboardData[status].find(j => j.id == jobId);
    if (!job) {
        console.error('❌ Job not found for duplication');
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    // Create duplicate with new ID and timestamp
    const duplicate = {
        ...job,
        id: Date.now(), // Temporary ID for UI
        timestamp: new Date().toISOString()
    };
    
    console.log('Creating duplicate:', duplicate);
    
    try {
        // Save to Supabase first
        const { data, error } = await supabase
            .from('analyses')
            .insert([{
                user_id: window.currentUser.id,
                job_description: duplicate.jobDescription,
                analysis_result: duplicate.analysis,
                tone: duplicate.tone,
                persona: duplicate.persona,
                status: status,
                created_at: duplicate.timestamp
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error duplicating in Supabase:', error);
            showToast('❌ Error duplicating job', 'error');
            return;
        }
        
        // Use the real ID from Supabase
        duplicate.id = data.id;
        console.log('✅ Duplicate saved to Supabase with ID:', data.id);
        
        // Add to dashboard
        dashboardData[status].push(duplicate);
        
        // Save to localStorage
        saveDashboardData();
        
        // Re-render section
        renderSection(status, dashboardData[status]);
        updateStats();
        
        showToast('✅ Job duplicated successfully!');
        console.log('✅ Duplication completed');
        
    } catch (error) {
        console.error('❌ Error in duplicateJob:', error);
        showToast('❌ Error duplicating job', 'error');
    }
}

/**
 * Delete job - PERMANENTLY DELETES (no trash/undo)
 */
async function deleteJob(jobId, status) {
    console.log(`🗑️ Deleting job ${jobId} from ${status}`);
    
    const index = dashboardData[status].findIndex(j => j.id == jobId);
    if (index === -1) {
        console.error('❌ Job not found for deletion');
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    // Store job in case we need to restore on error
    const deletedJob = dashboardData[status][index];
    
    // Remove from UI immediately
    dashboardData[status].splice(index, 1);
    renderSection(status, dashboardData[status]);
    updateStats();
    
    console.log('🗑️ Removed from UI, deleting from Supabase...');
    
    try {
        // Delete from Supabase (PERMANENT)
        const { error } = await supabase
            .from('analyses')
            .delete()
            .eq('id', jobId);
        
        if (error) {
            console.error('❌ Error deleting from Supabase:', error);
            // Restore the job
            dashboardData[status].splice(index, 0, deletedJob);
            renderSection(status, dashboardData[status]);
            updateStats();
            showToast('❌ Error deleting job. Please try again.', 'error');
        } else {
            console.log(`✅ Deleted job ${jobId} from Supabase`);
            saveDashboardData();
            showToast('🗑️ Job deleted permanently');
        }
    } catch (error) {
        console.error('❌ Error deleting:', error);
        // Restore the job
        dashboardData[status].splice(index, 0, deletedJob);
        renderSection(status, dashboardData[status]);
        updateStats();
        showToast('❌ Error deleting job. Please try again.', 'error');
    }
}
