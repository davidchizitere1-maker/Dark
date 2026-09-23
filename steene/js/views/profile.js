"use strict";

const STEENE_AVATAR_CHOICES = [
    "♟", "♞", "♜", "♛", "♚",
    "🤖", "🎯", "🧠", "🔥", "⚡",
    "🛡️", "🏆", "🦊", "🐺", "🦁",
    "🐯", "🐉", "🦅", "🎮", "👑",
    "🌟", "💎", "🚀", "🎨", "🌈"
];

const STEENE_PROFILE_CONFIG = {
    profileTable: "profiles",
    gamesTable: "games",
    gamePlayerColumn: "player_id",
    avatarBucket: "avatars",

    recentGamesLimit: 12,
    usernameMinLength: 3,
    usernameMaxLength: 24,
    bioMaxLength: 160,

    maxAvatarFileSize: 5 * 1024 * 1024,

    allowedImageTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ]
};

// Profile-specific internationalization dictionary
const profileTranslations = {
    en: {
        tabOverview: "Overview",
        tabRecent: "Recent Games",
        tabFriends: "Friends",
        editProfile: "Edit Profile",
        following: "Following",
        followers: "Followers",
        achievements: "Achievements",
        joined: "Joined",
        recently: "Recently",
        statGames: "Games",
        statWins: "Wins",
        statLosses: "Losses",
        statWinRate: "Win Rate",
        statDraws: "Draws",
        statTurns: "Turns",
        recentActivity: "Recent Activity",
        viewAll: "View All",
        noGames: "No games played yet.",
        noRecentGames: "No recent games found. Start playing to build your history.",
        friendsPrompt: "Find players, compare statistics, and send friend requests.",
        searchFriends: "Search for Friends",
        guestTitle: "Sign in to create your STEENE profile.",
        guestNotice: "🔒 Sign in to record matches, customize your avatar, and connect with friends.",
        signUp: "Sign Up",
        logIn: "Log In",
        loading: "Loading profile…",
        editTitle: "Edit Profile",
        editSubtitle: "Personalize how other STEENE players see you.",
        uploadPicture: "Upload Picture",
        chooseEmoji: "Choose Emoji",
        displayName: "Display Name",
        bio: "Bio",
        bioPlaceholder: "Tell other players about yourself",
        cancel: "Cancel",
        saveChanges: "Save Changes",
        saving: "Saving…",
        statusInProgress: "In progress",
        statusDraw: "Draw",
        statusVictory: "Victory",
        statusDefeat: "Defeat"
    },
    es: {
        tabOverview: "Resumen",
        tabRecent: "Juegos Recientes",
        tabFriends: "Amigos",
        editProfile: "Editar Perfil",
        following: "Siguiendo",
        followers: "Seguidores",
        achievements: "Logros",
        joined: "Se unió",
        recently: "Recientemente",
        statGames: "Juegos",
        statWins: "Victorias",
        statLosses: "Derrotas",
        statWinRate: "Tasa de Victoria",
        statDraws: "Empates",
        statTurns: "Turnos",
        recentActivity: "Actividad Reciente",
        viewAll: "Ver Todo",
        noGames: "Aún no hay juegos jugados.",
        noRecentGames: "No se encontraron juegos recientes. Comienza a jugar para construir tu historial.",
        friendsPrompt: "Encuentra jugadores, compara estadísticas y envía solicitudes de amistad.",
        searchFriends: "Buscar Amigos",
        guestTitle: "Inicia sesión para crear tu perfil de STEENE.",
        guestNotice: "🔒 Inicia sesión para registrar partidas, personalizar tu avatar y conectar con amigos.",
        signUp: "Registrarse",
        logIn: "Iniciar Sesión",
        loading: "Cargando perfil…",
        editTitle: "Editar Perfil",
        editSubtitle: "Personaliza cómo te ven otros jugadores de STEENE.",
        uploadPicture: "Subir Imagen",
        chooseEmoji: "Elegir Emoji",
        displayName: "Nombre de Usuario",
        bio: "Biografía",
        bioPlaceholder: "Cuéntale a otros jugadores sobre ti",
        cancel: "Cancelar",
        saveChanges: "Guardar Cambios",
        saving: "Guardando…",
        statusInProgress: "En curso",
        statusDraw: "Empate",
        statusVictory: "Victoria",
        statusDefeat: "Derrota"
    },
    fr: {
        tabOverview: "Aperçu",
        tabRecent: "Jeux Récents",
        tabFriends: "Amis",
        editProfile: "Modifier le Profil",
        following: "Abonnements",
        followers: "Abonnés",
        achievements: "Succès",
        joined: "Inscrit en",
        recently: "Récemment",
        statGames: "Parties",
        statWins: "Victoires",
        statLosses: "Défaites",
        statWinRate: "Taux de Victoire",
        statDraws: "Nuls",
        statTurns: "Tours",
        recentActivity: "Activité Récente",
        viewAll: "Voir Tout",
        noGames: "Aucune partie jouée pour l'instant.",
        noRecentGames: "Aucune partie récente trouvée. Commencez à jouer pour créer votre historique.",
        friendsPrompt: "Trouvez des joueurs, comparez vos statistiques et envoyez des demandes d'amis.",
        searchFriends: "Rechercher des Amis",
        guestTitle: "Connectez-vous pour créer votre profil STEENE.",
        guestNotice: "🔒 Connectez-vous pour enregistrer des matchs, personnaliser votre avatar et vous connecter avec des amis.",
        signUp: "S'inscrire",
        logIn: "Connexion",
        loading: "Chargement du profil…",
        editTitle: "Modifier le Profil",
        editSubtitle: "Personnalisez la façon dont les autres joueurs STEENE vous voient.",
        uploadPicture: "Télécharger une Image",
        chooseEmoji: "Choisir un Émoji",
        displayName: "Nom d'affichage",
        bio: "Biographie",
        bioPlaceholder: "Parlez de vous aux autres joueurs",
        cancel: "Annuler",
        saveChanges: "Enregistrer",
        saving: "Enregistrement…",
        statusInProgress: "En cours",
        statusDraw: "Match nul",
        statusVictory: "Victoire",
        statusDefeat: "Défaite"
    },
    de: {
        tabOverview: "Übersicht",
        tabRecent: "Letzte Spiele",
        tabFriends: "Freunde",
        editProfile: "Profil Bearbeiten",
        following: "Folgt",
        followers: "Follower",
        achievements: "Erfolge",
        joined: "Beigetreten",
        recently: "Kürzlich",
        statGames: "Spiele",
        statWins: "Gewonnen",
        statLosses: "Verloren",
        statWinRate: "Gewinnrate",
        statDraws: "Unentschieden",
        statTurns: "Züge",
        recentActivity: "Letzte Aktivität",
        viewAll: "Alle Ansehen",
        noGames: "Noch keine Spiele gespielt.",
        noRecentGames: "Keine letzten Spiele gefunden. Fange an zu spielen, um deinen Verlauf aufzubauen.",
        friendsPrompt: "Finde Spieler, vergleiche Statistiken und sende Freundschaftsanfragen.",
        searchFriends: "Freunde Suchen",
        guestTitle: "Melde dich an, um dein STEENE-Profil zu erstellen.",
        guestNotice: "🔒 Melde dich an, um Matches aufzuzeichnen, deinen Avatar anzupassen und dich mit Freunden zu verbinden.",
        signUp: "Registrieren",
        logIn: "Anmelden",
        loading: "Profil wird geladen…",
        editTitle: "Profil Bearbeiten",
        editSubtitle: "Passe an, wie andere STEENE-Spieler dich sehen.",
        uploadPicture: "Bild Hochladen",
        chooseEmoji: "Emoji Wählen",
        displayName: "Anzeigename",
        bio: "Biografie",
        bioPlaceholder: "Erzähle anderen Spielern etwas über dich",
        cancel: "Abbrechen",
        saveChanges: "Änderungen Speichern",
        saving: "Speichern…",
        statusInProgress: "Läuft",
        statusDraw: "Unentschieden",
        statusVictory: "Sieg",
        statusDefeat: "Niederlage"
    }
};

const steeneProfileView = {
    _profile: null,
    _user: null,
    _editing: false,
    _activeTab: "overview",
    _editAvatar: "♟",
    _editAvatarUrl: "",
    _selectedAvatarFile: null,
    _profileNotice: "",
    _recentGames: [],
    _stats: null,
    _gamesChannel: null,
    _authSubscription: null,
    _refreshTimer: null,
    _initialized: false,

    t(key) {
        const settings = window.steeneSettingsView?._settings || {};
        const lang = settings.language || document.documentElement.lang || 'en';
        const dict = profileTranslations[lang] || profileTranslations.en;
        return dict[key] || profileTranslations.en[key] || key;
    },

    /**
     * Initializes the profile view.
     */
    async init() {
        if (this._initialized) {
            return;
        }

        this._initialized = true;

        this.bindGlobalEvents();
        this.bindFileInput();
        this.bindVisibilityListener();
        this.bindLanguageListener();

        await this.refresh();

        this.subscribeToAuthChanges();
        this.subscribeToRecentGames();
    },

    bindLanguageListener() {
        window.addEventListener('steene:settings-updated', () => {
            if (this._user && !this._editing) {
                this.render();
            }
        });
    },

    /**
     * Connects profile refreshes to Supabase authentication events.
     */
    subscribeToAuthChanges() {
        const supabase = window.steeneSupabase;

        if (!supabase?.auth) {
            return;
        }

        const result = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                this._user = session?.user || null;
                this._profile = null;
                this._recentGames = [];
                this._stats = null;
                this._editing = false;

                this.unsubscribeFromRecentGames();
                await this.refresh();
                this.subscribeToRecentGames();
            }
        );

        this._authSubscription =
            result?.data?.subscription || null;
    },

    /**
     * Refreshes profile, statistics, and recent games.
     */
    async refresh() {
        const container =
            document.getElementById("profile-data");

        if (!container) {
            return;
        }

        const session = await this.getSession();
        const user = session?.user || null;

        this._user = user;

        if (!user) {
            this._profile = null;
            this._recentGames = [];
            this._stats = null;
            this.renderGuest(container);
            return;
        }

        if (!this._profile) {
            this.renderLoading(container);

            this._profile =
                await this.fetchOrCreateProfile(user);
        }

        if (!this._editing) {
            await this.loadRecentGames(user.id);
            this._stats =
                this.calculateStatistics(
                    this._recentGames,
                    user.id
                );
        }

        this.render(container);
    },

    /**
     * Gets the active Supabase session safely.
     */
    async getSession() {
        const supabase = window.steeneSupabase;

        if (supabase?.auth?.getSession) {
            const { data, error } =
                await supabase.auth.getSession();

            if (!error) {
                return data?.session || null;
            }
        }

        return window.steeneAuth?.currentSession || null;
    },

    /**
     * Listens for page visibility changes so recently completed
     * games are checked when the user returns to the profile.
     */
    bindVisibilityListener() {
        document.addEventListener("visibilitychange", () => {
            if (
                document.visibilityState === "visible" &&
                this._user &&
                !this._editing
            ) {
                this.scheduleRefresh(250);
            }
        });

        window.addEventListener("focus", () => {
            if (this._user && !this._editing) {
                this.scheduleRefresh(250);
            }
        });
    },

    scheduleRefresh(delay = 500) {
        clearTimeout(this._refreshTimer);

        this._refreshTimer = setTimeout(() => {
            this.refresh();
        }, delay);
    },

    /**
     * Listens for new or updated games involving the current user.
     */
    subscribeToRecentGames() {
        const supabase = window.steeneSupabase;
        const userId = this._user?.id;

        if (!supabase?.channel || !userId) {
            return;
        }

        this.unsubscribeFromRecentGames();

        this._gamesChannel = supabase
            .channel(`profile-games-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: STEENE_PROFILE_CONFIG.gamesTable,
                    filter: `${STEENE_PROFILE_CONFIG.gamePlayerColumn}=eq.${userId}`
                },
                () => this.scheduleRefresh(200)
            )
            .subscribe();
    },

    unsubscribeFromRecentGames() {
        const supabase = window.steeneSupabase;

        if (
            supabase &&
            this._gamesChannel &&
            typeof supabase.removeChannel === "function"
        ) {
            supabase.removeChannel(this._gamesChannel);
        }

        this._gamesChannel = null;
    },

    /**
     * Fetches the current user's profile or creates one.
     */
    async fetchOrCreateProfile(user) {
        const supabase = window.steeneSupabase;

        const metadata =
            user.user_metadata || {};

        const emailName =
            user.email?.split("@")[0] ||
            "steene_player";

        const fallbackUsername =
            this.sanitizeUsername(
                metadata.username ||
                metadata.user_name ||
                emailName
            );

        const fallbackProfile = {
            id: user.id,
            username: fallbackUsername,
            avatar: "♟",
            avatar_url: "",
            cover_url: "",
            bio: "",
            created_at:
                user.created_at ||
                new Date().toISOString()
        };

        if (!supabase) {
            return fallbackProfile;
        }

        const { data, error } = await supabase
            .from(STEENE_PROFILE_CONFIG.profileTable)
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

        if (data && !error) {
            return {
                ...fallbackProfile,
                ...data
            };
        }

        const { data: created } = await supabase
            .from(STEENE_PROFILE_CONFIG.profileTable)
            .upsert(
                fallbackProfile,
                { onConflict: "id" }
            )
            .select("*")
            .single();

        return created || fallbackProfile;
    },

    /**
     * Loads recent games involving the authenticated user.
     */
    async loadRecentGames(userId) {
        const supabase = window.steeneSupabase;

        if (!supabase || !userId) {
            this._recentGames = [];
            return [];
        }

        const table =
            STEENE_PROFILE_CONFIG.gamesTable;

        const limit =
            STEENE_PROFILE_CONFIG.recentGamesLimit;

        const query = await supabase
            .from(table)
            .select("*")
            .eq(STEENE_PROFILE_CONFIG.gamePlayerColumn, userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        this._recentGames =
            query.error ? [] : query.data || [];

        return this._recentGames;
    },

    /**
     * Calculates profile statistics from recent/all available games.
     */
    calculateStatistics(games, userId) {
        const stats = {
            played: games.length,
            wins: 0,
            losses: 0,
            draws: 0,
            totalTurns: 0,
            winRate: 0
        };

        games.forEach(game => {
            const winnerId =
                game.winner_id ||
                game.winner ||
                null;

            const status =
                String(game.status || "").toLowerCase();

            const isDraw =
                status === "draw" ||
                status === "drawn" ||
                status === "stalemate" ||
                !winnerId &&
                (
                    status === "completed" ||
                    status === "finished"
                );

            if (isDraw) {
                stats.draws += 1;
            } else if (winnerId === userId) {
                stats.wins += 1;
            } else if (winnerId) {
                stats.losses += 1;
            }

            stats.totalTurns += Number(
                game.turns ||
                game.move_count ||
                game.moves ||
                0
            );
        });

        if (stats.played > 0) {
            stats.winRate = Math.round(
                (stats.wins / stats.played) * 100
            );
        }

        return stats;
    },

    setTab(tabName) {
        this._activeTab = tabName;
        this.render();
    },

    startEdit() {
        if (!this._user) {
            this.openLogin();
            return;
        }

        this._editing = true;
        this._editAvatar =
            this._profile?.avatar || "♟";
        this._editAvatarUrl =
            this._profile?.avatar_url || "";
        this._selectedAvatarFile = null;

        this.render();
    },

    cancelEdit() {
        this._editing = false;
        this.render();
    },

    async render(container = null) {
        const target =
            container ||
            document.getElementById("profile-data");

        if (!target) {
            return;
        }

        if (!this._user) {
            this.renderGuest(target);
            return;
        }

        if (this._editing) {
            this.renderEditForm(target);
            return;
        }

        const profile =
            this._profile || {
                username: "STEENE Player",
                avatar: "♟",
                avatar_url: ""
            };

        target.innerHTML = `
            <div class="steene-profile">
                ${
                    this._profileNotice
                        ? `
                            <div class="profile-notice" role="status">
                                ${steeneEscapeHtml(this._profileNotice)}
                            </div>
                        `
                        : ""
                }
                ${this.renderProfileHeader(profile)}

                <div class="profile-tabs" role="tablist">
                    <button
                        type="button"
                        class="profile-tab ${
                            this._activeTab === "overview"
                                ? "active"
                                : ""
                        }"
                        onclick="steeneProfileView.setTab('overview')"
                    >
                        ${steeneEscapeHtml(this.t("tabOverview"))}
                    </button>

                    <button
                        type="button"
                        class="profile-tab ${
                            this._activeTab === "recent"
                                ? "active"
                                : ""
                        }"
                        onclick="steeneProfileView.setTab('recent')"
                    >
                        ${steeneEscapeHtml(this.t("tabRecent"))}
                    </button>

                    <button
                        type="button"
                        class="profile-tab ${
                            this._activeTab === "friends"
                                ? "active"
                                : ""
                        }"
                        onclick="steeneProfileView.setTab('friends')"
                    >
                        ${steeneEscapeHtml(this.t("tabFriends"))}
                    </button>
                </div>

                <div class="profile-tab-content">
                    ${
                        this._activeTab === "overview"
                            ? this.renderOverview(profile)
                            : ""
                    }

                    ${
                        this._activeTab === "recent"
                            ? this.renderRecentGames()
                            : ""
                    }

                    ${
                        this._activeTab === "friends"
                            ? this.renderFriends()
                            : ""
                    }
                </div>
            </div>
        `;
    },

    renderProfileHeader(profile) {
        const username =
            profile.username ||
            "STEENE Player";

        const email =
            this._user?.email || "";

        const joinedDate =
            profile.created_at ||
            this._user?.created_at;

        const joinedText = joinedDate
            ? new Date(joinedDate).toLocaleDateString(
                undefined,
                {
                    month: "short",
                    year: "numeric"
                }
            )
            : this.t("recently");

        return `
            <div class="profile-cover">
                ${
                    profile.cover_url
                        ? `
                            <img
                                class="profile-cover-image"
                                src="${this.safeUrl(profile.cover_url)}"
                                alt=""
                            >
                        `
                        : ""
                }

                <button
                    type="button"
                    class="profile-cover-edit"
                    onclick="steeneProfileView.startEdit()"
                >
                    ${steeneEscapeHtml(this.t("editProfile"))}
                </button>
            </div>

            <div class="profile-header-group">
                ${this.renderAvatar(profile, "large")}

                <h2>
                    ${steeneEscapeHtml(username)}
                </h2>

                <p class="text-muted">
                    ${steeneEscapeHtml(email)}
                </p>

                ${
                    profile.bio
                        ? `
                            <p class="profile-bio">
                                ${steeneEscapeHtml(profile.bio)}
                            </p>
                        `
                        : ""
                }

                <div class="profile-social-stats">
                    <div>
                        <strong>
                            ${Number(profile.following || 0)}
                        </strong>
                        <small>${steeneEscapeHtml(this.t("following"))}</small>
                    </div>

                    <div>
                        <strong>
                            ${Number(profile.followers || 0)}
                        </strong>
                        <small>${steeneEscapeHtml(this.t("followers"))}</small>
                    </div>

                    <div>
                        <strong>
                            ${Number(
                                profile.achievements_count || 0
                            )}
                        </strong>
                        <small>${steeneEscapeHtml(this.t("achievements"))}</small>
                    </div>
                </div>

                <div class="profile-meta-line">
                    ${steeneEscapeHtml(this.t("joined"))} ${steeneEscapeHtml(joinedText)}
                </div>
            </div>
        `;
    },

    renderAvatar(profile, size = "normal") {
        const avatarUrl = profile?.avatar_url;

        if (avatarUrl) {
            return `
                <div class="profile-avatar-large ${size}">
                    <img
                        src="${this.safeUrl(avatarUrl)}"
                        alt="${steeneEscapeHtml(
                            profile.username || "Profile"
                        )}"
                        loading="lazy"
                    >
                </div>
            `;
        }

        return `
            <div class="profile-avatar-large ${size}">
                ${steeneEscapeHtml(profile?.avatar || "♟")}
            </div>
        `;
    },

    renderOverview(profile) {
        const stats =
            this._stats || {
                played: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                totalTurns: 0,
                winRate: 0
            };

        return `
            <div class="profile-overview">
                <div class="stats-grid">
                    ${this.statCard(this.t("statGames"), stats.played)}
                    ${this.statCard(this.t("statWins"), stats.wins)}
                    ${this.statCard(this.t("statLosses"), stats.losses)}
                    ${this.statCard(this.t("statWinRate"), `${stats.winRate}%`)}
                    ${this.statCard(this.t("statDraws"), stats.draws)}
                    ${this.statCard(this.t("statTurns"), stats.totalTurns)}
                </div>

                <div class="profile-section-card">
                    <div class="profile-section-heading">
                        <h3>${steeneEscapeHtml(this.t("recentActivity"))}</h3>

                        <button
                            type="button"
                            class="steene-btn btn-outline"
                            onclick="steeneProfileView.setTab('recent')"
                        >
                            ${steeneEscapeHtml(this.t("viewAll"))}
                        </button>
                    </div>

                    ${this.renderCompactRecentGames()}
                </div>
            </div>
        `;
    },

    statCard(label, value) {
        return `
            <div class="sc">
                <div class="sc-val">
                    ${steeneEscapeHtml(value)}
                </div>

                <div class="sc-lbl">
                    ${steeneEscapeHtml(label)}
                </div>
            </div>
        `;
    },

    renderRecentGames() {
        if (!this._recentGames.length) {
            return `
                <div class="empty-state">
                    ${steeneEscapeHtml(this.t("noRecentGames"))}
                </div>
            `;
        }

        return `
            <div class="recent-games-list">
                ${this._recentGames
                    .map(game => this.renderGameRow(game))
                    .join("")}
            </div>
        `;
    },

    renderCompactRecentGames() {
        if (!this._recentGames.length) {
            return `
                <div class="empty-state compact">
                    ${steeneEscapeHtml(this.t("noGames"))}
                </div>
            `;
        }

        return `
            <div class="recent-games-list compact">
                ${this._recentGames
                    .slice(0, 4)
                    .map(game => this.renderGameRow(game))
                    .join("")}
            </div>
        `;
    },

    renderGameRow(game) {
        const userId = this._user?.id;

        const winnerId =
            game.winner_id ||
            game.winner ||
            null;

        const isDraw =
            String(game.status || "").toLowerCase() === "draw" ||
            String(game.status || "").toLowerCase() === "drawn" ||
            (!winnerId &&
                ["completed", "finished"].includes(
                    String(game.status || "").toLowerCase()
                ));

        let result = this.t("statusInProgress");
        let resultClass = "pending";

        if (isDraw) {
            result = this.t("statusDraw");
            resultClass = "draw";
        } else if (winnerId === userId) {
            result = this.t("statusVictory");
            resultClass = "win";
        } else if (winnerId) {
            result = this.t("statusDefeat");
            resultClass = "loss";
        }

        const opponent =
            game.white_player_id === userId
                ? game.black_player_name ||
                  game.black_username ||
                  "Black"
                : game.white_player_name ||
                  game.white_username ||
                  "White";

        const date = game.created_at
            ? new Date(game.created_at).toLocaleDateString(
                undefined,
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            )
            : this.t("recently");

        const mode =
            game.mode ||
            game.game_mode ||
            "STEENE";

        return `
            <div class="recent-game-row">
                <div class="recent-game-icon">
                    ${resultClass === "win" ? "🏆" : "♟"}
                </div>

                <div class="recent-game-main">
                    <strong>
                        ${steeneEscapeHtml(mode)}
                    </strong>

                    <span>
                        vs ${steeneEscapeHtml(opponent)}
                    </span>
                </div>

                <div class="recent-game-date">
                    ${steeneEscapeHtml(date)}
                </div>

                <div class="recent-game-result ${resultClass}">
                    ${steeneEscapeHtml(result)}
                </div>
            </div>
        `;
    },

    renderFriends() {
        return `
            <div class="profile-friends-panel">
                <div class="empty-state">
                    ${steeneEscapeHtml(this.t("friendsPrompt"))}
                </div>

                <button
                    type="button"
                    class="steene-btn btn-primary"
                    onclick="steeneProfileView.openExplore()"
                >
                    ${steeneEscapeHtml(this.t("searchFriends"))}
                </button>
            </div>
        `;
    },

    renderGuest(container) {
        const guestName =
            `Guest_${Math.floor(
                1000 + Math.random() * 9000
            )}`;

        container.innerHTML = `
            <div class="profile-cover"></div>

            <div class="profile-header-group">
                <div class="profile-avatar-large">
                    👤
                </div>

                <h2>${guestName}</h2>

                <p class="text-muted">
                    ${steeneEscapeHtml(this.t("guestTitle"))}
                </p>

                <div class="profile-social-stats">
                    <div>
                        <strong>0</strong>
                        <small>${steeneEscapeHtml(this.t("following"))}</small>
                    </div>

                    <div>
                        <strong>0</strong>
                        <small>${steeneEscapeHtml(this.t("followers"))}</small>
                    </div>

                    <div>
                        <strong>0</strong>
                        <small>${steeneEscapeHtml(this.t("statGames"))}</small>
                    </div>
                </div>

                <div class="profile-edit-actions">
                    <button
                        type="button"
                        class="steene-btn btn-primary"
                        onclick="steeneProfileView.openSignup()"
                    >
                        ${steeneEscapeHtml(this.t("signUp"))}
                    </button>

                    <button
                        type="button"
                        class="steene-btn btn-outline"
                        onclick="steeneProfileView.openLogin()"
                    >
                        ${steeneEscapeHtml(this.t("logIn"))}
                    </button>
                </div>
            </div>

            <div class="empty-state">
                ${steeneEscapeHtml(this.t("guestNotice"))}
            </div>
        `;
    },

    renderLoading(container) {
        container.innerHTML = `
            <div class="profile-card-inner profile-loading">
                <div class="profile-spinner"></div>
                <p class="text-muted">
                    ${steeneEscapeHtml(this.t("loading"))}
                </p>
            </div>
        `;
    },

    renderEditForm(container) {
        const profile =
            this._profile || {
                username: "",
                avatar: "♟",
                avatar_url: "",
                bio: ""
            };

        container.innerHTML = `
            <div class="profile-card-inner profile-edit-view">
                <div class="profile-edit-heading">
                    <div>
                        <h2>${steeneEscapeHtml(this.t("editTitle"))}</h2>
                        <p class="text-muted">
                            ${steeneEscapeHtml(this.t("editSubtitle"))}
                        </p>
                    </div>

                    <button
                        type="button"
                        class="profile-close-edit"
                        onclick="steeneProfileView.cancelEdit()"
                        aria-label="Cancel editing"
                    >
                        ×
                    </button>
                </div>

                <div class="profile-edit-avatar-area">
                    <button
                        type="button"
                        id="profileEditAvatarDisplay"
                        class="profile-avatar-edit"
                        onclick="steeneProfileView.toggleAvatarPicker()"
                        aria-label="Choose avatar"
                    >
                        ${this.renderEditAvatar()}
                    </button>

                    <div class="profile-avatar-actions">
                        <button
                            type="button"
                            class="steene-btn btn-outline"
                            onclick="steeneProfileView.openAvatarFilePicker()"
                        >
                            ${steeneEscapeHtml(this.t("uploadPicture"))}
                        </button>

                        <button
                            type="button"
                            id="profileEmojiPickerButton"
                            class="steene-btn btn-outline"
                            onclick="steeneProfileView.toggleAvatarPicker()"
                        >
                            ${steeneEscapeHtml(this.t("chooseEmoji"))}
                        </button>

                        <input
                            id="profileAvatarFile"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hidden
                        >
                    </div>
                </div>

                <div
                    id="profileAvatarPicker"
                    class="avatar-picker-grid hidden"
                >
                    ${this.renderAvatarChoices()}
                </div>

                <label class="profile-edit-field">
                    <span>${steeneEscapeHtml(this.t("displayName"))}</span>

                    <input
                        id="profileUsernameInput"
                        type="text"
                        maxlength="${STEENE_PROFILE_CONFIG.usernameMaxLength}"
                        value="${steeneEscapeHtml(
                            profile.username || ""
                        )}"
                        autocomplete="nickname"
                    >
                </label>

                <label class="profile-edit-field">
                    <span>${steeneEscapeHtml(this.t("bio"))}</span>

                    <textarea
                        id="profileBioInput"
                        maxlength="${STEENE_PROFILE_CONFIG.bioMaxLength}"
                        rows="4"
                        placeholder="${steeneEscapeHtml(this.t("bioPlaceholder"))}"
                    >${steeneEscapeHtml(profile.bio || "")}</textarea>
                </label>

                <div
                    id="profileEditError"
                    class="profile-edit-error"
                    role="alert"
                ></div>

                <div class="profile-edit-actions">
                    <button
                        type="button"
                        class="steene-btn btn-outline"
                        onclick="steeneProfileView.cancelEdit()"
                    >
                        ${steeneEscapeHtml(this.t("cancel"))}
                    </button>

                    <button
                        type="button"
                        id="profileSaveButton"
                        class="steene-btn btn-primary"
                        onclick="steeneProfileView.saveEdit()"
                    >
                        ${steeneEscapeHtml(this.t("saveChanges"))}
                    </button>
                </div>
            </div>
        `;

        this.bindFileInput();
    },

    renderEditAvatar() {
        if (this._editAvatarUrl) {
            return `
                <img
                    src="${this.safeUrl(this._editAvatarUrl)}"
                    alt="Selected profile picture"
                >
            `;
        }

        return steeneEscapeHtml(
            this._editAvatar || "♟"
        );
    },

    renderAvatarChoices() {
        return STEENE_AVATAR_CHOICES
            .map(avatar => `
                <button
                    type="button"
                    class="av-opt ${
                        this._editAvatar === avatar &&
                        !this._editAvatarUrl
                            ? "selected"
                            : ""
                    }"
                    onclick="steeneProfileView.selectAvatar('${avatar}')"
                    aria-label="Use ${steeneEscapeHtml(avatar)} avatar"
                >
                    ${steeneEscapeHtml(avatar)}
                </button>
            `)
            .join("");
    },

    buildAvatarPicker() {
        const picker =
            document.getElementById(
                "profileAvatarPicker"
            );

        if (picker) {
            picker.innerHTML =
                this.renderAvatarChoices();
        }
    },

    toggleAvatarPicker() {
        const picker =
            document.getElementById(
                "profileAvatarPicker"
            );

        picker?.classList.toggle("hidden");
    },

    selectAvatar(avatar) {
        this.clearSelectedAvatarFile();
        this._editAvatar = avatar;
        this._editAvatarUrl = "";

        const display =
            document.getElementById(
                "profileEditAvatarDisplay"
            );

        if (display) {
            display.innerHTML =
                this.renderEditAvatar();
        }

        this.buildAvatarPicker();
    },

    bindFileInput() {
        const input =
            document.getElementById(
                "profileAvatarFile"
            );

        if (!input || input.dataset.bound === "true") {
            return;
        }

        input.dataset.bound = "true";

        input.addEventListener("change", event => {
            const file =
                event.target.files?.[0];

            if (file) {
                this.handleAvatarFile(file);
            }
        });
    },

    openAvatarFilePicker() {
        document
            .getElementById("profileAvatarFile")
            ?.click();
    },

    async handleAvatarFile(file) {
        const error =
            document.getElementById(
                "profileEditError"
            );

        if (
            !STEENE_PROFILE_CONFIG.allowedImageTypes
                .includes(file.type)
        ) {
            if (error) {
                error.textContent =
                    "Please select a JPG, PNG, WEBP, or GIF image.";
            }

            return;
        }

        if (
            file.size >
            STEENE_PROFILE_CONFIG.maxAvatarFileSize
        ) {
            if (error) {
                error.textContent =
                    "Profile pictures must be smaller than 5 MB.";
            }

            return;
        }

        this.clearSelectedAvatarFile();

        const localUrl = URL.createObjectURL(file);

        this._editAvatarUrl = localUrl;
        this._editAvatar = "";
        this._selectedAvatarFile = file;

        const display =
            document.getElementById(
                "profileEditAvatarDisplay"
            );

        if (display) {
            display.innerHTML =
                this.renderEditAvatar();
        }

        if (error) {
            error.textContent =
                "Image selected. Save changes to upload it.";
        }
    },

    removeUploadedAvatar() {
        this.clearSelectedAvatarFile();
        this._editAvatarUrl = "";
        this._editAvatar =
            this._profile?.avatar || "♟";

        const display =
            document.getElementById(
                "profileEditAvatarDisplay"
            );

        if (display) {
            display.innerHTML =
                this.renderEditAvatar();
        }

        this.buildAvatarPicker();
    },

    clearSelectedAvatarFile() {
        if (this._editAvatarUrl.startsWith("blob:")) {
            URL.revokeObjectURL(this._editAvatarUrl);
        }

        this._selectedAvatarFile = null;

        const input = document.getElementById("profileAvatarFile");

        if (input) {
            input.value = "";
        }
    },

    async uploadAvatar(file, userId) {
        const supabase = window.steeneSupabase;

        if (!supabase?.storage) {
            throw new Error(
                "Supabase Storage is not configured."
            );
        }

        const bucketsResult =
            await supabase.storage.listBuckets();

        if (bucketsResult.error) {
            throw bucketsResult.error;
        }

        const avatarBucket =
            bucketsResult.data?.find(
                bucket =>
                    bucket.name ===
                    STEENE_PROFILE_CONFIG.avatarBucket
            );

        if (!avatarBucket) {
            throw new Error(
                `Profile photo uploads are unavailable because the "${STEENE_PROFILE_CONFIG.avatarBucket}" Storage bucket has not been created.`
            );
        }

        if (!avatarBucket.public) {
            throw new Error(
                `Profile photo uploads require the "${STEENE_PROFILE_CONFIG.avatarBucket}" Storage bucket to be public.`
            );
        }

        const extension =
            file.name.split(".").pop()?.toLowerCase() ||
            "jpg";

        const path =
            `${userId}/avatar-${Date.now()}.${extension}`;

        const bucket =
            supabase.storage.from(
                STEENE_PROFILE_CONFIG.avatarBucket
            );

        const uploadResult =
            await bucket.upload(path, file, {
                cacheControl: "3600",
                upsert: true,
                contentType: file.type
            });

        if (uploadResult.error) {
            throw uploadResult.error;
        }

        const publicResult =
            bucket.getPublicUrl(path);

        return publicResult?.data?.publicUrl || "";
    },

    async saveEdit() {
        const errorBox =
            document.getElementById(
                "profileEditError"
            );

        const saveButton =
            document.getElementById(
                "profileSaveButton"
            );

        const usernameInput =
            document.getElementById(
                "profileUsernameInput"
            );

        const bioInput =
            document.getElementById(
                "profileBioInput"
            );

        const username =
            usernameInput?.value.trim() || "";

        const bio =
            bioInput?.value.trim() || "";

        if (
            username.length <
            STEENE_PROFILE_CONFIG.usernameMinLength
        ) {
            if (errorBox) {
                errorBox.textContent =
                    `Display name must contain at least ${
                        STEENE_PROFILE_CONFIG.usernameMinLength
                    } characters.`;
            }

            return;
        }

        if (
            username.length >
            STEENE_PROFILE_CONFIG.usernameMaxLength
        ) {
            if (errorBox) {
                errorBox.textContent =
                    `Display name cannot exceed ${
                        STEENE_PROFILE_CONFIG.usernameMaxLength
                    } characters.`;
            }

            return;
        }

        if (
            bio.length >
            STEENE_PROFILE_CONFIG.bioMaxLength
        ) {
            if (errorBox) {
                errorBox.textContent =
                    `Bio cannot exceed ${
                        STEENE_PROFILE_CONFIG.bioMaxLength
                    } characters.`;
            }

            return;
        }

        const session =
            await this.getSession();

        const user =
            session?.user || this._user;

        if (!user) {
            return;
        }

        if (!window.steeneSupabase) {
            if (errorBox) {
                errorBox.textContent =
                    "Profile service is unavailable.";
            }

            return;
        }

        try {
            if (saveButton) {
                saveButton.disabled = true;
                saveButton.textContent = this.t("saving");
            }

            let avatarUrl = this._profile?.avatar_url || "";
            let uploadWarning = "";
            const file = this._selectedAvatarFile;

            if (this._editAvatar) {
                avatarUrl = "";
            }

            if (file) {
                try {
                    avatarUrl = await this.uploadAvatar(file, user.id);
                } catch (_uploadError) {
                    avatarUrl = this._profile?.avatar_url || "";
                    uploadWarning =
                        "Your profile details were saved, but your photo could not be uploaded. Create the avatars Storage bucket to enable photo uploads.";
                }
            }

            const updates = {
                id: user.id,
                username,
                bio,
                avatar:
                    avatarUrl
                        ? ""
                        : this._editAvatar ||
                          this._profile?.avatar ||
                          "♟",
                avatar_url: avatarUrl,
                updated_at:
                    new Date().toISOString()
            };

            const { data, error } =
                await window.steeneSupabase
                    .from(
                        STEENE_PROFILE_CONFIG.profileTable
                    )
                    .upsert(
                        updates,
                        { onConflict: "id" }
                    )
                    .select("*")
                    .single();

            if (error) {
                throw error;
            }

            this._profile = data;
            this._editing = false;
            this.clearSelectedAvatarFile();
            this._editAvatarUrl = "";
            this._profileNotice = uploadWarning;

            await this.refresh();
        } catch (saveError) {
            console.error(
                "STEENE profile save error:",
                saveError
            );

            if (errorBox) {
                errorBox.textContent =
                    saveError.message ||
                    "Unable to save profile changes.";
            }

            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent = this.t("saveChanges");
            }
        }
    },

    openExplore() {
        if (typeof window.goTo === "function") {
            window.goTo("explore");
        } else if (
            typeof window.navigateTo === "function"
        ) {
            window.navigateTo("explore");
        } else {
            window.location.hash = "#explore";
        }

        if (
            window.steeneExploreView &&
            typeof window.steeneExploreView.init === "function"
        ) {
            window.steeneExploreView.init();
        }
    },

    openLogin() {
        if (
            window.steeneAuth &&
            typeof window.steeneAuth.openModal === "function"
        ) {
            window.steeneAuth.openModal("login");
        } else if (
            typeof window.openLoginModal === "function"
        ) {
            window.openLoginModal();
        }
    },

    openSignup() {
        if (
            window.steeneAuth &&
            typeof window.steeneAuth.openModal === "function"
        ) {
            window.steeneAuth.openModal("signup");
        } else if (
            typeof window.openSignupModal === "function"
        ) {
            window.openSignupModal();
        }
    },

    sanitizeUsername(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "_")
            .replace(/_+/g, "_")
            .slice(0, STEENE_PROFILE_CONFIG.usernameMaxLength)
            .replace(/^_+|_+$/g, "") ||
            "steene_player";
    },

    safeUrl(value) {
        const url = String(value || "");

        if (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("blob:")
        ) {
            return steeneEscapeHtml(url);
        }

        return "";
    },

    bindGlobalEvents() {
        document.addEventListener("click", event => {
            const picker =
                document.getElementById(
                    "profileAvatarPicker"
                );

            const avatarButton =
                document.getElementById(
                    "profileEditAvatarDisplay"
                );

            const emojiPickerButton =
                document.getElementById(
                    "profileEmojiPickerButton"
                );

            if (
                picker &&
                avatarButton &&
                !picker.contains(event.target) &&
                !avatarButton.contains(event.target) &&
                !emojiPickerButton?.contains(event.target)
            ) {
                picker.classList.add("hidden");
            }
        });
    },

    destroy() {
        this.unsubscribeFromRecentGames();

        if (this._authSubscription) {
            this._authSubscription.unsubscribe();
            this._authSubscription = null;
        }

        clearTimeout(this._refreshTimer);
    }
};

/**
 * HTML escaping helper.
 */
function steeneEscapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

window.steeneProfileView =
    steeneProfileView;

window.STEENE_AVATAR_CHOICES =
    STEENE_AVATAR_CHOICES;

window.addEventListener(
    "DOMContentLoaded",
    () => steeneProfileView.init()
);