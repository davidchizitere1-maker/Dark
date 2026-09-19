/**
 * STEENE — steene/js/core/router.js
 * Hash-based routing between index.html's two views: 'dashboard'
 * and 'game'. This is the ONLY place that listens for `hashchange`
 * on this page — previously this same job was duplicated across
 * this file, host.js, AND components/navigation.js, all
 * independently reacting to the same event. Now:
 *
 *   - host.js calls steeneRouter.navigateTo(...) instead of
 *     touching window.location.hash or steenePlatform.showView()
 *     directly.
 *   - components/navigation.js only handles the mobile menu toggle
 *     and does not touch routing at all.
 *
 * Profile and Settings are no longer hash-routed views inside this
 * page — they're real pages (steene/profile.html, steene/settings.html)
 * linked to normally, so this file only ever needs to know about
 * 'dashboard' and 'game'.
 */

const steeneRouter = {
  validViews: ['dashboard', 'game'],

  init() {
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  handleRoute() {
    const requested = window.location.hash.replace('#', '') || 'dashboard';
    const viewId = this.validViews.includes(requested) ? requested : 'dashboard';

    if (typeof steenePlatform !== 'undefined' && steenePlatform.showView) {
      steenePlatform.showView(viewId);
    }
  },

  /**
   * Changes the hash to `viewId`, which triggers handleRoute() via
   * the hashchange listener above. If the hash is already `viewId`
   * (hashchange won't fire on an unchanged value), handleRoute() is
   * called directly instead so the view switch still happens.
   */
  navigateTo(viewId) {
    if (!this.validViews.includes(viewId)) {
      return;
    }

    const current = window.location.hash.replace('#', '') || 'dashboard';
    if (current === viewId) {
      this.handleRoute();
      return;
    }

    window.location.hash = viewId;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  steeneRouter.init();
});
