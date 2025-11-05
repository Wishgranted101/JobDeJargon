/**
 * Dashboard Logic - Job Application Tracker
 * FIXED: Works with existing HTML onclick handlers
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
    
    // First, check if the session is already loaded
    if (window.currentUser && window.currentUser.id) {
        console.log('✅ User session already loaded, initializing dashboard...');
        initializeDashboard();
    } else {
        console.log('⏳ Waiting for userSessionChanged event...');
        window.addEventListener('userSessionChanged', () => {
            console.log('✅ userSessionChanged event received!');
            initializeDashboard();
        }, { once: true });
    }

    // Timeout check
    setTimeout(() => {
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ Session check timed out after 3 seconds.');
            hideLoadingState();
            showToast('Please log in to view your dashboard', 'warning');
        }
    }, 3000);
});

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    if (!window.currentUser || !window.currentUser.id) {
        console.error('❌ Cannot initialize dashboard - no user session');
        return;
    }
    
    console.log('✅ Auth confirmed. Loading dashboard data...');
    showLoadingState();
    await loadDashboardData();
    renderAllSections();
    updateStats();
    hideLoadingState();
    console.log('✅ Dashboard loaded successfully');
}

/**
 * Show loading state
 */
function showLoadingState() {
    const container = document.querySelector('.container') || document.body;
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
    
    try {
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ User not logged in');
            showToast('Please log in to view your dashboard', 'warning');
            return;
        }
        
        console.log('✅ User ID:', window.currentUser.id);
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
                
                const status = job.status || 'analyzed';
                if (dashboardData[status]) {
                    dashboardData[status].push(job);
                    console.log(`📌 Added job to ${status}:`, job.id);
                }
            });
        }
        
        saveDashboardData();
        
    } catch (error) {
        console.error('❌ Error in loadDashboardData:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

/**
 * Save to localStorage
 */
function saveDashboardData() {
    saveToLocal('dashboardData', dashboardData);
}

/**
 * Update job status in Supabase
 */
async function updateJobStatusInSupabase(jobId, newStatus) {
    try {
        console.log(`📡 Updating Supabase: job ${jobId} → ${newStatus}`);
        const { error } = await supabase
            .from('analyses')
            .update({ status: newStatus })
            .eq('id', jobId);
        
        if (error) {
            console.error('❌ Supabase update error:', error);
            return false;
        }
        console.log(`✅ Supabase updated successfully`);
        return true;
    } catch (error) {
        console.error('❌ Error updating Supabase:', error);
        return false;
    }
}

/**
 * Render all sections
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
 * Render a section
 */
function renderSection(sectionId, jobs) {
    const container = document.getElementById(`${sectionId}Section`);
    
    if (!container) {
        console.warn(`⚠️ Container not found: ${sectionId}`);
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
    
    // Add event listeners after rendering
    jobs.forEach(job => {
        attachJobCardListeners(job.id, sectionId);
    });
}

/**
 * Attach event listeners to a job card
 */
function attachJobCardListeners(jobId, status) {
    const card = document.querySelector(`[data-job-id="${jobId}"]`);
    if (!card) {
        console.warn(`⚠️ Card not found: ${jobId}`);
        return;
    }
    
    // Click card to open details
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.job-actions')) {
            const job = dashboardData[status].find(j => j.id === jobId);
            if (job) openJobDetailModal(job, status);
        }
    });
    
    // Move button
    const moveBtn = card.querySelector('[data-action="move"]');
    if (moveBtn) {
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            const job = dashboardData[status].find(j => j.id === jobId);
            if (job) {
                currentJobForModal = { job, status };
                console.log('🔄 Move clicked, set currentJobForModal:', currentJobForModal);
                openMoveJobModal();
            }
        };
    }
    
    // Duplicate button
    const duplicateBtn = card.querySelector('[data-action="duplicate"]');
    if (duplicateBtn) {
        duplicateBtn.onclick = (e) => {
            e.stopPropagation();
            console.log('📋 Duplicate clicked for:', jobId);
            duplicateJob(jobId, status);
        };
    }
    
    // Delete button
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            console.log('🗑️ Delete clicked for:', jobId);
            if (confirm('⚠️ Delete this job analysis?\n\nThis cannot be undone. Consider moving it to "Rejected" instead.')) {
                deleteJob(jobId, status);
            }
        };
    }
}

/**
 * Create job card HTML
 */
function createJobCard(job, status) {
    const jobTitle = extractJobTitle(job.jobDescription);
    const date = new Date(job.timestamp).toLocaleDateString();
    
    return `
        <div class="job-card" data-job-id="${job.id}">
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
 * Extract job title
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
 * Update stats
 */
function updateStats() {
    document.getElementById('statAnalyzed').textContent = dashboardData.analyzed.length;
    document.getElementById('statToApply').textContent = dashboardData.toApply.length;
    document.getElementById('statApplied').textContent = dashboardData.applied.length;
    document.getElementById('statInterviewed').textContent = dashboardData.interviewed.length;
    document.getElementById('statOffers').textContent = dashboardData.offers.length;
    document.getElementById('statRejected').textContent = dashboardData.rejected.length;
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
    
    // Set up modal button handlers
    document.getElementById('modalMoveBtn').onclick = () => {
        closeJobDetailModal();
        openMoveJobModal();
    };
    
    document.getElementById('modalDuplicateBtn').onclick = () => {
        duplicateJob(job.id, currentStatus);
        closeJobDetailModal();
    };
    
    document.getElementById('modalDeleteBtn').onclick = () => {
        if (confirm('⚠️ Delete this job analysis?\n\nThis cannot be undone. Consider moving it to "Rejected" instead.')) {
            deleteJob(job.id, currentStatus);
            closeJobDetailModal();
        }
    };
}

/**
 * Close job detail modal
 */
function closeJobDetailModal() {
    const modal = document.getElementById('jobDetailModal');
    if (modal) modal.classList.remove('active');
}

/**
 * Format status
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
    console.log('📂 Opening move modal. Current job:', currentJobForModal);
    const modal = document.getElementById('moveJobModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('❌ Move modal not found');
    }
}

/**
 * Close move job modal
 */
function closeMoveJobModal() {
    const modal = document.getElementById('moveJobModal');
    if (modal) modal.classList.remove('active');
}

/**
 * Move job to different status - Called by HTML onclick
 */
async function moveJobTo(newStatus) {
    console.log('🚀 ============ MOVE STARTED ============');
    console.log('🚀 Target status:', newStatus);
    console.log('🚀 currentJobForModal:', currentJobForModal);
    
    if (!currentJobForModal) {
        console.error('❌ No job selected to move!');
        console.error('❌ currentJobForModal is null/undefined');
        showToast('Error: No job selected', 'error');
        closeMoveJobModal();
        return;
    }
    
    const { job, status: oldStatus } = currentJobForModal;
    
    console.log(`🚀 Moving job ${job.id} from "${oldStatus}" to "${newStatus}"`);
    console.log(`🚀 Job data:`, job);
    
    // Don't move if already in that status
    if (oldStatus === newStatus) {
        console.log('ℹ️ Already in that status, aborting');
        closeMoveJobModal();
        showToast('Job is already in that status', 'info');
        return;
    }
    
    // Remove from old array
    console.log(`🚀 Searching for job in ${oldStatus} array...`);
    console.log(`🚀 Array contents:`, dashboardData[oldStatus].map(j => ({ id: j.id, title: extractJobTitle(j.jobDescription) })));
    
    const oldIndex = dashboardData[oldStatus].findIndex(j => j.id === job.id);
    console.log(`🚀 Found at index: ${oldIndex}`);
    
    if (oldIndex !== -1) {
        dashboardData[oldStatus].splice(oldIndex, 1);
        console.log(`✅ Removed from ${oldStatus}`);
        console.log(`✅ ${oldStatus} array now has ${dashboardData[oldStatus].length} items`);
    } else {
        console.warn(`⚠️ Job not found in ${oldStatus} array!`);
    }
    
    // Add to new array
    job.status = newStatus;
    dashboardData[newStatus].push(job);
    console.log(`✅ Added to ${newStatus}`);
    console.log(`✅ ${newStatus} array now has ${dashboardData[newStatus].length} items`);
    
    // Update Supabase
    console.log(`🚀 Updating Supabase...`);
    const success = await updateJobStatusInSupabase(job.id, newStatus);
    console.log(`🚀 Supabase update result: ${success}`);
    
    if (success) {
        console.log(`✅ Move successful, saving and re-rendering...`);
        saveDashboardData();
        renderAllSections();
        updateStats();
        closeMoveJobModal();
        closeJobDetailModal();
        showToast(`✅ Moved to ${formatStatus(newStatus)}!`);
        console.log('✅ Move completed successfully');
    } else {
        console.error(`❌ Supabase update failed, reverting...`);
        // Revert on error
        dashboardData[newStatus] = dashboardData[newStatus].filter(j => j.id !== job.id);
        job.status = oldStatus;
        dashboardData[oldStatus].push(job);
        renderAllSections();
        updateStats();
        showToast('❌ Error moving job. Please try again.', 'error');
        console.error('❌ Move failed and reverted');
    }
    
    console.log('🚀 ============ MOVE ENDED ============');
}(job);
    console.log(`✅ Added to ${newStatus}`);
    
    // Update Supabase
    const success = await updateJobStatusInSupabase(job.id, newStatus);
    
    if (success) {
        saveDashboardData();
        renderAllSections();
        updateStats();
        closeMoveJobModal();
        closeJobDetailModal();
        showToast(`✅ Moved to ${formatStatus(newStatus)}!`);
        console.log('✅ Move completed');
    } else {
        // Revert on error
        dashboardData[newStatus] = dashboardData[newStatus].filter(j => j.id !== job.id);
        job.status = oldStatus;
        dashboardData[oldStatus].push(job);
        renderAllSections();
        updateStats();
        showToast('❌ Error moving job. Please try again.', 'error');
        console.error('❌ Move failed, reverted');
    }
}

/**
 * Duplicate job
 */
async function duplicateJob(jobId, status) {
    console.log(`📋 ============ DUPLICATE STARTED ============`);
    console.log(`📋 Job ID: ${jobId}`);
    console.log(`📋 Status: ${status}`);
    
    const job = dashboardData[status].find(j => j.id == jobId);
    console.log(`📋 Found job:`, job);
    
    if (!job) {
        console.error('❌ Job not found for duplication');
        console.log('❌ All jobs in status:', dashboardData[status].map(j => j.id));
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    try {
        console.log(`📋 Creating duplicate in Supabase...`);
        console.log(`📋 User ID:`, window.currentUser?.id);
        
        const insertData = {
            user_id: window.currentUser.id,
            job_description: job.jobDescription,
            analysis_result: job.analysis,
            tone: job.tone,
            persona: job.persona,
            status: status,
            created_at: new Date().toISOString()
        };
        console.log(`📋 Insert data:`, insertData);
        
        const { data, error } = await supabase
            .from('analyses')
            .insert([insertData])
            .select()
            .single();
        
        console.log(`📋 Supabase response:`, { data, error });
        
        if (error) {
            console.error('❌ Duplicate error:', error);
            console.error('❌ Error details:', JSON.stringify(error));
            showToast('❌ Error duplicating job', 'error');
            return;
        }
        
        console.log('✅ Duplicate saved with ID:', data.id);
        
        // Add to dashboard
        const duplicate = {
            id: data.id,
            jobDescription: job.jobDescription,
            analysis: job.analysis,
            tone: job.tone,
            persona: job.persona,
            timestamp: data.created_at,
            status: status
        };
        
        console.log(`📋 Adding to dashboard array:`, duplicate);
        dashboardData[status].push(duplicate);
        
        console.log(`📋 Re-rendering section...`);
        saveDashboardData();
        renderSection(status, dashboardData[status]);
        updateStats();
        
        showToast('✅ Job duplicated successfully!');
        console.log(`📋 ============ DUPLICATE ENDED ============`);
        
    } catch (error) {
        console.error('❌ Exception during duplicate:', error);
        console.error('❌ Error stack:', error.stack);
        showToast('❌ Error duplicating job', 'error');
    }
}

/**
 * Delete job permanently
 */
async function deleteJob(jobId, status) {
    console.log(`🗑️ ============ DELETE STARTED ============`);
    console.log(`🗑️ Job ID: ${jobId}`);
    console.log(`🗑️ Status: ${status}`);
    console.log(`🗑️ Current data in ${status}:`, dashboardData[status]);
    
    const index = dashboardData[status].findIndex(j => j.id == jobId);
    console.log(`🗑️ Found at index: ${index}`);
    
    if (index === -1) {
        console.error('❌ Job not found in array!');
        console.log('❌ All jobs in status:', dashboardData[status].map(j => j.id));
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    const deletedJob = dashboardData[status][index];
    console.log(`🗑️ Deleting job:`, deletedJob);
    
    // Remove from UI
    console.log(`🗑️ Removing from array...`);
    dashboardData[status].splice(index, 1);
    console.log(`🗑️ Array after removal:`, dashboardData[status]);
    
    console.log(`🗑️ Re-rendering section...`);
    renderSection(status, dashboardData[status]);
    updateStats();
    console.log(`🗑️ UI updated`);
    
    try {
        console.log(`🗑️ Attempting Supabase delete...`);
        console.log(`🗑️ Supabase available?`, typeof supabase !== 'undefined');
        console.log(`🗑️ Job ID type:`, typeof jobId, jobId);
        
        const { data, error } = await supabase
            .from('analyses')
            .delete()
            .eq('id', jobId)
            .select();
        
        console.log(`🗑️ Supabase response:`, { data, error });
        
        if (error) {
            console.error('❌ Supabase delete error:', error);
            console.error('❌ Error details:', JSON.stringify(error));
            // Restore on error
            dashboardData[status].splice(index, 0, deletedJob);
            renderSection(status, dashboardData[status]);
            updateStats();
            showToast('❌ Error deleting from database. Job restored.', 'error');
        } else {
            console.log(`✅ Successfully deleted from Supabase!`);
            console.log(`✅ Deleted data:`, data);
            saveDashboardData();
            showToast('🗑️ Job deleted permanently');
        }
    } catch (error) {
        console.error('❌ Exception during delete:', error);
        console.error('❌ Error stack:', error.stack);
        // Restore on error
        dashboardData[status].splice(index, 0, deletedJob);
        renderSection(status, dashboardData[status]);
        updateStats();
        showToast('❌ Error deleting job. Job restored.', 'error');
    }
    
    console.log(`🗑️ ============ DELETE ENDED ============`);
}
