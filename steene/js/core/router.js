/**
 * STEENE — steene/js/core/router.js
 * Handles platform routing and view transitions between the host dashboard, profile, and settings.
 */

const steeneRouter = {
    init() {
        this.handleRoute();
        window.addEventListener('hashchange', () => this.handleRoute());
    },

    handleRoute() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const validViews = ['dashboard', 'profile', 'settings'];
        
        if (validViews.includes(hash)) {
            if (typeof steenePlatform !== 'undefined' && steenePlatform.showView) {
                steenePlatform.showView(hash);
            }
        }
    },

    navigateTo(viewId) {
        window.location.hash = viewId;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneRouter.init();
});