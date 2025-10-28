/**
 * Authentication Functions
 * Handles signup, login, logout, and session management
 */

/**
 * Sign up a new user
 */
async function signUp(email, password, name) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
            console.log('✅ User created:', authData.user.email);
            
            // 2. Create user profile (will be done automatically by database trigger)
            // Just wait a moment for it to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 3. Load the profile
            await loadUserProfile(authData.user.id);
            
            return { success: true, message: 'Account created! Check your email to verify.' };
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Log in existing user
 */
async function login(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
            console.log('✅ Login successful:', data.user.email);
            await loadUserProfile(data.user.id);
            return { success: true };
        }
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Log out current user
 */
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        window.currentUser = null;
        console.log('✅ Logged out successfully');
        
        // Redirect to home
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out');
    }
}

/**
 * Check if user is logged in
 */
function isUserLoggedIn() {
    return window.currentUser !== null && window.currentUser !== undefined;
}

/**
 * Require authentication (redirect if not logged in)
 */
function requireAuth() {
    if (!isUserLoggedIn()) {
        // Save intended destination
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        showToast('Please sign up or log in to continue');
        
        setTimeout(() => {
            window.location.href = 'signup.html';
        }, 2000);
        
        return false;
    }
    return true;
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        return { success: true, message: 'Password reset email sent! Check your inbox.' };
        
    } catch (error) {
        console.error('Password reset error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Update user's credit count
 */
async function updateUserCredits(creditsToAdd) {
    if (!isUserLoggedIn()) return;
    
    try {
        const newCreditCount = window.currentUser.credits + creditsToAdd;
        
        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: newCreditCount })
            .eq('id', window.currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // Update local state
        window.currentUser.credits = newCreditCount;
        updateUserUI();
        
        console.log(`✅ Credits updated: ${creditsToAdd > 0 ? '+' : ''}${creditsToAdd}`);
        
    } catch (error) {
        console.error('Error updating credits:', error);
    }
}

/**
 * Check if user can analyze (has credits or daily free available)
 */
async function canUserAnalyze() {
    if (!isUserLoggedIn()) {
        return { allowed: false, reason: 'not_logged_in' };
    }
    
    // Check if user has paid credits
    if (window.currentUser.credits > 0) {
        return { allowed: true, type: 'credit' };
    }
    
    // Check if daily free is available
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastFreeDate = window.currentUser.last_free_analysis_date;
    
    if (lastFreeDate !== today) {
        return { allowed: true, type: 'free_daily' };
    }
    
    // No credits and already used free today
    return { allowed: false, reason: 'no_credits' };
}

/**
 * Use one analysis (deduct credit or mark daily free as used)
 */
async function useAnalysis() {
    if (!isUserLoggedIn()) return false;
    
    const canAnalyze = await canUserAnalyze();
    
    if (!canAnalyze.allowed) {
        return false;
    }
    
    try {
        if (canAnalyze.type === 'credit') {
            // Deduct one credit
            await updateUserCredits(-1);
        } else if (canAnalyze.type === 'free_daily') {
            // Mark free daily as used
            const today = new Date().toISOString().split('T')[0];
            
            const { error } = await supabase
                .from('profiles')
                .update({ last_free_analysis_date: today })
                .eq('id', window.currentUser.id);
            
            if (error) throw error;
            
            window.currentUser.last_free_analysis_date = today;
            console.log('✅ Daily free analysis used');
        }
        
        return true;
        
    } catch (error) {
        console.error('Error using analysis:', error);
        return false;
    }
}
