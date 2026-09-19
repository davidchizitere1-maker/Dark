/**
 * STEENE — steene/js/views/dashboard.js
 * Modern game-store dashboard renderer.
 *
 * Responsibilities:
 * - Render featured game hero
 * - Render promotional game cards
 * - Render game gallery
 * - Handle game launching
 */

"use strict";

const steeneDashboardView = {

    init() {
        this.renderDashboard();
    },

    getGames() {
        if (
            !window.gameRegistry ||
            typeof window.gameRegistry.getAll !== "function"
        ) {
            return [];
        }

        return window.gameRegistry.getAll() || [];
    },

    getAvailableGames() {
        return this.getGames().filter(
            game => game.status === "available"
        );
    },

    getFeaturedGame() {
        const availableGames = this.getAvailableGames();

        return (
            availableGames[0] ||
            this.getGames()[0] ||
            null
        );
    },

    renderDashboard() {
        const grid =
            document.getElementById("game-grid");

        if (!grid) {
            return;
        }

        const games = this.getGames();

        if (!games.length) {
            this.renderEmptyState();
            return;
        }

        this.renderHero();
        this.renderPromoCards();
        this.renderGameGallery(games);
    },

    renderHero() {
        const hero =
            document.getElementById(
                "dashboard-featured"
            );

        if (!hero) {
            return;
        }

        const game =
            this.getFeaturedGame();

        if (!game) {
            hero.innerHTML = "";
            return;
        }

        const image =
            this.safeUrl(game.thumbnail);

        const isAvailable =
            game.status === "available";

        hero.innerHTML = `
            <article class="featured-game">

                ${
                    image
                        ? `
                            <div
                                class="featured-game-background"
                                style="background-image: url('${image}')"
                            ></div>
                        `
                        : `
                            <div class="featured-game-background featured-game-fallback">
                                ${this.escapeHtml(
                                    game.icon || "🎮"
                                )}
                            </div>
                        `
                }

                <div class="featured-game-overlay"></div>

                <div class="featured-game-content">

                    <span class="featured-label">
                        FEATURED GAME
                    </span>

                    <h1 class="featured-game-title">
                        ${this.escapeHtml(
                            game.name || "STEENE Game"
                        )}
                    </h1>

                    <p class="featured-game-description">
                        ${this.escapeHtml(
                            game.description ||
                            "Discover and play this game on STEENE."
                        )}
                    </p>

                    <div class="featured-game-meta">
                        <span>
                            ${this.escapeHtml(
                                game.players || "1"
                            )} Players
                        </span>

                        <span>•</span>

                        <span>
                            ${
                                isAvailable
                                    ? "Available Now"
                                    : "Coming Soon"
                            }
                        </span>
                    </div>

                    ${
                        isAvailable
                            ? `
                                <button
                                    type="button"
                                    class="dashboard-play-button"
                                    data-featured-game="${this.escapeHtml(
                                        game.id
                                    )}"
                                >
                                    ▶ Play Now
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="dashboard-play-button disabled"
                                    disabled
                                >
                                    Coming Soon
                                </button>
                            `
                    }

                </div>

            </article>
        `;

        const button =
            hero.querySelector(
                "[data-featured-game]"
            );

        if (button) {
            button.addEventListener(
                "click",
                () => this.launchGame(game)
            );
        }
    },

    renderPromoCards() {
        const container =
            document.getElementById(
                "dashboard-promos"
            );

        if (!container) {
            return;
        }

        const games =
            this.getAvailableGames();

        const featured =
            this.getFeaturedGame();

        const promoGames =
            games
                .filter(game => {
                    return !featured ||
                        String(game.id) !==
                        String(featured.id);
                })
                .slice(0, 3);

        if (!promoGames.length) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML =
            promoGames.map(game => {
                const image =
                    this.safeUrl(game.thumbnail);

                return `
                    <article
                        class="dashboard-promo-card"
                        data-promo-game="${this.escapeHtml(
                            game.id
                        )}"
                    >

                        ${
                            image
                                ? `
                                    <img
                                        class="dashboard-promo-image"
                                        src="${image}"
                                        alt="${this.escapeHtml(
                                            game.name
                                        )}"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="dashboard-promo-fallback">
                                        ${this.escapeHtml(
                                            game.icon || "🎮"
                                        )}
                                    </div>
                                `
                        }

                        <div class="dashboard-promo-overlay"></div>

                        <div class="dashboard-promo-content">
                            <span>PLAY NOW</span>
                            <h3>
                                ${this.escapeHtml(
                                    game.name ||
                                    "STEENE Game"
                                )}
                            </h3>
                        </div>

                    </article>
                `;
            }).join("");

        container
            .querySelectorAll("[data-promo-game]")
            .forEach(card => {
                const gameId =
                    card.dataset.promoGame;

                const game =
                    promoGames.find(item => {
                        return String(item.id) ===
                            String(gameId);
                    });

                if (!game) {
                    return;
                }

                card.addEventListener(
                    "click",
                    () => this.launchGame(game)
                );
            });
    },

    renderGameGallery(games) {
        const grid =
            document.getElementById("game-grid");

        if (!grid) {
            return;
        }

        grid.innerHTML =
            games.map(game => {
                return this.renderGameCard(game);
            }).join("");

        grid
            .querySelectorAll("[data-play-game]")
            .forEach(button => {
                const gameId =
                    button.dataset.playGame;

                const game =
                    games.find(item => {
                        return String(item.id) ===
                            String(gameId);
                    });

                if (!game) {
                    return;
                }

                button.addEventListener(
                    "click",
                    event => {
                        event.stopPropagation();
                        this.launchGame(game);
                    }
                );
            });

        grid
            .querySelectorAll(
                ".game-card:not(.is-locked)"
            )
            .forEach(card => {
                card.addEventListener(
                    "click",
                    () => {
                        const gameId =
                            card.dataset.gameId;

                        const game =
                            games.find(item => {
                                return String(item.id) ===
                                    String(gameId);
                            });

                        if (game) {
                            this.launchGame(game);
                        }
                    }
                );
            });
    },

    renderGameCard(game) {
        const available =
            game.status === "available";

        const thumbnail =
            this.safeUrl(game.thumbnail);

        const thumbnailMarkup =
            thumbnail
                ? `
                    <img
                        class="game-card-thumb"
                        src="${thumbnail}"
                        alt="${this.escapeHtml(
                            game.name
                        )}"
                        loading="lazy"
                    >
                `
                : `
                    <div class="game-card-thumb-fallback">
                        ${this.escapeHtml(
                            game.icon || "🎮"
                        )}
                    </div>
                `;

        return `
            <article
                class="game-card ${
                    available ? "" : "is-locked"
                }"
                data-game-id="${this.escapeHtml(
                    game.id
                )}"
            >

                <div class="game-card-image">

                    ${thumbnailMarkup}

                    <div class="game-card-status">
                        ${
                            available
                                ? `
                                    <span class="status-available">
                                        AVAILABLE
                                    </span>
                                `
                                : `
                                    <span class="status-coming">
                                        COMING SOON
                                    </span>
                                `
                        }
                    </div>

                </div>

                <div class="game-card-body">

                    <div class="game-card-heading">
                        <h3 class="game-card-title">
                            ${this.escapeHtml(
                                game.name ||
                                "STEENE Game"
                            )}
                        </h3>

                        <span class="game-card-players">
                            ${this.escapeHtml(
                                game.players || "1"
                            )} Players
                        </span>
                    </div>

                    <p class="game-card-desc">
                        ${this.escapeHtml(
                            game.description ||
                            "A new STEENE experience."
                        )}
                    </p>

                    <div class="game-card-footer">

                        <span class="game-card-type">
                            ${
                                available
                                    ? "PLAYABLE"
                                    : "LOCKED"
                            }
                        </span>

                        ${
                            available
                                ? `
                                    <button
                                        type="button"
                                        class="game-card-play"
                                        data-play-game="${this.escapeHtml(
                                            game.id
                                        )}"
                                    >
                                        Play
                                    </button>
                                `
                                : `
                                    <span
                                        class="game-card-locked"
                                        aria-label="Locked"
                                    >
                                        🔒
                                    </span>
                                `
                        }

                    </div>

                </div>

            </article>
        `;
    },

    renderEmptyState() {
        const grid =
            document.getElementById("game-grid");

        if (!grid) {
            return;
        }

        grid.innerHTML = `
            <div class="gallery-empty">
                <div class="gallery-empty-icon">
                    🎮
                </div>

                <h3>
                    No games available yet
                </h3>

                <p>
                    New games will appear here when
                    they are added to STEENE.
                </p>
            </div>
        `;

        const hero =
            document.getElementById(
                "dashboard-featured"
            );

        const promos =
            document.getElementById(
                "dashboard-promos"
            );

        if (hero) {
            hero.innerHTML = "";
        }

        if (promos) {
            promos.innerHTML = "";
        }
    },

    launchGame(game) {
        if (
            !game ||
            game.status !== "available"
        ) {
            return;
        }

        if (
            window.steenePlatform &&
            typeof window.steenePlatform.launchGame ===
                "function"
        ) {
            const route =
                game.route || game.id;

            window.steenePlatform.launchGame(
                route,
                game.name
            );

            return;
        }

        console.warn(
            "STEENE: steenePlatform.launchGame() is not available."
        );
    },

    refresh() {
        this.renderDashboard();
    },

    safeUrl(value) {
        const url =
            String(value || "");

        if (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("blob:")
        ) {
            return this.escapeHtml(url);
        }

        return "";
    },

    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

window.steeneDashboardView =
    steeneDashboardView;

window.addEventListener(
    "DOMContentLoaded",
    () => {
        steeneDashboardView.init();
    }
);
