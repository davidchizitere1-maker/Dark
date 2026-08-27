/**
 * STEENE — steene/js/components/navigation.js
 * Reusable navigation component helper for mobile drawer toggling,
 * active link synchronization, and platform view routing.
 */

const steeneNav = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Handle URL hash changes to support browser history navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && ['dashboard', 'profile', 'settings'].includes(hash)) {
                if (typeof steenePlatform !== 'undefined' && steenePlatform.showView) {
                    steenePlatform.showView(hash);
                }
            }
        });
    },

    setActive(viewId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[onclick*="showView('${viewId}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneNav.init();
});