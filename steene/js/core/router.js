
const steeneRouter = {
  validViews: ['dashboard', 'game', 'profile', 'settings'],

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
