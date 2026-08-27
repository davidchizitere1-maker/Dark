/**
 * STEENE — steene/js/views/dashboard.js
 * Manages dashboard-specific view rendering, dynamic gallery initialization,
 * and card interactions on the STEENE platform shell.
 */

const steeneDashboardView = {
    init() {
        if (typeof steenePlatform !== 'undefined' && steenePlatform.renderGallery) {
            steenePlatform.renderGallery();
        }
    },

    refresh() {
        this.init();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneDashboardView.init();
});