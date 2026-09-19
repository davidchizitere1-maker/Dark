const STEENE_SETTINGS_KEY = 'steene_platform_settings';

const STEENE_DEFAULT_SETTINGS = {
    // Audio
    musicEnabled: true,
    volume: 50,
    soundEffects: true,

    // Display
    reduceMotion: false,
    theme: 'dark',
    compactMode: false,
    showPerformance: false,

    // Gameplay
    confirmMoves: false,
    showCoordinates: true,
    autoPromoteToQueen: false,
    boardOrientation: 'auto',

    // Notifications
    notifications: true,
    matchInvites: true,
    friendRequests: true,
    gameReminders: true,

    // Privacy
    onlineStatus: 'online',
    profileVisibility: 'public',
    allowFriendRequests: true,
    showGameHistory: true,

    // Language
    language: 'en'
};

function steeneLoadSettings() {
    try {
        const raw = localStorage.getItem(STEENE_SETTINGS_KEY);

        if (!raw) {
            return { ...STEENE_DEFAULT_SETTINGS };
        }

        return {
            ...STEENE_DEFAULT_SETTINGS,
            ...JSON.parse(raw)
        };
    } catch (error) {
        return { ...STEENE_DEFAULT_SETTINGS };
    }
}

function steeneSaveSettings(settings) {
    try {
        localStorage.setItem(
            STEENE_SETTINGS_KEY,
            JSON.stringify(settings)
        );
    } catch (error) {
        // Storage may be unavailable. Settings still work for the current session.
    }
}

function steeneEscapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

const steeneSettingsView = {
    _settings: steeneLoadSettings(),

    init() {
        this.applySettings();
        this.render();
    },

    refresh() {
        this.render();
    },

    save() {
        steeneSaveSettings(this._settings);
        this.applySettings();
    },

    render() {
        const container = document.getElementById('settings-data');

        if (!container) return;

        const session =
            window.steeneAuth &&
            window.steeneAuth.currentSession;

        const audio = window.steeneAudioManager;

        const currentVolume = audio
            ? Math.round(audio.getVolume() * 100)
            : this._settings.volume;

        const musicEnabled = audio
            ? !audio.isMuted()
            : this._settings.musicEnabled;

        container.innerHTML = `
            ${
                !session
                    ? `
                        <div class="settings-guest-notice">
                            <strong>Guest mode</strong>
                            <span>
                                Your settings are saved on this device.
                                <a href="#" onclick="steeneAuth.openModal('login'); return false;">
                                    Log in
                                </a>
                                to prepare for account syncing.
                            </span>
                        </div>
                    `
                    : ''
            }

            <div class="settings-layout">

                <div class="settings-main">

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">♫</span>
                                <div>
                                    <div class="settings-section-title">Audio</div>
                                    <div class="settings-section-subtitle">
                                        Control music and game sounds
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'musicEnabled',
                            'Background Music',
                            'Play the STEENE soundtrack across the platform',
                            musicEnabled
                        )}

                        <div class="settings-row">
                            <div>
                                <div class="settings-label">Music Volume</div>
                                <div class="settings-desc">
                                    Adjust the platform soundtrack volume
                                </div>
                            </div>

                            <div class="settings-control settings-volume-control">
                                <input
                                    type="range"
                                    class="settings-slider"
                                    id="settingsVolumeSlider"
                                    min="0"
                                    max="100"
                                    value="${currentVolume}"
                                    oninput="steeneSettingsView.setVolume(this.value)"
                                    aria-label="Music volume"
                                >

                                <span
                                    class="settings-slider-value"
                                    id="settingsVolumeValue"
                                >
                                    ${currentVolume}%
                                </span>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'soundEffects',
                            'Game Sound Effects',
                            'Play move, capture, win, and notification sounds',
                            this._settings.soundEffects
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">◈</span>
                                <div>
                                    <div class="settings-section-title">Display</div>
                                    <div class="settings-section-subtitle">
                                        Customize your visual experience
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'theme',
                            'Interface Theme',
                            'Choose the appearance of STEENE',
                            this._settings.theme,
                            {
                                dark: 'Dark',
                                midnight: 'Midnight Blue',
                                graphite: 'Graphite'
                            }
                        )}

                        ${this.toggleRow(
                            'reduceMotion',
                            'Reduce Motion',
                            'Minimize animations and visual transitions',
                            this._settings.reduceMotion
                        )}

                        ${this.toggleRow(
                            'compactMode',
                            'Compact Layout',
                            'Use tighter spacing for smaller screens',
                            this._settings.compactMode
                        )}

                        ${this.toggleRow(
                            'showPerformance',
                            'Performance Monitor',
                            'Show FPS and performance information in supported games',
                            this._settings.showPerformance
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">♟</span>
                                <div>
                                    <div class="settings-section-title">Gameplay</div>
                                    <div class="settings-section-subtitle">
                                        Configure your in-game experience
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'confirmMoves',
                            'Confirm Moves',
                            'Ask for confirmation before submitting a move',
                            this._settings.confirmMoves
                        )}

                        ${this.toggleRow(
                            'showCoordinates',
                            'Board Coordinates',
                            'Show coordinates on supported board games',
                            this._settings.showCoordinates
                        )}

                        ${this.toggleRow(
                            'autoPromoteToQueen',
                            'Auto-Promote to Queen',
                            'Automatically select a queen during pawn promotion',
                            this._settings.autoPromoteToQueen
                        )}

                        ${this.selectRow(
                            'boardOrientation',
                            'Board Orientation',
                            'Choose how game boards are positioned',
                            this._settings.boardOrientation,
                            {
                                auto: 'Automatic',
                                white: 'White at Bottom',
                                black: 'Black at Bottom'
                            }
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">♢</span>
                                <div>
                                    <div class="settings-section-title">Notifications</div>
                                    <div class="settings-section-subtitle">
                                        Choose which alerts you receive
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'notifications',
                            'Platform Notifications',
                            'Enable notifications from STEENE',
                            this._settings.notifications
                        )}

                        ${this.toggleRow(
                            'matchInvites',
                            'Match Invites',
                            'Receive invitations to online games',
                            this._settings.matchInvites
                        )}

                        ${this.toggleRow(
                            'friendRequests',
                            'Friend Requests',
                            'Receive notifications for new friend requests',
                            this._settings.friendRequests
                        )}

                        ${this.toggleRow(
                            'gameReminders',
                            'Game Reminders',
                            'Receive reminders about unfinished games',
                            this._settings.gameReminders
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">◎</span>
                                <div>
                                    <div class="settings-section-title">Privacy</div>
                                    <div class="settings-section-subtitle">
                                        Control your social gaming presence
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'onlineStatus',
                            'Online Status',
                            'Choose how your status appears to other players',
                            this._settings.onlineStatus,
                            {
                                online: 'Show as Online',
                                away: 'Show as Away',
                                invisible: 'Appear Offline'
                            }
                        )}

                        ${this.selectRow(
                            'profileVisibility',
                            'Profile Visibility',
                            'Choose who can view your profile',
                            this._settings.profileVisibility,
                            {
                                public: 'Everyone',
                                friends: 'Friends Only',
                                private: 'Only Me'
                            }
                        )}

                        ${this.toggleRow(
                            'allowFriendRequests',
                            'Allow Friend Requests',
                            'Let other players send you friend requests',
                            this._settings.allowFriendRequests
                        )}

                        ${this.toggleRow(
                            'showGameHistory',
                            'Show Game History',
                            'Display your completed games on your profile',
                            this._settings.showGameHistory
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">文</span>
                                <div>
                                    <div class="settings-section-title">Language</div>
                                    <div class="settings-section-subtitle">
                                        Select your preferred platform language
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'language',
                            'Platform Language',
                            'Language support may vary by game',
                            this._settings.language,
                            {
                                en: 'English',
                                es: 'Español',
                                fr: 'Français',
                                de: 'Deutsch'
                            }
                        )}
                    </section>

                </div>

                <aside class="settings-sidebar">
                    <div class="settings-status-card">
                        <div class="settings-status-dot"></div>
                        <div>
                            <strong>Settings saved locally</strong>
                            <p>
                                Changes are applied automatically on this device.
                            </p>
                        </div>
                    </div>

                    <div class="settings-danger-card">
                        <div class="settings-section-title">
                            Account & Data
                        </div>

                        <p>
                            Reset your local preferences or sign out of STEENE.
                        </p>

                        <button
                            class="settings-danger-button"
                            type="button"
                            onclick="steeneSettingsView.resetSettings()"
                        >
                            Reset Settings
                        </button>

                        ${
                            session
                                ? `
                                    <button
                                        class="settings-secondary-button"
                                        type="button"
                                        onclick="steeneAuth.signOut()"
                                    >
                                        Sign Out
                                    </button>
                                `
                                : ''
                        }
                    </div>
                </aside>

            </div>
        `;

        this.applySettings();
    },

    toggleRow(key, label, description, enabled) {
        return `
            <div class="settings-row">
                <div>
                    <div class="settings-label">${steeneEscapeHtml(label)}</div>
                    <div class="settings-desc">${steeneEscapeHtml(description)}</div>
                </div>

                <div class="settings-control">
                    <button
                        type="button"
                        class="settings-toggle ${enabled ? 'on' : ''}"
                        aria-pressed="${enabled}"
                        aria-label="${steeneEscapeHtml(label)}"
                        onclick="steeneSettingsView.toggle('${key}')"
                    >
                        <span></span>
                    </button>
                </div>
            </div>
        `;
    },

    selectRow(key, label, description, selectedValue, options) {
        const optionMarkup = Object.entries(options)
            .map(([value, text]) => `
                <option
                    value="${steeneEscapeHtml(value)}"
                    ${selectedValue === value ? 'selected' : ''}
                >
                    ${steeneEscapeHtml(text)}
                </option>
            `)
            .join('');

        return `
            <div class="settings-row">
                <div>
                    <div class="settings-label">${steeneEscapeHtml(label)}</div>
                    <div class="settings-desc">${steeneEscapeHtml(description)}</div>
                </div>

                <div class="settings-control">
                    <select
                        class="settings-select"
                        aria-label="${steeneEscapeHtml(label)}"
                        onchange="steeneSettingsView.set('${key}', this.value)"
                    >
                        ${optionMarkup}
                    </select>
                </div>
            </div>
        `;
    },

    toggle(key) {
        if (!(key in this._settings)) return;

        this._settings[key] = !this._settings[key];

        if (
            ['notifications', 'musicEnabled'].includes(key) &&
            this._settings[key] === false
        ) {
            if (key === 'notifications') {
                this._settings.matchInvites = false;
                this._settings.friendRequests = false;
                this._settings.gameReminders = false;
            }
        }

        this.save();

        if (key === 'musicEnabled' && window.steeneAudioManager) {
            if (this._settings.musicEnabled) {
                window.steeneAudioManager.unmute();
            } else {
                window.steeneAudioManager.mute();
            }
        }

        this.render();
    },

    set(key, value) {
        if (!(key in this._settings)) return;

        this._settings[key] = value;
        this.save();

        this.render();
    },

    setVolume(value) {
        const numericValue = Math.max(
            0,
            Math.min(100, Number(value))
        );

        this._settings.volume = numericValue;
        this._settings.musicEnabled = numericValue > 0;

        if (window.steeneAudioManager) {
            window.steeneAudioManager.setVolume(numericValue / 100);

            if (numericValue > 0) {
                window.steeneAudioManager.unmute();
            } else {
                window.steeneAudioManager.mute();
            }
        }

        steeneSaveSettings(this._settings);

        const valueLabel = document.getElementById('settingsVolumeValue');

        if (valueLabel) {
            valueLabel.textContent = `${numericValue}%`;
        }

        const musicToggle = document.querySelector(
            '[aria-label="Background Music"]'
        );

        if (musicToggle) {
            musicToggle.classList.toggle(
                'on',
                numericValue > 0
            );

            musicToggle.setAttribute(
                'aria-pressed',
                numericValue > 0
            );
        }
    },

    resetSettings() {
        const confirmed = window.confirm(
            'Reset all STEENE settings to their defaults?'
        );

        if (!confirmed) return;

        this._settings = {
            ...STEENE_DEFAULT_SETTINGS
        };

        this.save();

        if (window.steeneAudioManager) {
            window.steeneAudioManager.setVolume(
                STEENE_DEFAULT_SETTINGS.volume / 100
            );
            window.steeneAudioManager.unmute();
        }

        this.render();
    },

    applySettings() {
        const body = document.body;

        body.classList.toggle(
            'steene-reduce-motion',
            this._settings.reduceMotion
        );

        body.classList.toggle(
            'steene-compact-mode',
            this._settings.compactMode
        );

        body.dataset.steeneTheme = this._settings.theme;

        if (this._settings.showPerformance) {
            body.classList.add('steene-performance-enabled');
        } else {
            body.classList.remove('steene-performance-enabled');
        }
    }
};

window.steeneSettingsView = steeneSettingsView;

window.addEventListener('DOMContentLoaded', () => {
    steeneSettingsView.init();
});
