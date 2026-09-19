
(function () {
    'use strict';

    const scriptEl = document.currentScript;
    const scriptSrc = scriptEl ? scriptEl.src : '';
    // Strip "js/audio/audio-manager.js" (and any query string) off the
    // end of the resolved absolute URL, leaving the "steene/" base.
    const steeneBase = scriptSrc.replace(/js\/audio\/audio-manager\.js.*$/, '');
    
    // Define the playlist
    const TRACK_LIST = [
        steeneBase + 'assets/audio-files/background-music1.mp3',
        steeneBase + 'assets/audio-files/background-music2.mp3',
        steeneBase + 'assets/audio-files/background-music3.mp3',
        steeneBase + 'assets/audio-files/background-music4.mp3',
        steeneBase + 'assets/audio-files/background-music5.mp3',
        steeneBase + 'assets/audio-files/background-music6.mp3'
    ];

    const STORAGE_KEY = 'steene_platform_audio_settings';
    const DEFAULT_SETTINGS = { muted: false, volume: 0.5 };

    function loadSettings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { ...DEFAULT_SETTINGS };
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_SETTINGS, ...parsed };
        } catch (err) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (err) { /* storage unavailable — non-fatal */ }
    }

    let settings = loadSettings();
    let hostAudio = null;
    let pausedForGame = false;
    
    // Retrieve saved track index or default to 0 (first song)
    let currentTrackIndex = parseInt(localStorage.getItem('steene_audio_index')) || 0;

    function getHostAudio() {
        if (!hostAudio) {
            hostAudio = new Audio(TRACK_LIST[currentTrackIndex]);
            hostAudio.volume = settings.muted ? 0 : settings.volume;
            
            // Listen for the end of the song to play the next one
            hostAudio.addEventListener('ended', () => {
                // Move to next track, loop back to 0 if at the end
                currentTrackIndex = (currentTrackIndex + 1) % TRACK_LIST.length;
                
                // Update localStorage so navigations use the new track index
                localStorage.setItem('steene_audio_index', currentTrackIndex);
                
                // Change the audio source and play
                hostAudio.src = TRACK_LIST[currentTrackIndex];
                hostAudio.play().catch(() => {});
            });
        }
        return hostAudio;
    }

    function updateMuteButtons() {
        document.querySelectorAll('[data-steene-mute-btn]').forEach(btn => {
            btn.textContent = settings.muted ? '🔇' : '🔊';
        });
        // The Game Runner's mute icon (index.html) uses this specific
        // id rather than the data attribute above.
        const runnerBtn = document.getElementById('btnRunnerMute');
        if (runnerBtn) runnerBtn.textContent = settings.muted ? '🔇' : '🔊';
    }

    const steeneAudioManager = {
         
        playHostTrack() {
            pausedForGame = false;
            const audio = getHostAudio();

            // Retrieve and apply the saved timestamp
            const savedTime = localStorage.getItem('steene_audio_time');
            if (savedTime) {
                audio.currentTime = parseFloat(savedTime);
                localStorage.removeItem('steene_audio_time'); // Clear so it only applies once
            }

            audio.play().catch(() => { /* blocked until user gesture — retried below */ });
        },

        /** Called by host.js when a game is launched into the iframe. */
        pauseForGame() {
            if (hostAudio) hostAudio.pause();
            pausedForGame = true;
        },

        /** Called by host.js when a game exits back to the dashboard. */
        resumeHostTrack() {
            if (pausedForGame) this.playHostTrack();
        },

        stop() {
            if (hostAudio) {
                hostAudio.pause();
                hostAudio.currentTime = 0;
            }
            pausedForGame = false;
        },

        /** value is 0–1. Unmutes automatically if the user raises it above 0. */
        setVolume(value) {
            const v = Math.max(0, Math.min(1, Number(value)));
            settings.volume = v;
            if (v > 0) settings.muted = false;
            if (hostAudio) hostAudio.volume = settings.muted ? 0 : v;
            saveSettings(settings);
            updateMuteButtons();
        },

        getVolume() {
            return settings.volume;
        },

        toggleMute() {
            settings.muted = !settings.muted;
            if (hostAudio) hostAudio.volume = settings.muted ? 0 : settings.volume;
            saveSettings(settings);
            updateMuteButtons();
            return settings.muted;
        },

        isMuted() {
            return settings.muted;
        }
    };

    window.steeneAudioManager = steeneAudioManager;

    // If autoplay was blocked, start on the first click or keypress
    // anywhere on the page — but only if we weren't deliberately
    // paused for a game (pauseForGame() sets that flag).
    function resumeOnFirstInteraction() {
        if (!pausedForGame) {
            steeneAudioManager.playHostTrack();
        }
        document.removeEventListener('click', resumeOnFirstInteraction);
        document.removeEventListener('keydown', resumeOnFirstInteraction);
    }
    document.addEventListener('click', resumeOnFirstInteraction, { once: true });
    document.addEventListener('keydown', resumeOnFirstInteraction, { once: true });

    window.addEventListener('DOMContentLoaded', () => {
        updateMuteButtons();
        // Every platform page (dashboard, profile, settings) plays the
        // ambient host track continuously — only entering an actual
        // game pauses it (see pauseForGame(), called from host.js,
        // which only exists on index.html).
        steeneAudioManager.playHostTrack();
    });

    window.addEventListener('beforeunload', () => {
        if (hostAudio) {
            // Save both the time position and the current track index
            localStorage.setItem('steene_audio_time', hostAudio.currentTime);
            localStorage.setItem('steene_audio_index', currentTrackIndex);
        }
    });
})();