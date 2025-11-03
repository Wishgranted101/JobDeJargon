/**
 * Dashboard Logic - Job Application Tracker
 * FIXED: Now loads from Supabase with detailed logging
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
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initializing...');
    
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
});

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
        
        // Also load any localStorage data (for backward compatibility)
        const localData = loadFromLocal('dashboardData');
        if (localData) {
            console.log('📦 Found localStorage data, merging...');
            Object.keys(localData).forEach(status => {
                localData[status].forEach(job => {
                    // Only add if not already loaded from Supabase
                    const exists = dashboardData[status].some(j => j.id === job.id);
                    if (!exists) {
                        dashboardData[status].push(job);
                        console.log(`📌 Merged localStorage job to ${status}:`, job.id);
                    }
                });
            });
        }
        
        // Save merged data back to localStorage
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
        } else {
            console.log(`✅ Updated job ${jobId} status to ${newStatus}`);
        }
    } catch (error) {
        console.error('Error updating Supabase:', error);
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
    
    jobs.forEach(job => {
        const card = document.querySelector(`[data-job-id="${job.id}"]`);
        if (card) {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.job-actions')) {
                    openJobDetailModal(job, sectionId);
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
                <button class="icon-btn" onclick="event.stopPropagation(); quickMove('${job.id}', '${status}')" title="Move">
                    ➡️
                </button>
                <button class="icon-btn" onclick="event.stopPropagation(); duplicateJob('${job.id}', '${status}')" title="Duplicate">
                    📋
                </button>
                <button class="icon-btn" onclick="event.stopPropagation(); deleteJob('${job.id}', '${status}')" title="Delete">
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
            if (confirm('Are you sure you want to delete this job?')) {
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
    const modal = document.getElementById('moveJobModal');
    if (modal) {
        modal.classList.add('active');
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
    if (!currentJobForModal) return;
    
    const { job, status: oldStatus } = currentJobForModal;
    
    const oldIndex = dashboardData[oldStatus].findIndex(j => j.id === job.id);
    if (oldIndex !== -1) {
        dashboardData[oldStatus].splice(oldIndex, 1);
    }
    
    job.status = newStatus;
    dashboardData[newStatus].push(job);
    
    // Update in Supabase
    await updateJobStatusInSupabase(job.id, newStatus);
    
    saveDashboardData();
    renderAllSections();
    updateStats();
    
    closeMoveJobModal();
    closeJobDetailModal();
    
    showToast(`Moved to ${formatStatus(newStatus)}!`);
}

/**
 * Quick move (cycles through statuses)
 */
async function quickMove(jobId, currentStatus) {
    const statusCycle = ['analyzed', 'toApply', 'applied', 'interviewed', 'offers'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    const jobIndex = dashboardData[currentStatus].findIndex(j => j.id == jobId);
    if (jobIndex !== -1) {
        const job = dashboardData[currentStatus][jobIndex];
        dashboardData[currentStatus].splice(jobIndex, 1);
        job.status = nextStatus;
        dashboardData[nextStatus].push(job);
        
        // Update in Supabase
        await updateJobStatusInSupabase(job.id, nextStatus);
        
        saveDashboardData();
        renderAllSections();
        updateStats();
        
        showToast(`Moved to ${formatStatus(nextStatus)}!`);
    }
}

/**
 * Duplicate job
 */
function duplicateJob(jobId, status) {
    const job = dashboardData[status].find(j => j.id == jobId);
    if (job) {
        const duplicate = {
            ...job,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };
        dashboardData[status].push(duplicate);
        
        saveDashboardData();
        renderSection(status, dashboardData[status]);
        updateStats();
        
        showToast('Job duplicated!');
    }
}

/**
 * Delete job
 */
async function deleteJob(jobId, status) {
    const index = dashboardData[status].findIndex(j => j.id == jobId);
    if (index !== -1) {
        dashboardData[status].splice(index, 1);
        
        // Delete from Supabase
        try {
            const { error } = await supabase
                .from('analyses')
                .delete()
                .eq('id', jobId);
            
            if (error) {
                console.error('Error deleting from Supabase:', error);
            } else {
                console.log(`✅ Deleted job ${jobId} from Supabase`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
        }
        
        saveDashboardData();
        renderSection(status, dashboardData[status]);
        updateStats();
        
        showToast('Job deleted!');
    }
}
