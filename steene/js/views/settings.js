/**
 * STEENE — steene/js/views/settings.js
 * Platform-level settings management, audio preferences, speed settings,
 * and persistent storage synchronization.
 */

const steeneSettingsView = {
    cfg: {
        masterVolume: 80,
        musicVolume: 60,
        sfxVolume: 90,
        mute: false,
        gameSpeed: 'normal',
        animations: true,
        reduceMotion: false,
        notifications: true,
        darkMode: true,
        language: 'en'
    },

    init() {
        this.loadSettings();
        this.renderSettingsUI();
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('steene_platform_settings');
            if (saved) {
                this.cfg = Object.assign({}, this.cfg, JSON.parse(saved));
            }
        } catch (e) {
            console.error('Error loading platform settings:', e);
        }
    },

    saveSettings() {
        try {
            localStorage.setItem('steene_platform_settings', JSON.stringify(this.cfg));
        } catch (e) {
            console.error('Error saving platform settings:', e);
        }
    },

    renderSettingsUI() {
        const settingsView = document.getElementById('view-settings');
        if (!settingsView) return;

        settingsView.innerHTML = `
            <div class="view-header">
                <h1 class="view-title">Platform Settings</h1>
                <p class="view-sub">Customize your audio, visual effects, and preferences.</p>
            </div>
            <div class="settings-content">
                <!-- AUDIO SECTION -->
                <div class="settings-section">
                    <div class="settings-section-title">Audio</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-lbl">Mute All Audio</div>
                            <div class="settings-desc">Disable all sounds across the platform</div>
                        </div>
                        <div class="tog ${this.cfg.mute ? 'on' : ''}" onclick="steeneSettingsView.toggleSetting('mute')"></div>
                    </div>
                </div>

                <!-- GAME SPEED SECTION -->
                <div class="settings-section">
                    <div class="settings-section-title">Game Speed</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-lbl">Default Speed</div>
                            <div class="settings-desc">Adjust animation and AI move pace</div>
                        </div>
                        <select class="spd-sel" id="platform-speed-sel" onchange="steeneSettingsView.updateSpeed(this.value)">
                            <option value="slow" ${this.cfg.gameSpeed === 'slow' ? 'selected' : ''}>Slow</option>
                            <option value="normal" ${this.cfg.gameSpeed === 'normal' ? 'selected' : ''}>Normal</option>
                            <option value="fast" ${this.cfg.gameSpeed === 'fast' ? 'selected' : ''}>Fast</option>
                        </select>
                    </div>
                </div>

                <!-- EFFECTS SECTION -->
                <div class="settings-section">
                    <div class="settings-section-title">Visual Effects</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-lbl">Animations</div>
                            <div class="settings-desc">Enable interface transitions and cell flashes</div>
                        </div>
                        <div class="tog ${this.cfg.animations ? 'on' : ''}" onclick="steeneSettingsView.toggleSetting('animations')"></div>
                    </div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-lbl">Reduce Motion</div>
                            <div class="settings-desc">Minimize screen scaling and movement effects</div>
                        </div>
                        <div class="tog ${this.cfg.reduceMotion ? 'on' : ''}" onclick="steeneSettingsView.toggleSetting('reduceMotion')"></div>
                    </div>
                </div>

                <!-- OTHER SETTINGS -->
                <div class="settings-section">
                    <div class="settings-section-title">Preferences</div>
                    <div class="settings-row">
                        <div>
                            <div class="settings-lbl">Platform Notifications</div>
                            <div class="settings-desc">Receive alerts for game invites and updates</div>
                        </div>
                        <div class="tog ${this.cfg.notifications ? 'on' : ''}" onclick="steeneSettingsView.toggleSetting('notifications')"></div>
                    </div>
                    <div class="settings-row" style="margin-top: 16px;">
                        <div>
                            <div class="settings-lbl">Reset Preferences</div>
                            <div class="settings-desc">Restore settings back to default configuration</div>
                        </div>
                        <button class="btn btn-red btn-sm" onclick="steeneSettingsView.resetDefaults()">Reset</button>
                    </div>
                </div>
            </div>
        `;
    },

    toggleSetting(key) {
        this.cfg[key] = !this.cfg[key];
        this.saveSettings();
        this.renderSettingsUI();
    },

    updateSpeed(speedVal) {
        this.cfg.gameSpeed = speedVal;
        this.saveSettings();
    },

    resetDefaults() {
        if (confirm('Are you sure you want to reset all platform settings to default?')) {
            localStorage.removeItem('steene_platform_settings');
            this.cfg = {
                masterVolume: 80,
                musicVolume: 60,
                sfxVolume: 90,
                mute: false,
                gameSpeed: 'normal',
                animations: true,
                reduceMotion: false,
                notifications: true,
                darkMode: true,
                language: 'en'
            };
            this.renderSettingsUI();
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneSettingsView.init();
});