// navigation.js - Universal Navigation (No Flicker Solution)
// This script checks auth INSTANTLY from localStorage and updates navigation BEFORE page renders

(function() {
    'use strict';
    
    // Check if user is logged in by reading Supabase session from localStorage
    function isLoggedInSync() {
        try {
            // Supabase stores session in localStorage with this key pattern
            const keys = Object.keys(localStorage);
            const authKey = keys.find(key => key.includes('supabase.auth.token'));
            
            if (!authKey) return false;
            
            const authData = localStorage.getItem(authKey);
            if (!authData) return false;
            
            const parsed = JSON.parse(authData);
            
            // Check if session exists and hasn't expired
            if (parsed && parsed.access_token && parsed.expires_at) {
                const expiresAt = parsed.expires_at * 1000; // Convert to milliseconds
                const now = Date.now();
                return now < expiresAt;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking auth:', error);
            return false;
        }
    }
    
    // Get user credits from localStorage (if available)
    function getUserCredits() {
        if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            return window.currentUser.credits || 0;
        }
        return 0;
    }
    
    // Update navigation based on auth status
    function updateNavigation() {
        const nav = document.querySelector('.nav');
        if (!nav) return;
        
        const isLoggedIn = isLoggedInSync();
        
        if (isLoggedIn) {
            // LOGGED IN - Show full navigation
            nav.innerHTML = `
                <a href="index.html">Home</a>
                <a href="job-analysis.html">Analyze Job</a>
                <a href="dashboard.html">Dashboard</a>
                <a href="pro-features.html">Pro Features</a>
                <a href="settings.html">Settings</a>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span id="navCredits" style="color: var(--primary); font-size: 0.9rem; font-weight: 600;">
                        💳 <span id="creditCount">0</span> credits
                    </span>
                    <button onclick="logout()" class="btn-secondary" style="padding: 0.5rem 1rem;">
                        Logout
                    </button>
                </div>
            `;
            
            // Update credits when window.currentUser is available
            setTimeout(() => {
                const creditCount = document.getElementById('creditCount');
                if (creditCount && typeof window.currentUser !== 'undefined' && window.currentUser) {
                    creditCount.textContent = window.currentUser.credits || 0;
                }
            }, 100);
        } else {
            // LOGGED OUT - Show public navigation
            nav.innerHTML = `
                <a href="index.html">Home</a>
                <a href="pro-features.html">Pro Features</a>
                <a href="login.html" class="btn-secondary">Login</a>
                <a href="signup.html" class="btn-secondary">Sign Up</a>
            `;
        }
    }
    
    // Run immediately when script loads (BEFORE DOMContentLoaded)
    if (document.readyState === 'loading') {
        // DOM is still loading, wait for it
        document.addEventListener('DOMContentLoaded', updateNavigation);
    } else {
        // DOM already loaded, run immediately
        updateNavigation();
    }
    
    // Also update when auth changes
    window.addEventListener('userSessionChanged', updateNavigation);
    
    // Update credits when currentUser becomes available
    window.addEventListener('load', () => {
        setTimeout(() => {
            const creditCount = document.getElementById('creditCount');
            if (creditCount && typeof window.currentUser !== 'undefined' && window.currentUser) {
                creditCount.textContent = window.currentUser.credits || 0;
            }
        }, 500);
    });
    
})();
