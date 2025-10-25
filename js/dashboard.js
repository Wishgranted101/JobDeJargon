/**
 * Dashboard Logic - Job Application Tracker
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
    loadDashboardData();
    renderAllSections();
    updateStats();
});

/**
 * Load dashboard data from localStorage
 */
function loadDashboardData() {
    const savedJobs = loadFromLocal('savedJobs') || [];
    const existingData = loadFromLocal('dashboardData');
    
    if (existingData) {
        dashboardData = existingData;
    }
    
    savedJobs.forEach(job => {
        const exists = Object.values(dashboardData).flat().some(j => j.id === job.id);
        if (!exists) {
            job.status = 'analyzed';
            dashboardData.analyzed.push(job);
        }
    });
    
    saveDashboardData();
}

/**
 * Save dashboard data to localStorage
 */
function saveDashboardData() {
    saveToLocal('dashboardData', dashboardData);
}

/**
 * Render all dashboard sections
 */
function renderAllSections() {
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
                        ${job.tone} • ${job.persona}
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
    document.getElementById('statAnalyzed').textContent = dashboardData.analyzed.length;
    document.getElementById('statApplied').textContent = dashboardData.applied.length;
    document.getElementById('statInterviewed').textContent = dashboardData.interviewed.length;
    document.getElementById('statOffers').textContent = dashboardData.offers.length;
}

/**
 * Open job detail modal
 */
function openJobDetailModal(job, currentStatus) {
    currentJobForModal = { job, status: currentStatus };
    
    const modal = document.getElementById('jobDetailModal');
    const title = document.getElementById('modalJobTitle');
    const content = document.getElementById('modalJobContent');
    
    title.textContent = extractJobTitle(job.jobDescription);
    
    content.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Status:</strong> ${formatStatus(currentStatus)}<br>
            <strong>Analyzed:</strong> ${new Date(job.timestamp).toLocaleString()}<br>
            <strong>Tone:</strong> ${job.tone}<br>
            <strong>Persona:</strong> ${job.persona}
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
        closeMoveJobModalAndOpen();
    };
    
    document.getElementById('modalDuplicateBtn').onclick = () => {
        duplicateJob(job.id, currentStatus);
        closeJobDetailModal();
    };
    
    document.getElementById('modalDeleteBtn').onclick = () => {
        if (confirm('Are you sure you want to delete this job?')) {
            deleteJob(job.id, currentStatus);
            closeJobDetailModal();
        }
    };
}

/**
 * Close job detail modal
 */
function closeJobDetailModal() {
    document.getElementById('jobDetailModal').classList.remove('active');
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
function closeMoveJobModalAndOpen() {
    document.getElementById('moveJobModal').classList.add('active');
}

/**
 * Close move job modal
 */
function closeMoveJobModal() {
    document.getElementById('moveJobModal').classList.remove('active');
}

/**
 * Move job to different status
 */
function moveJobTo(newStatus) {
    if (!currentJobForModal) return;
    
    const { job, status: oldStatus } = currentJobForModal;
    
    const oldIndex = dashboardData[oldStatus].findIndex(j => j.id === job.id);
    if (oldIndex !== -1) {
        dashboardData[oldStatus].splice(oldIndex, 1);
    }
    
    job.status = newStatus;
    dashboardData[newStatus].push(job);
    
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
function quickMove(jobId, currentStatus) {
    const statusCycle = ['analyzed', 'toApply', 'applied', 'interviewed', 'offers'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    const jobIndex = dashboardData[currentStatus].findIndex(j => j.id == jobId);
    if (jobIndex !== -1) {
        const job = dashboardData[currentStatus][jobIndex];
        dashboardData[currentStatus].splice(jobIndex, 1);
        job.status = nextStatus;
        dashboardData[nextStatus].push(job);
        
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
function deleteJob(jobId, status) {
    const index = dashboardData[status].findIndex(j => j.id == jobId);
    if (index !== -1) {
        dashboardData[status].splice(index, 1);
        
        saveDashboardData();
        renderSection(status, dashboardData[status]);
        updateStats();
        
        showToast('Job deleted!');
    }
}
