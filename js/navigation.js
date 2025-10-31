// Universal Navigation Component
// Automatically shows/hides navigation items based on login status
// Place this script on EVERY page after supabase-client.js and auth.js

function updateNavigation() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    
    const isLoggedIn = window.currentUser !== null && window.currentUser !== undefined;
    
    if (isLoggedIn) {
        // User is logged in - show full navigation
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="job-analysis.html">Analyze Job</a>
            <a href="dashboard.html">Dashboard</a>
            <a href="settings.html">Settings</a>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${window.currentUser.credits} credits
                </span>
                <button onclick="logout()" class="btn-secondary" style="padding: 0.5rem 1rem;">
                    Logout
                </button>
            </div>
        `;
    } else {
        // User is logged out - show minimal navigation
        nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="signup.html" class="btn-primary">Sign Up</a>
        `;
    }
}

// Run immediately when Supabase loads
if (typeof supabase !== 'undefined') {
    updateNavigation();
}

// Also run after session check completes
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateNavigation();
    }, 1000);
});

// Listen for login/logout events
window.addEventListener('userSessionChanged', () => {
    updateNavigation();
});
