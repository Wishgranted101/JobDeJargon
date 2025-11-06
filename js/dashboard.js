/**
 * Dashboard Logic - Job Application Tracker
 * WITH COLLAPSIBLE SECTIONS - Clean, organized view
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

// Track which sections are collapsed (saved in localStorage)
let collapsedSections = loadFromLocal('collapsedSections') || {
    analyzed: false,
    toApply: false,
    applied: true,  // Default: collapsed
    interviewed: true,  // Default: collapsed
    offers: false,
    rejected: true  // Default: collapsed
};

/**
 * Initialize dashboard
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard page loaded, waiting for auth...');
    
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

    setTimeout(() => {
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ Session check timed out after 3 seconds.');
            hideLoadingState();
            showToast('Please log in to view your dashboard', 'warning');
        }
    }, 3000);
});

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
    setupCollapseListeners();
    hideLoadingState();
    console.log('✅ Dashboard loaded successfully');
}

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

function hideLoadingState() {
    const loading = document.getElementById('dashboardLoading');
    if (loading) loading.remove();
}

async function loadDashboardData() {
    console.log('🔍 ============ LOADING DATA ============');
    
    try {
        if (!window.currentUser || !window.currentUser.id) {
            console.error('❌ User not logged in');
            showToast('Please log in to view your dashboard', 'warning');
            return;
        }
        
        console.log('✅ User ID:', window.currentUser.id);
        console.log('📡 Fetching ALL data from Supabase...');
        
        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('created_at', { ascending: false });
        
        console.log('📥 Supabase returned:', data?.length || 0, 'analyses');
        
        if (error) {
            console.error('❌ Error loading from Supabase:', error);
            showToast('Error loading saved analyses', 'error');
            return;
        }
        
        if (!data || data.length === 0) {
            console.log('ℹ️ No analyses found in Supabase');
            return;
        }
        
        console.log('🔄 Rebuilding dashboard data...');
        dashboardData = {
            analyzed: [],
            toApply: [],
            applied: [],
            interviewed: [],
            offers: [],
            rejected: []
        };
        
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
            }
        });
        
        console.log('✅ Data loaded successfully:');
        console.log('  📂 Analyzed:', dashboardData.analyzed.length);
        console.log('  🕓 To Apply:', dashboardData.toApply.length);
        console.log('  ✅ Applied:', dashboardData.applied.length);
        console.log('  💬 Interviewed:', dashboardData.interviewed.length);
        console.log('  🏆 Offers:', dashboardData.offers.length);
        console.log('  ❌ Rejected:', dashboardData.rejected.length);
        console.log('🔍 ============ LOADING COMPLETE ============');
        
        saveDashboardData();
        
    } catch (error) {
        console.error('❌ Exception in loadDashboardData:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

function saveDashboardData() {
    saveToLocal('dashboardData', dashboardData);
}

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
        console.error('❌ Exception updating Supabase:', error);
        return false;
    }
}

/**
 * 📁 Setup collapse/expand listeners for section headers
 */
function setupCollapseListeners() {
    const sections = ['analyzed', 'toApply', 'applied', 'interviewed', 'offers', 'rejected'];
    
    sections.forEach(sectionId => {
        const header = document.querySelector(`[data-section="${sectionId}"]`);
        if (header) {
            header.style.cursor = 'pointer';
            header.onclick = () => toggleSection(sectionId);
        }
    });
}

/**
 * 📁 Toggle section collapsed/expanded
 */
function toggleSection(sectionId) {
    collapsedSections[sectionId] = !collapsedSections[sectionId];
    saveToLocal('collapsedSections', collapsedSections);
    updateSectionVisibility(sectionId);
}

/**
 * 📁 Update section visibility and icon
 */
function updateSectionVisibility(sectionId) {
    const container = document.getElementById(`${sectionId}Section`);
    const icon = document.querySelector(`[data-section="${sectionId}"] .collapse-icon`);
    
    if (!container || !icon) return;
    
    const isCollapsed = collapsedSections[sectionId];
    
    if (isCollapsed) {
        container.style.display = 'none';
        icon.textContent = '▶';
    } else {
        container.style.display = 'grid';
        icon.textContent = '▼';
    }
}

function renderAllSections() {
    console.log('🎨 Rendering all sections...');
    const sections = ['analyzed', 'toApply', 'applied', 'interviewed', 'offers', 'rejected'];
    
    sections.forEach(sectionId => {
        renderSection(sectionId, dashboardData[sectionId]);
        updateSectionVisibility(sectionId);
    });
}

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
        container.innerHTML = `<p style="color: var(--text-secondary); grid-column: 1/-1;">${emptyMessages[sectionId]}</p>`;
        return;
    }
    
    container.innerHTML = jobs.map(job => createJobCard(job, sectionId)).join('');
    
    jobs.forEach(job => {
        attachJobCardListeners(job.id, sectionId);
    });
}

function attachJobCardListeners(jobId, status) {
    const card = document.querySelector(`[data-job-id="${jobId}"]`);
    if (!card) {
        console.warn(`⚠️ Card not found: ${jobId}`);
        return;
    }
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.job-actions')) {
            const job = dashboardData[status].find(j => j.id === jobId);
            if (job) openJobDetailModal(job, status);
        }
    });
    
    const moveBtn = card.querySelector('[data-action="move"]');
    if (moveBtn) {
        moveBtn.onclick = (e) => {
            e.stopPropagation();
            const job = dashboardData[status].find(j => j.id === jobId);
            if (job) {
                currentJobForModal = { job, status };
                openMoveJobModal();
            }
        };
    }
    
    const duplicateBtn = card.querySelector('[data-action="duplicate"]');
    if (duplicateBtn) {
        duplicateBtn.onclick = (e) => {
            e.stopPropagation();
            duplicateJob(jobId, status);
        };
    }
    
    const deleteBtn = card.querySelector('[data-action="delete"]');
    if (deleteBtn) {
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm('⚠️ Delete this job analysis?\n\nThis cannot be undone. Consider moving it to "Rejected" instead.')) {
                deleteJob(jobId, status);
            }
        };
    }
}

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

function extractJobTitle(description) {
    const lines = description.split('\n');
    for (let line of lines.slice(0, 5)) {
        if (line.trim() && !line.startsWith('http')) {
            return line.trim().substring(0, 60) + (line.length > 60 ? '...' : '');
        }
    }
    return 'Job Position';
}

function updateStats() {
    document.getElementById('statAnalyzed').textContent = dashboardData.analyzed.length;
    document.getElementById('statToApply').textContent = dashboardData.toApply.length;
    document.getElementById('statApplied').textContent = dashboardData.applied.length;
    document.getElementById('statInterviewed').textContent = dashboardData.interviewed.length;
    document.getElementById('statOffers').textContent = dashboardData.offers.length;
    document.getElementById('statRejected').textContent = dashboardData.rejected.length;
}

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

function closeJobDetailModal() {
    const modal = document.getElementById('jobDetailModal');
    if (modal) modal.classList.remove('active');
}

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

function openMoveJobModal() {
    const modal = document.getElementById('moveJobModal');
    if (modal) modal.classList.add('active');
}

function closeMoveJobModal() {
    const modal = document.getElementById('moveJobModal');
    if (modal) modal.classList.remove('active');
}

async function moveJobTo(newStatus) {
    if (!currentJobForModal) {
        showToast('Error: No job selected', 'error');
        closeMoveJobModal();
        return;
    }
    
    const { job, status: oldStatus } = currentJobForModal;
    
    if (oldStatus === newStatus) {
        closeMoveJobModal();
        return;
    }
    
    const oldIndex = dashboardData[oldStatus].findIndex(j => j.id === job.id);
    if (oldIndex !== -1) {
        dashboardData[oldStatus].splice(oldIndex, 1);
    }
    
    job.status = newStatus;
    dashboardData[newStatus].push(job);
    
    const success = await updateJobStatusInSupabase(job.id, newStatus);
    
    if (success) {
        saveDashboardData();
        renderAllSections();
        updateStats();
        closeMoveJobModal();
        closeJobDetailModal();
        showToast(`✅ Moved to ${formatStatus(newStatus)}!`);
    } else {
        dashboardData[newStatus] = dashboardData[newStatus].filter(j => j.id !== job.id);
        job.status = oldStatus;
        dashboardData[oldStatus].push(job);
        renderAllSections();
        updateStats();
        showToast('❌ Error moving job', 'error');
    }
}

async function duplicateJob(jobId, status) {
    const job = dashboardData[status].find(j => j.id == jobId);
    if (!job) {
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('analyses')
            .insert([{
                user_id: window.currentUser.id,
                job_description: job.jobDescription,
                analysis_result: job.analysis,
                tone: job.tone,
                persona: job.persona,
                status: status,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            showToast('❌ Error duplicating job', 'error');
            return;
        }
        
        const duplicate = {
            id: data.id,
            jobDescription: job.jobDescription,
            analysis: job.analysis,
            tone: job.tone,
            persona: job.persona,
            timestamp: data.created_at,
            status: status
        };
        
        dashboardData[status].push(duplicate);
        saveDashboardData();
        renderSection(status, dashboardData[status]);
        updateStats();
        showToast('✅ Job duplicated!');
        
    } catch (error) {
        showToast('❌ Error duplicating job', 'error');
    }
}

async function deleteJob(jobId, status) {
    const index = dashboardData[status].findIndex(j => j.id == jobId);
    if (index === -1) {
        showToast('❌ Error: Job not found', 'error');
        return;
    }
    
    const deletedJob = dashboardData[status][index];
    
    dashboardData[status].splice(index, 1);
    renderSection(status, dashboardData[status]);
    updateStats();
    
    try {
        const { error } = await supabase
            .from('analyses')
            .delete()
            .eq('id', jobId);
        
        if (error) {
            dashboardData[status].splice(index, 0, deletedJob);
            renderSection(status, dashboardData[status]);
            updateStats();
            showToast('❌ Error deleting. Job restored.', 'error');
        } else {
            saveDashboardData();
            showToast('🗑️ Job deleted permanently');
        }
    } catch (error) {
        dashboardData[status].splice(index, 0, deletedJob);
        renderSection(status, dashboardData[status]);
        updateStats();
        showToast('❌ Error deleting. Job restored.', 'error');
    }
}
