/**
 * STEENE — steene/js/views/explore.js
 *
 * Player discovery and friends view.
 *
 * Features:
 * - Loads registered users from Supabase
 * - Search by username
 * - Filter by player status
 * - Pagination / load more
 * - Profile cards with avatar, rating, games, and win rate
 * - Send, cancel, accept, and remove friend requests
 * - Realtime profile and friendship updates
 * - Navigate to another player's profile
 *
 * Expected Supabase tables:
 *
 * profiles:
 *   id, username, avatar, avatar_url, bio,
 *   rating, followers, following, created_at, updated_at
 *
 * games:
 *   id, white_player_id, black_player_id, winner_id,
 *   status, created_at
 *
 * friendships:
 *   id, requester_id, addressee_id, status, created_at, updated_at
 *
 * Recommended friendship statuses:
 *   pending, accepted, declined, cancelled
 */

"use strict";

const STEENE_EXPLORE_CONFIG = {
    profilesTable: "profiles",
    gamesTable: "games",
    friendshipsTable: "friendships",

    pageSize: 18,
    searchDelay: 350,
    maxSearchLength: 40
};

const steeneExploreView = {
    _initialized: false,
    _profiles: [],
    _friendships: [],
    _currentUser: null,
    _searchTerm: "",
    _filter: "all",
    _page: 0,
    _hasMore: true,
    _loading: false,
    _searchTimer: null,
    _profilesChannel: null,
    _friendshipsChannel: null,
    _authSubscription: null,

    /**
     * Initializes the Explore screen.
     *
     * The page should contain:
     *
     * <div id="explore-data"></div>
     *
     * Optional controls:
     *
     * <input id="exploreSearch">
     * <select id="exploreFilter">
     * <button id="exploreLoadMore">
     */
    async init() {
        if (this._initialized) {
            await this.refresh();
            return;
        }

        this._initialized = true;

        this.bindControls();
        this.subscribeToAuthChanges();

        await this.refresh();
        this.subscribeToRealtimeChanges();
    },

    /**
     * Gets the current Supabase session.
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
     * Watches login and logout events.
     */
    subscribeToAuthChanges() {
        const supabase = window.steeneSupabase;

        if (!supabase?.auth) {
            return;
        }

        const result = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                this._currentUser =
                    session?.user || null;

                this._friendships = [];
                this.resetPagination();

                await this.loadFriendships();
                await this.loadProfiles();

                this.subscribeToRealtimeChanges();
            }
        );

        this._authSubscription =
            result?.data?.subscription || null;
    },

    /**
     * Binds search, filter, and load-more controls.
     */
    bindControls() {
        const search =
            document.getElementById("exploreSearch");

        if (search && search.dataset.bound !== "true") {
            search.dataset.bound = "true";

            search.addEventListener("input", event => {
                clearTimeout(this._searchTimer);

                this._searchTimer = setTimeout(() => {
                    this._searchTerm =
                        String(event.target.value || "")
                            .trim()
                            .slice(
                                0,
                                STEENE_EXPLORE_CONFIG.maxSearchLength
                            );

                    this.resetPagination();
                    this.loadProfiles();
                }, STEENE_EXPLORE_CONFIG.searchDelay);
            });
        }

        const filter =
            document.getElementById("exploreFilter");

        if (filter && filter.dataset.bound !== "true") {
            filter.dataset.bound = "true";

            filter.addEventListener("change", event => {
                this._filter =
                    event.target.value || "all";

                this.resetPagination();
                this.render();
            });
        }

        const loadMore =
            document.getElementById("exploreLoadMore");

        if (loadMore && loadMore.dataset.bound !== "true") {
            loadMore.dataset.bound = "true";

            loadMore.addEventListener(
                "click",
                () => this.loadMore()
            );
        }
    },

    /**
     * Loads the Explore screen.
     */
    async refresh() {
        const container =
            document.getElementById("explore-data");

        if (!container) {
            return;
        }

        const session =
            await this.getSession();

        this._currentUser =
            session?.user || null;

        this.renderLoading();

        await this.loadFriendships();
        await this.loadProfiles();
    },

    resetPagination() {
        this._profiles = [];
        this._page = 0;
        this._hasMore = true;
    },

    /**
     * Loads player profiles from Supabase.
     */
    async loadProfiles() {
        const supabase = window.steeneSupabase;

        if (!supabase) {
            this.renderError(
                "The player directory is unavailable."
            );

            return;
        }

        if (this._loading || !this._hasMore) {
            return;
        }

        this._loading = true;
        this.renderLoadingState();

        const from =
            this._page *
            STEENE_EXPLORE_CONFIG.pageSize;

        const to =
            from +
            STEENE_EXPLORE_CONFIG.pageSize -
            1;

        let query =
            supabase
                .from(STEENE_EXPLORE_CONFIG.profilesTable)
                .select("*", {
                    count: "exact"
                })
                .order("created_at", {
                    ascending: false
                })
                .range(from, to);

        /*
         * Username search.
         *
         * The username column must be searchable in Supabase.
         * This can be improved with a PostgreSQL text-search
         * index for large user directories.
         */
        if (this._searchTerm) {
            const escaped =
                this._searchTerm
                    .replace(/[%_]/g, "");

            query =
                query.ilike(
                    "username",
                    `%${escaped}%`
                );
        }

        const { data, error } =
            await query;

        this._loading = false;

        if (error) {
            console.error(
                "STEENE Explore profile error:",
                error
            );

            this.renderError(
                "Unable to load players right now."
            );

            return;
        }

        const results =
            (data || []).filter(profile => {
                if (
                    this._currentUser?.id &&
                    profile.id === this._currentUser.id
                ) {
                    return false;
                }

                return true;
            });

        this._profiles =
            this._page === 0
                ? results
                : [...this._profiles, ...results];

        this._hasMore =
            results.length >=
            STEENE_EXPLORE_CONFIG.pageSize;

        this._page += 1;

        this.render();
    },

    async loadMore() {
        if (!this._loading && this._hasMore) {
            await this.loadProfiles();
        }
    },

    /**
     * Loads friend relationships for the signed-in user.
     */
    async loadFriendships() {
        const supabase = window.steeneSupabase;
        const userId = this._currentUser?.id;

        if (!supabase || !userId) {
            this._friendships = [];
            return;
        }

        const table =
            STEENE_EXPLORE_CONFIG.friendshipsTable;

        const { data, error } =
            await supabase
                .from(table)
                .select("*")
                .or(
                    `requester_id.eq.${userId},addressee_id.eq.${userId}`
                );

        if (error) {
            console.warn(
                "STEENE friendship loading warning:",
                error
            );

            this._friendships = [];
            return;
        }

        this._friendships = data || [];
    },

    /**
     * Realtime listeners for user and friendship updates.
     */
    subscribeToRealtimeChanges() {
        const supabase = window.steeneSupabase;

        if (!supabase?.channel) {
            return;
        }

        this.unsubscribeFromRealtimeChanges();

        this._profilesChannel =
            supabase
                .channel("steene-explore-profiles")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table:
                            STEENE_EXPLORE_CONFIG.profilesTable
                    },
                    () => {
                        this.resetPagination();
                        this.loadProfiles();
                    }
                )
                .subscribe();

        if (this._currentUser?.id) {
            this._friendshipsChannel =
                supabase
                    .channel(
                        `steene-friendships-${this._currentUser.id}`
                    )
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table:
                                STEENE_EXPLORE_CONFIG
                                    .friendshipsTable
                        },
                        async () => {
                            await this.loadFriendships();
                            this.render();
                        }
                    )
                    .subscribe();
        }
    },

    unsubscribeFromRealtimeChanges() {
        const supabase = window.steeneSupabase;

        if (
            supabase &&
            typeof supabase.removeChannel === "function"
        ) {
            if (this._profilesChannel) {
                supabase.removeChannel(
                    this._profilesChannel
                );
            }

            if (this._friendshipsChannel) {
                supabase.removeChannel(
                    this._friendshipsChannel
                );
            }
        }

        this._profilesChannel = null;
        this._friendshipsChannel = null;
    },

    /**
     * Gets the relationship between the current user
     * and another profile.
     */
    getRelationship(profileId) {
        const userId =
            this._currentUser?.id;

        if (!userId || !profileId) {
            return {
                status: "guest",
                friendship: null
            };
        }

        const friendship =
            this._friendships.find(item => {
                return (
                    item.requester_id === profileId &&
                    item.addressee_id === userId
                ) || (
                    item.requester_id === userId &&
                    item.addressee_id === profileId
                );
            });

        if (!friendship) {
            return {
                status: "none",
                friendship: null
            };
        }

        if (
            friendship.status === "accepted"
        ) {
            return {
                status: "friends",
                friendship
            };
        }

        if (
            friendship.status === "pending" &&
            friendship.requester_id === userId
        ) {
            return {
                status: "requested",
                friendship
            };
        }

        if (
            friendship.status === "pending" &&
            friendship.addressee_id === userId
        ) {
            return {
                status: "incoming",
                friendship
            };
        }

        return {
            status: friendship.status || "none",
            friendship
        };
    },

    getFilteredProfiles() {
        return this._profiles.filter(profile => {
            const relationship =
                this.getRelationship(profile.id);

            if (this._filter === "all") {
                return true;
            }

            if (this._filter === "online") {
                return (
                    profile.is_online === true ||
                    profile.online === true
                );
            }

            if (this._filter === "friends") {
                return relationship.status === "friends";
            }

            if (this._filter === "requested") {
                return (
                    relationship.status === "requested" ||
                    relationship.status === "incoming"
                );
            }

            return true;
        });
    },

    render() {
        const container =
            document.getElementById("explore-data");

        if (!container) {
            return;
        }

        const profiles =
            this.getFilteredProfiles();

        container.innerHTML = `
            <div class="explore-view">
                <div class="explore-header">
                    <div>
                        <p class="eyebrow">STEENE Community</p>
                        <h2>Explore Players</h2>
                        <p class="text-muted">
                            Discover players, compare progress,
                            and connect with the community.
                        </p>
                    </div>

                    <div class="explore-count">
                        ${this._profiles.length} players
                    </div>
                </div>

                ${this.renderSearchControls()}

                ${
                    profiles.length
                        ? `
                            <div class="explore-grid">
                                ${profiles
                                    .map(profile =>
                                        this.renderPlayerCard(profile)
                                    )
                                    .join("")}
                            </div>
                        `
                        : this.renderEmptyState()
                }

                <div class="explore-footer">
                    <button
                        type="button"
                        id="exploreLoadMore"
                        class="steene-btn btn-outline"
                        ${
                            this._hasMore &&
                            !this._loading
                                ? ""
                                : "disabled"
                        }
                    >
                        ${
                            this._loading
                                ? "Loading…"
                                : this._hasMore
                                    ? "Load More"
                                    : "No More Players"
                        }
                    </button>
                </div>
            </div>
        `;

        const loadMore =
            document.getElementById(
                "exploreLoadMore"
            );

        loadMore?.addEventListener(
            "click",
            () => this.loadMore()
        );
    },

    renderSearchControls() {
        return `
            <div class="explore-controls">
                <label
                    class="explore-search"
                    for="exploreSearch"
                >
                    <span aria-hidden="true">⌕</span>

                    <input
                        id="exploreSearch"
                        type="search"
                        value="${steeneExploreEscapeHtml(
                            this._searchTerm
                        )}"
                        maxlength="${
                            STEENE_EXPLORE_CONFIG
                                .maxSearchLength
                        }"
                        placeholder="Search players by username"
                        autocomplete="off"
                    >
                </label>

                <select
                    id="exploreFilter"
                    class="explore-filter"
                    aria-label="Filter players"
                >
                    <option
                        value="all"
                        ${
                            this._filter === "all"
                                ? "selected"
                                : ""
                        }
                    >
                        All Players
                    </option>

                    <option
                        value="online"
                        ${
                            this._filter === "online"
                                ? "selected"
                                : ""
                        }
                    >
                        Online
                    </option>

                    <option
                        value="friends"
                        ${
                            this._filter === "friends"
                                ? "selected"
                                : ""
                        }
                    >
                        Friends
                    </option>

                    <option
                        value="requested"
                        ${
                            this._filter === "requested"
                                ? "selected"
                                : ""
                        }
                    >
                        Requests
                    </option>
                </select>
            </div>
        `;
    },

    renderPlayerCard(profile) {
        const relationship =
            this.getRelationship(profile.id);

        const rating =
            profile.rating ||
            profile.elo ||
            1200;

        const games =
            profile.games_played ||
            profile.total_games ||
            0;

        const winRate =
            profile.win_rate !== undefined
                ? `${profile.win_rate}%`
                : "—";

        const online =
            profile.is_online === true ||
            profile.online === true;

        return `
            <article class="explore-player-card">
                <button
                    type="button"
                    class="explore-player-main"
                    onclick="steeneExploreView.openProfile('${this.escapeAttribute(
                        profile.id
                    )}')"
                >
                    <span class="explore-avatar-wrap">
                        ${this.renderAvatar(profile)}

                        <span
                            class="explore-online-dot ${
                                online ? "online" : ""
                            }"
                            title="${
                                online
                                    ? "Online"
                                    : "Offline"
                            }"
                        ></span>
                    </span>

                    <span class="explore-player-name">
                        ${steeneExploreEscapeHtml(
                            profile.username ||
                            "STEENE Player"
                        )}
                    </span>

                    <span class="explore-player-bio">
                        ${steeneExploreEscapeHtml(
                            profile.bio ||
                            "STEENE player"
                        )}
                    </span>
                </button>

                <div class="explore-player-stats">
                    <div>
                        <strong>
                            ${steeneExploreEscapeHtml(rating)}
                        </strong>
                        <small>Rating</small>
                    </div>

                    <div>
                        <strong>
                            ${steeneExploreEscapeHtml(games)}
                        </strong>
                        <small>Games</small>
                    </div>

                    <div>
                        <strong>
                            ${steeneExploreEscapeHtml(winRate)}
                        </strong>
                        <small>Win Rate</small>
                    </div>
                </div>

                <div class="explore-player-actions">
                    ${this.renderRelationshipButton(
                        profile,
                        relationship
                    )}
                </div>
            </article>
        `;
    },

    renderAvatar(profile) {
        const avatarUrl =
            profile.avatar_url;

        if (avatarUrl) {
            return `
                <span class="explore-avatar image-avatar">
                    <img
                        src="${this.safeUrl(avatarUrl)}"
                        alt=""
                        loading="lazy"
                    >
                </span>
            `;
        }

        return `
            <span class="explore-avatar">
                ${steeneExploreEscapeHtml(
                    profile.avatar || "♟"
                )}
            </span>
        `;
    },

    renderRelationshipButton(profile, relationship) {
        if (!this._currentUser) {
            return `
                <button
                    type="button"
                    class="steene-btn btn-outline"
                    onclick="steeneExploreView.requireLogin()"
                >
                    Sign In to Connect
                </button>
            `;
        }

        if (relationship.status === "friends") {
            return `
                <button
                    type="button"
                    class="steene-btn btn-success"
                    onclick="steeneExploreView.removeFriend('${this.escapeAttribute(
                        profile.id
                    )}')"
                >
                    Friends
                </button>
            `;
        }

        if (relationship.status === "requested") {
            return `
                <button
                    type="button"
                    class="steene-btn btn-outline"
                    onclick="steeneExploreView.cancelRequest('${this.escapeAttribute(
                        relationship.friendship.id
                    )}')"
                >
                    Request Sent
                </button>
            `;
        }

        if (relationship.status === "incoming") {
            return `
                <div class="friend-request-actions">
                    <button
                        type="button"
                        class="steene-btn btn-primary"
                        onclick="steeneExploreView.acceptRequest('${this.escapeAttribute(
                            relationship.friendship.id
                        )}')"
                    >
                        Accept
                    </button>

                    <button
                        type="button"
                        class="steene-btn btn-outline"
                        onclick="steeneExploreView.declineRequest('${this.escapeAttribute(
                            relationship.friendship.id
                        )}')"
                    >
                        Decline
                    </button>
                </div>
            `;
        }

        return `
            <button
                type="button"
                class="steene-btn btn-primary"
                onclick="steeneExploreView.sendRequest('${this.escapeAttribute(
                    profile.id
                )}')"
            >
                Add Friend
            </button>
        `;
    },

    renderEmptyState() {
        if (this._searchTerm) {
            return `
                <div class="empty-state explore-empty">
                    <div class="empty-state-icon">⌕</div>
                    <h3>No players found</h3>
                    <p>
                        Try searching with another username.
                    </p>
                </div>
            `;
        }

        return `
            <div class="empty-state explore-empty">
                <div class="empty-state-icon">♟</div>
                <h3>No players available</h3>
                <p>
                    New players will appear here after they join STEENE.
                </p>
            </div>
        `;
    },

    renderLoading() {
        const container =
            document.getElementById("explore-data");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="profile-card-inner explore-loading">
                <div class="profile-spinner"></div>
                <p class="text-muted">
                    Loading players…
                </p>
            </div>
        `;
    },

    renderLoadingState() {
        const button =
            document.getElementById(
                "exploreLoadMore"
            );

        if (button) {
            button.disabled = true;
            button.textContent = "Loading…";
        }
    },

    renderError(message) {
        const container =
            document.getElementById("explore-data");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="empty-state explore-error">
                <div class="empty-state-icon">⚠️</div>
                <h3>Something went wrong</h3>
                <p>
                    ${steeneExploreEscapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="steene-btn btn-primary"
                    onclick="steeneExploreView.refresh()"
                >
                    Try Again
                </button>
            </div>
        `;
    },

    /**
     * Sends a friend request.
     */
    async sendRequest(profileId) {
        if (!this.requireAuthenticatedUser()) {
            return;
        }

        const supabase =
            window.steeneSupabase;

        const requesterId =
            this._currentUser.id;

        if (requesterId === profileId) {
            return;
        }

        const existing =
            this.getRelationship(profileId);

        if (existing.friendship) {
            return;
        }

        const { error } =
            await supabase
                .from(
                    STEENE_EXPLORE_CONFIG.friendshipsTable
                )
                .insert({
                    requester_id: requesterId,
                    addressee_id: profileId,
                    status: "pending"
                });

        if (error) {
            console.error(
                "STEENE friend request error:",
                error
            );

            this.showNotice(
                "Unable to send friend request."
            );

            return;
        }

        await this.loadFriendships();
        this.render();
    },

    async cancelRequest(friendshipId) {
        if (!this.requireAuthenticatedUser()) {
            return;
        }

        const { error } =
            await window.steeneSupabase
                .from(
                    STEENE_EXPLORE_CONFIG.friendshipsTable
                )
                .update({
                    status: "cancelled",
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", friendshipId);

        if (error) {
            this.showNotice(
                "Unable to cancel friend request."
            );

            return;
        }

        await this.loadFriendships();
        this.render();
    },

    async acceptRequest(friendshipId) {
        if (!this.requireAuthenticatedUser()) {
            return;
        }

        const { error } =
            await window.steeneSupabase
                .from(
                    STEENE_EXPLORE_CONFIG.friendshipsTable
                )
                .update({
                    status: "accepted",
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", friendshipId);

        if (error) {
            this.showNotice(
                "Unable to accept friend request."
            );

            return;
        }

        await this.loadFriendships();
        this.render();
    },

    async declineRequest(friendshipId) {
        if (!this.requireAuthenticatedUser()) {
            return;
        }

        const { error } =
            await window.steeneSupabase
                .from(
                    STEENE_EXPLORE_CONFIG.friendshipsTable
                )
                .update({
                    status: "declined",
                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", friendshipId);

        if (error) {
            this.showNotice(
                "Unable to decline friend request."
            );

            return;
        }

        await this.loadFriendships();
        this.render();
    },

    async removeFriend(profileId) {
        if (!this.requireAuthenticatedUser()) {
            return;
        }

        const relationship =
            this.getRelationship(profileId);

        const friendship =
            relationship.friendship;

        if (!friendship) {
            return;
        }

        const confirmed =
            window.confirm(
                "Remove this player from your friends?"
            );

        if (!confirmed) {
            return;
        }

        const { error } =
            await window.steeneSupabase
                .from(
                    STEENE_EXPLORE_CONFIG.friendshipsTable
                )
                .delete()
                .eq("id", friendship.id);

        if (error) {
            this.showNotice(
                "Unable to remove friend."
            );

            return;
        }

        await this.loadFriendships();
        this.render();
    },

    openProfile(profileId) {
        const profile =
            this._profiles.find(
                item => item.id === profileId
            );

        if (
            window.steenePublicProfileView &&
            typeof window.steenePublicProfileView.open ===
                "function"
        ) {
            window.steenePublicProfileView.open(
                profileId,
                profile
            );

            return;
        }

        if (
            typeof window.goTo === "function"
        ) {
            window.goTo("public-profile");

            window.dispatchEvent(
                new CustomEvent(
                    "steene:open-public-profile",
                    {
                        detail: {
                            profileId,
                            profile
                        }
                    }
                )
            );

            return;
        }

        window.location.hash =
            `#profile/${encodeURIComponent(profileId)}`;
    },

    requireAuthenticatedUser() {
        if (this._currentUser) {
            return true;
        }

        this.requireLogin();
        return false;
    },

    requireLogin() {
        if (
            window.steeneAuth &&
            typeof window.steeneAuth.openModal ===
                "function"
        ) {
            window.steeneAuth.openModal("login");
            return;
        }

        if (
            typeof window.openLoginModal ===
                "function"
        ) {
            window.openLoginModal();
            return;
        }

        this.showNotice(
            "Please sign in to connect with players."
        );
    },

    showNotice(message) {
        if (
            typeof window.showToast ===
                "function"
        ) {
            window.showToast(message);
            return;
        }

        const banner =
            document.getElementById("evBanner");

        if (banner) {
            banner.textContent = message;
            banner.classList.add("show");

            setTimeout(() => {
                banner.classList.remove("show");
            }, 3000);

            return;
        }

        window.alert(message);
    },

    escapeAttribute(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    },

    safeUrl(value) {
        const url =
            String(value || "");

        if (
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("blob:")
        ) {
            return steeneExploreEscapeHtml(url);
        }

        return "";
    },

    destroy() {
        this.unsubscribeFromRealtimeChanges();

        if (this._authSubscription) {
            this._authSubscription.unsubscribe();
            this._authSubscription = null;
        }

        clearTimeout(this._searchTimer);
    }
};


function steeneExploreEscapeHtml(value) {
    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}

window.steeneExploreView =
    steeneExploreView;

window.addEventListener(
    "DOMContentLoaded",
    () => {
        const hasExploreContainer =
            document.getElementById(
                "explore-data"
            );

        if (hasExploreContainer) {
            steeneExploreView.init();
        }
    }
);
