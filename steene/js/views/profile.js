/**
 * STEENE — steene/js/views/profile.js
 * Platform-level profile rendering view that synchronizes with Supabase Auth
 * and displays account details, user metadata, and statistics.
 */

const steeneProfileView = {
    init() {
        this.renderProfileData();
    },

    renderProfileData() {
        const profileContainer = document.getElementById('profile-data');
        if (!profileContainer) return;

        // Check if user session exists from steeneAuth
        const session = window.steeneAuth && window.steeneAuth.currentSession;
        const user = session ? session.user : null;

        if (!user) {
            profileContainer.innerHTML = `
                <div class="profile-card-inner">
                    <div class="profile-avatar-large">🔒</div>
                    <h2>Guest Account</h2>
                    <p class="text-muted">Please log in or sign up to view your professional profile and game statistics.</p>
                    <div style="margin-top: 24px;">
                        <button class="btn btn-blue" onclick="steeneAuth.openModal('login')">Login to Account</button>
                    </div>
                </div>
            `;
            return;
        }

        const username = user.user_metadata?.username || user.email.split('@')[0];
        const joinedDate = new Date(user.created_at).toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        profileContainer.innerHTML = `
            <div class="profile-card-inner">
                <div class="profile-avatar-large">♟</div>
                <h2>${username}</h2>
                <p class="text-muted">${user.email}</p>
                <div class="profile-meta-grid">
                    <div class="sc"><div class="sc-val">Verified</div><div class="sc-lbl">Account Status</div></div>
                    <div class="sc"><div class="sc-val">${joinedDate}</div><div class="sc-lbl">Member Since</div></div>
                    <div class="sc"><div class="sc-val">0</div><div class="sc-lbl">Platform Matches</div></div>
                </div>
            </div>
        `;
    },

    refresh() {
        this.renderProfileData();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneProfileView.init();
});