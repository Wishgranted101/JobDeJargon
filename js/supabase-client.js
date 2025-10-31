// Supabase Client Configuration
// This connects your app to your Supabase database

const SUPABASE_URL = 'https://emxugdibpgrmspyjnhhq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteHVnZGlicGdybXNweWpuaGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzQzNDMsImV4cCI6MjA3NzI1MDM0M30.U4tFUlDCKhJnYU-TmS1Vr_My6LNEH2XiZ02OKN6Bjp4';

// Load Supabase from CDN
const supabaseScript = document.createElement('script');
supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
supabaseScript.onload = initSupabase;
supabaseScript.onerror = () => {
    console.error('❌ Failed to load Supabase library');
};
document.head.appendChild(supabaseScript);

let supabase;

function initSupabase() {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
        
        // Check for existing session
        checkUserSession();
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
    }
}

async function checkUserSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session check error:', error);
            return;
        }
        
        if (session) {
            console.log('✅ User session found:', session.user.email);
            await loadUserProfile(session.user.id);
        } else {
            console.log('ℹ️ No active session');
        }
    } catch (error) {
        console.error('❌ Error checking session:', error);
    }
}

async function loadUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Profile load error:', error);
            return;
        }
        
        if (data) {
            // Update global user state
            window.currentUser = {
                id: userId,
                email: data.email,
                full_name: data.full_name,
                credits: data.credits || 0,
                last_free_analysis_date: data.last_free_analysis_date,
                is_pro: data.is_pro || false,
                created_at: data.created_at
            };
            
            console.log('✅ User profile loaded:', window.currentUser);
            
            // Update UI if on a page that shows user info
            if (typeof updateUserUI === 'function') {
                updateUserUI();
            }
        }
    } catch (error) {
        console.error('❌ Error loading profile:', error);
    }
}

function updateUserUI() {
    // Update credit counter if it exists
    const creditDisplay = document.getElementById('creditDisplay');
    if (creditDisplay && window.currentUser) {
        creditDisplay.textContent = `Credits: ${window.currentUser.credits}`;
    }
    
    // Update user greeting if it exists
    const userGreeting = document.getElementById('userGreeting');
    if (userGreeting && window.currentUser) {
        userGreeting.textContent = `Welcome back, ${window.currentUser.email}!`;
    }
}
