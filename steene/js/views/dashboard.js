"use strict";

const dashboardTranslations = {
    en: {
        featuredGame: "FEATURED GAME",
        players: "Players",
        availableNow: "Available Now",
        comingSoon: "Coming Soon",
        playNow: "▶ Play Now",
        playNowShort: "PLAY NOW",
        available: "AVAILABLE",
        locked: "LOCKED",
        play: "Play",
        emptyTitle: "No games available yet",
        emptyDesc: "New games will appear here when they are added to STEENE.",
        defaultGameDesc: "Discover and play this game on STEENE.",
        defaultCardDesc: "A new STEENE experience."
    },
    es: {
        featuredGame: "JUEGO DESTACADO",
        players: "Jugadores",
        availableNow: "Disponible Ahora",
        comingSoon: "Próximamente",
        playNow: "▶ Jugar Ahora",
        playNowShort: "JUGAR AHORA",
        available: "DISPONIBLE",
        locked: "BLOQUEADO",
        play: "Jugar",
        emptyTitle: "No hay juegos disponibles todavía",
        emptyDesc: "Los nuevos juegos aparecerán aquí cuando se agreguen a STEENE.",
        defaultGameDesc: "Descubre y juega este juego en STEENE.",
        defaultCardDesc: "Una nueva experiencia de STEENE."
    },
    fr: {
        featuredGame: "JEU EN VEDETTE",
        players: "Joueurs",
        availableNow: "Disponible Maintenant",
        comingSoon: "Bientôt Disponible",
        playNow: "▶ Jouer Maintenant",
        playNowShort: "JOUER MAINTENANT",
        available: "DISPONIBLE",
        locked: "VERROUILLÉ",
        play: "Jouer",
        emptyTitle: "Aucun jeu disponible pour le moment",
        emptyDesc: "Les nouveaux jeux apparaîtront ici lorsqu'ils seront ajoutés à STEENE.",
        defaultGameDesc: "Découvrez et jouez à ce jeu sur STEENE.",
        defaultCardDesc: "Une nouvelle expérience STEENE."
    },
    de: {
        featuredGame: "EMPFOHLENES SPIEL",
        players: "Spieler",
        availableNow: "Jetzt Verfügbar",
        comingSoon: "Demnächst",
        playNow: "▶ Jetzt Spielen",
        playNowShort: "JETZT SPIELEN",
        available: "VERFÜGBAR",
        locked: "GESPERRT",
        play: "Spielen",
        emptyTitle: "Noch keine Spiele verfügbar",
        emptyDesc: "Neue Spiele werden hier angezeigt, wenn sie zu STEENE hinzugefügt werden.",
        defaultGameDesc: "Entdecke und spiele dieses Spiel auf STEENE.",
        defaultCardDesc: "Ein neues STEENE-Erlebnis."
    }
};

const steeneDashboardView = {

    t(key) {
        const settings = window.steeneSettingsView?._settings || {};
        const lang = settings.language || document.documentElement.lang || 'en';
        const dict = dashboardTranslations[lang] || dashboardTranslations.en;
        return dict[key] || dashboardTranslations.en[key] || key;
    },

    init() {
        this.bindLanguageListener();
        this.renderDashboard();
        this.bindSearch();
    },

    bindLanguageListener() {
        window.addEventListener('steene:settings-updated', () => {
            this.renderDashboard();
        });
    },

    bindSearch() {
        const searchInput = document.getElementById("game-search-input");

        if (!searchInput) return;

        searchInput.addEventListener("input", (event) => {
            const searchTerm = event.target.value.toLowerCase().trim();
            const allGames = this.getGames();

            const filteredGames = allGames.filter(game => {
                const nameMatch = game.name && game.name.toLowerCase().includes(searchTerm);
                const descMatch = game.description && game.description.toLowerCase().includes(searchTerm);
                
                return nameMatch || descMatch;
            });

            this.renderGameGallery(filteredGames);
        });
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
                        ${this.escapeHtml(this.t("featuredGame"))}
                    </span>

                    <h1 class="featured-game-title">
                        ${this.escapeHtml(
                            game.name || "STEENE Game"
                        )}
                    </h1>

                    <p class="featured-game-description">
                        ${this.escapeHtml(
                            game.description ||
                            this.t("defaultGameDesc")
                        )}
                    </p>

                    <div class="featured-game-meta">
                        <span>
                            ${this.escapeHtml(
                                game.players || "1"
                            )} ${this.escapeHtml(this.t("players"))}
                        </span>

                        <span>•</span>

                        <span>
                            ${
                                isAvailable
                                    ? this.escapeHtml(this.t("availableNow"))
                                    : this.escapeHtml(this.t("comingSoon"))
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
                                    ${this.escapeHtml(this.t("playNow"))}
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="dashboard-play-button disabled"
                                    disabled
                                >
                                    ${this.escapeHtml(this.t("comingSoon"))}
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
                            <span>${this.escapeHtml(this.t("playNowShort"))}</span>
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
                                        ${this.escapeHtml(this.t("available"))}
                                    </span>
                                `
                                : `
                                    <span class="status-coming">
                                        ${this.escapeHtml(this.t("comingSoon"))}
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
                            )} ${this.escapeHtml(this.t("players"))}
                        </span>
                    </div>

                    <p class="game-card-desc">
                        ${this.escapeHtml(
                            game.description ||
                            this.t("defaultCardDesc")
                        )}
                    </p>

                    <div class="game-card-footer">

                        <span class="game-card-type">
                            ${
                                available
                                    ? this.escapeHtml(this.t("available"))
                                    : this.escapeHtml(this.t("locked"))
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
                                        ${this.escapeHtml(this.t("play"))}
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
                    ${this.escapeHtml(this.t("emptyTitle"))}
                </h3>

                <p>
                    ${this.escapeHtml(this.t("emptyDesc"))}
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
            window.steenePlatform.launchGame(game.id);
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