/**
 * STEENE — steene/js/auth/auth-state.js
 * Platform authentication: Supabase client creation, session
 * lifecycle, and sign in/up/out. Loaded on all three platform pages
 * (index.html, profile.html, settings.html).
 *
 * The Supabase client is created HERE rather than inline in each
 * HTML page's <head> — this is the one place the project URL/anon
 * key pair lives on the platform side, instead of being duplicated
 * across three separate inline <script> blocks.
 */

const SUPABASE_URL = 'https://igavamrvcjtpulawjgzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYXZhbXJ2Y2p0cHVsYXdqZ3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDk0NTEsImV4cCI6MjEwMjcyNTQ1MX0.Zl_FAW7oLnGMggGo3H-Tb5nYUxNVnfZtdzzVfpccYBk';

window.steeneSupabase = window.steeneSupabase || supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const steeneAuth = {
    currentSession: null,

    async init() {
        if (!window.steeneSupabase) {
            console.error('STEENE: Supabase client not initialized.');
            return;
        }

        const { data: { session }, error } = await window.steeneSupabase.auth.getSession();
        if (error) {
            console.error('STEENE: error fetching session.', error.message);
        }

        this.setSession(session);

        window.steeneSupabase.auth.onAuthStateChange((event, session) => {
            this.setSession(session);
        });
    },

    /**
     * Central point every auth change flows through: updates the
     * navbar, pushes the session into a loaded game (index.html
     * only — steenePlatform doesn't exist on profile.html/settings.html),
     * and refreshes whichever view-specific module happens to be on
     * the current page, if any.
     */
    setSession(session) {
        this.currentSession = session;
        this.updateUIState();

        if (typeof steenePlatform !== 'undefined' && steenePlatform.syncAuthToIframe) {
            steenePlatform.syncAuthToIframe(session);
        }

        if (typeof steeneProfileView !== 'undefined' && steeneProfileView.refresh) {
            steeneProfileView.refresh();
        }

        if (typeof steeneSettingsView !== 'undefined' && steeneSettingsView.refresh) {
            steeneSettingsView.refresh();
        }
    },

    updateUIState() {
        const btnLogin = document.getElementById('btn-login');
        const btnSignup = document.getElementById('btn-signup');
        const btnLogout = document.getElementById('btn-logout');

        if (this.currentSession) {
            if (btnLogin) btnLogin.style.display = 'none';
            if (btnSignup) btnSignup.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'inline-flex';
        } else {
            if (btnLogin) btnLogin.style.display = 'inline-flex';
            if (btnSignup) btnSignup.style.display = 'inline-flex';
            if (btnLogout) btnLogout.style.display = 'none';
        }
    },

    openModal(mode) {
        const modal = document.getElementById('auth-modal');
        const loginContainer = document.getElementById('login-form-container');
        const signupContainer = document.getElementById('signup-form-container');

        if (!modal) return;
        this.clearErrors();
        modal.classList.remove('hidden');

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
        if (modal) modal.classList.add('hidden');
        this.clearErrors();

        if (typeof steeneAuthClearInputs === 'function') {
            steeneAuthClearInputs();
        }
    },

    switchModal(mode) {
        this.clearErrors();
        this.openModal(mode);
    },

    clearErrors() {
        const loginErr = document.getElementById('login-error');
        const signupErr = document.getElementById('signup-error');
        if (loginErr) { loginErr.textContent = ''; loginErr.style.color = ''; }
        if (signupErr) { signupErr.textContent = ''; signupErr.style.color = ''; }
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

        const { error } = await window.steeneSupabase.auth.signInWithPassword({ email, password });

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

        if (password.length < 6) {
            if (errorElem) errorElem.textContent = 'Password must be at least 6 characters.';
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
                errorElem.textContent = 'Account created! Check your email if confirmation is required.';
            }
            setTimeout(() => { this.closeModal(); }, 2600);
        }
    },

    async signOut() {
        const { error } = await window.steeneSupabase.auth.signOut();

        if (!error && typeof steeneRouter !== 'undefined') {
            steeneRouter.navigateTo('dashboard');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneAuth.init();
});
