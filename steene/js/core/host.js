/**
 * STEENE — steene/js/core/host.js
 * Platform shell coordinator managing view routing, dynamic game registry gallery rendering,
 * iframe sandboxing, and postMessage session syncing.
 */

const steenePlatform = {
    currentView: 'dashboard',

    init() {
        this.renderGallery();
        this.setupEventListeners();
        this.checkInitialRoute();
    },

    /**
     * Dynamically renders board game cards into the dashboard grid based on GameRegistry.
     */
    renderGallery() {
        const gallery = document.getElementById('game-gallery');
        if (!gallery || typeof GameRegistry === 'undefined') return;

        gallery.innerHTML = GameRegistry.map(game => `
            <div class="game-card ${game.status === 'coming_soon' ? 'disabled' : ''}" 
                 onclick="${game.status === 'available' ? `steenePlatform.launchGame('${game.route}', '${game.name}')` : ''}">
                <div class="game-thumb" style="background-image: url('${game.thumbnail}');"></div>
                <div class="game-info">
                    <span class="game-type">${game.players}</span>
                    <h3 class="game-name">${game.name}</h3>
                    <p class="game-desc">${game.description}</p>
                    <button class="btn ${game.status === 'available' ? 'btn-gold btn-sm' : 'btn-ghost btn-sm'}" 
                            ${game.status === 'coming_soon' ? 'disabled' : ''}>
                        ${game.status === 'available' ? 'Play Now' : 'Coming Soon'}
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Switches between platform views (dashboard, profile, settings).
     */
    showView(viewId) {
        document.querySelectorAll('.platform-view').forEach(view => {
            view.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewId;
        }

        const activeNavBtn = document.querySelector(`[onclick*="showView('${viewId}')"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }

        if (typeof steeneNav !== 'undefined' && steeneNav.setActive) {
            steeneNav.setActive(viewId);
        }

        window.location.hash = viewId;
    },

    /**
     * Launches an individual game inside the isolated iframe sandbox.
     */
    launchGame(route, gameName) {
        const overlay = document.getElementById('game-overlay');
        const iframe = document.getElementById('game-iframe');
        const titleElem = document.getElementById('active-game-title');

        if (titleElem) titleElem.textContent = gameName;
        if (iframe) {
            iframe.src = route;
            
            iframe.onload = () => {
                if (typeof steeneAuth !== 'undefined' && steeneAuth.currentSession) {
                    this.syncAuthToIframe(steeneAuth.currentSession);
                }
            };
        }

        if (overlay) {
            overlay.style.display = 'flex';
        }
    },

    /**
     * Exits the game iframe and returns to the platform lobby.
     */
    exitGame() {
        const overlay = document.getElementById('game-overlay');
        const iframe = document.getElementById('game-iframe');

        if (overlay) overlay.style.display = 'none';
        if (iframe) iframe.src = 'about:blank';
    },

    /**
     * Sends active user session securely down to the game iframe via postMessage.
     */
    syncAuthToIframe(session) {
        const iframe = document.getElementById('game-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'STEENE_AUTH_SYNC',
                session: session,
                user: session ? session.user : null
            }, window.location.origin);
        }
    },

    setupEventListeners() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && ['dashboard', 'profile', 'settings'].includes(hash)) {
                this.showView(hash);
            }
        });
    },

    checkInitialRoute() {
        const hash = window.location.hash.replace('#', '');
        if (hash && ['dashboard', 'profile', 'settings'].includes(hash)) {
            this.showView(hash);
        } else {
            this.showView('dashboard');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steenePlatform.init();
});