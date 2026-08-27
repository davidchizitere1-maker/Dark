/**
 * STEENE — steene/js/auth/auth-state.js
 * Platform authentication state management, Supabase integration,
 * and postMessage syncing for game iframes.
 */

const steeneAuth = {
    currentSession: null,

    async init() {
        if (!window.steeneSupabase) {
            console.error("Supabase client not initialized.");
            return;
        }

        const { data: { session }, error } = await window.steeneSupabase.auth.getSession();
        if (error) {
            console.error("Error fetching session:", error.message);
        }
        
        this.setSession(session);

        window.steeneSupabase.auth.onAuthStateChange((event, session) => {
            this.setSession(session);
        });
    },

    setSession(session) {
        this.currentSession = session;
        this.updateUIState();

        if (typeof steenePlatform !== 'undefined' && steenePlatform.syncAuthToIframe) {
            steenePlatform.syncAuthToIframe(session);
        }
    },

    updateUIState() {
        const btnLogin = document.getElementById('btn-login');
        const btnSignup = document.getElementById('btn-signup');
        const btnLogout = document.getElementById('btn-logout');
        const navProfile = document.getElementById('nav-profile');

        if (this.currentSession) {
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnSignup) btnSignup.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'inline-block';
            if (navProfile) navProfile.style.display = 'inline-block';
            
            this.loadUserProfileData(this.currentSession.user);
        } else {
            if (btnLogin) btnLogin.style.display = 'inline-block';
            if (btnSignup) btnSignup.style.display = 'inline-block';
            if (btnLogout) btnLogout.style.display = 'none';
            if (navProfile) navProfile.style.display = 'none';
        }
    },

    openModal(mode) {
        const modal = document.getElementById('auth-modal');
        const loginContainer = document.getElementById('login-form-container');
        const signupContainer = document.getElementById('signup-form-container');

        if (!modal) return;
        modal.style.display = 'flex';

        if (mode === 'signup') {
            if (loginContainer) loginContainer.style.display = 'none';
            if (signupContainer) signupContainer.style.display = 'block';
        } else {
            if (loginContainer) loginContainer.style.display = 'block';
            if (signupContainer) signupContainer.style.display = 'none';
        }
    },

    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
        this.clearErrors();
    },

    switchModal(mode) {
        this.clearErrors();
        this.openModal(mode);
    },

    clearErrors() {
        const loginErr = document.getElementById('login-error');
        const signupErr = document.getElementById('signup-error');
        if (loginErr) loginErr.textContent = '';
        if (signupErr) signupErr.textContent = '';
    },

    async signIn() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const errorElem = document.getElementById('login-error');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            if (errorElem) errorElem.textContent = 'Please fill in all fields.';
            return;
        }

        const { error } = await window.steeneSupabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (errorElem) errorElem.textContent = error.message;
        } else {
            this.closeModal();
        }
    },

    async signUp() {
        const usernameInput = document.getElementById('signup-username');
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const errorElem = document.getElementById('signup-error');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!username || !email || !password) {
            if (errorElem) errorElem.textContent = 'Please fill in all fields.';
            return;
        }

        const { error } = await window.steeneSupabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: username }
            }
        });

        if (error) {
            if (errorElem) errorElem.textContent = error.message;
        } else {
            if (errorElem) {
                errorElem.style.color = '#4ade80';
                errorElem.textContent = 'Registration successful! Check your email if confirmation is required.';
            }
            setTimeout(() => { this.closeModal(); }, 3000);
        }
    },

    async signOut() {
        const { error } = await window.steeneSupabase.auth.signOut();
        if (!error && typeof steenePlatform !== 'undefined') {
            steenePlatform.showView('dashboard');
        }
    },

    async loadUserProfileData(user) {
        const profileContainer = document.getElementById('profile-data');
        if (!profileContainer || !user) return;

        const username = user.user_metadata?.username || user.email.split('@')[0];
        
        profileContainer.innerHTML = `
            <div class="profile-card-inner">
                <div class="profile-avatar-large">♟</div>
                <h2>${username}</h2>
                <p class="text-muted">${user.email}</p>
                <div class="profile-meta-grid">
                    <div class="sc"><div class="sc-val">Verified</div><div class="sc-lbl">Account Status</div></div>
                    <div class="sc"><div class="sc-val">${new Date(user.created_at).toLocaleDateString()}</div><div class="sc-lbl">Joined</div></div>
                </div>
            </div>
        `;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneAuth.init();
});