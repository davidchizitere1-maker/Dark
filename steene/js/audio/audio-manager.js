(function () {

    'use strict';

    const scriptEl = document.currentScript;
    const scriptSrc = scriptEl ? scriptEl.src : '';

        function getAudioUrl(filename) {
        return new URL(
            '../../../audio-files/' + filename,
            scriptSrc
        ).href;
    }

const AUDIO_CACHE_NAME = 'steene-audio-v1';

    const TRACK_LIST = [
        getAudioUrl('background-music1.mp3'),
        getAudioUrl('background-music-2.mp3'),
        getAudioUrl('background-music-3.mp3'),
        getAudioUrl('background-music-4.mp3'),
        getAudioUrl('background-music-5.mp3'),
        getAudioUrl('background-music-6.mp3')
    ];


    const STORAGE_KEY =
        'steene_platform_audio_settings';

    const DEFAULT_SETTINGS = {
        muted: false,
        volume: 0.5
    };


    function loadSettings() {

        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!raw) {
                return {
                    ...DEFAULT_SETTINGS
                };
            }

            const parsed =
                JSON.parse(raw);

            return {
                ...DEFAULT_SETTINGS,
                ...parsed
            };

        } catch (err) {

            return {
                ...DEFAULT_SETTINGS
            };
        }
    }


    function saveSettings(settings) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );

        } catch (err) {
            // Storage unavailable — non-fatal.
        }
    }


    let settings =
        loadSettings();

    let hostAudio = null;

    let pausedForGame = false;

    let currentTrackIndex =
        parseInt(
            localStorage.getItem(
                'steene_audio_index'
            ),
            10
        ) || 0;

    let currentBlobUrl = null;

    let loadedTrackIndex = -1;

    /*
     * Prevent duplicate cache/download operations.
     */
    const cachePromises = new Map();


    /*
     * =====================================================
     * CACHE AUDIO FILE
     * =====================================================
     */

    async function ensureTrackCached(trackUrl) {

        if (cachePromises.has(trackUrl)) {
            return cachePromises.get(trackUrl);
        }


        const promise =
            (async () => {

                if (!('caches' in window)) {

                    throw new Error(
                        'Cache Storage is not supported by this browser.'
                    );
                }


                const cache =
                    await caches.open(
                        AUDIO_CACHE_NAME
                    );


                /*
                 * Check local cache first.
                 */

                let response =
                    await cache.match(
                        trackUrl
                    );


                if (response) {
                    return response;
                }


                /*
                 * Not cached yet.
                 * Download the complete MP3.
                 */

                response =
                    await fetch(
                        trackUrl,
                        {
                            cache: 'no-store'
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Unable to load audio file: ${trackUrl} (${response.status})`
                    );
                }


                /*
                 * Store a complete copy locally.
                 */

                await cache.put(
                    trackUrl,
                    response.clone()
                );


                return response;

            })();


        cachePromises.set(
            trackUrl,
            promise
        );


        try {

            return await promise;

        } catch (error) {

            cachePromises.delete(
                trackUrl
            );

            throw error;
        }
    }


    async function createPlayableUrl(trackUrl) {

        const response =
            await ensureTrackCached(
                trackUrl
            );


        const blob =
            await response.blob();


        /*
         * Release previous Blob URL.
         */

        if (currentBlobUrl) {

            URL.revokeObjectURL(
                currentBlobUrl
            );

            currentBlobUrl = null;
        }


        currentBlobUrl =
            URL.createObjectURL(
                blob
            );


        return currentBlobUrl;
    }


    /*
     * =====================================================
     * AUDIO ELEMENT
     * =====================================================
     */

    function getHostAudio() {

        if (!hostAudio) {

            hostAudio =
                new Audio();

            hostAudio.preload =
                'auto';

            hostAudio.volume =
                settings.muted
                    ? 0
                    : settings.volume;


            hostAudio.addEventListener(
                'ended',
                () => {

                    if (pausedForGame) {
                        return;
                    }

                    playNextTrack();
                }
            );
        }


        return hostAudio;
    }


    async function loadTrack(
        trackIndex,
        restoreSavedTime = false
    ) {

        const audio =
            getHostAudio();


        const safeIndex =
            (
                Number(trackIndex) +
                TRACK_LIST.length
            ) % TRACK_LIST.length;


        /*
         * Already loaded?
         */

        if (
            loadedTrackIndex === safeIndex &&
            audio.src
        ) {

            if (restoreSavedTime) {

                const savedTime =
                    parseFloat(
                        localStorage.getItem(
                            'steene_audio_time'
                        )
                    );


                if (
                    Number.isFinite(savedTime) &&
                    savedTime >= 0
                ) {

                    try {

                        audio.currentTime =
                            savedTime;

                    } catch (err) {
                        // Ignore invalid timestamp.
                    }
                }


                localStorage.removeItem(
                    'steene_audio_time'
                );
            }


            return audio;
        }


        /*
         * Get local Blob URL.
         */

        const playableUrl =
            await createPlayableUrl(
                TRACK_LIST[safeIndex]
            );


        /*
         * Game may have been opened while
         * audio was loading.
         */

        if (pausedForGame) {
            return audio;
        }


        audio.pause();

        /*
         * This is now a local blob URL,
         * not the network MP3 URL.
         */

        audio.src =
            playableUrl;

        audio.load();


        loadedTrackIndex =
            safeIndex;

        currentTrackIndex =
            safeIndex;


        localStorage.setItem(
            'steene_audio_index',
            String(
                safeIndex
            )
        );


        /*
         * Restore previous playback position.
         */

        if (restoreSavedTime) {

            await new Promise(resolve => {

                if (audio.readyState >= 1) {
                    resolve();
                    return;
                }


                audio.addEventListener(
                    'loadedmetadata',
                    resolve,
                    {
                        once: true
                    }
                );
            });


            const savedTime =
                parseFloat(
                    localStorage.getItem(
                        'steene_audio_time'
                    )
                );


            if (
                Number.isFinite(savedTime) &&
                savedTime >= 0 &&
                savedTime < audio.duration
            ) {

                try {

                    audio.currentTime =
                        savedTime;

                } catch (err) {
                    // Ignore invalid timestamp.
                }
            }


            localStorage.removeItem(
                'steene_audio_time'
            );
        }


        return audio;
    }


    /*
     * =====================================================
     * NEXT TRACK
     * =====================================================
     */

    async function playNextTrack() {

        if (pausedForGame) {
            return;
        }


        currentTrackIndex =
            (
                currentTrackIndex + 1
            ) % TRACK_LIST.length;


        try {

            const audio =
                await loadTrack(
                    currentTrackIndex
                );


            if (pausedForGame) {
                return;
            }


            await audio.play();

        } catch (error) {

            console.warn(
                'STEENE: Unable to play next background track.',
                error
            );
        }
    }


    /*
     * =====================================================
     * PRE-CACHE AUDIO
     * =====================================================
     *
     * First online visit:
     *     Network -> Cache Storage
     *
     * Future playback:
     *     Cache Storage -> Blob -> Audio
     */

    async function warmAudioCache() {

        for (
            const trackUrl of TRACK_LIST
        ) {

            try {

                await ensureTrackCached(
                    trackUrl
                );

            } catch (error) {

                console.warn(
                    'STEENE: Could not cache audio track.',
                    trackUrl,
                    error
                );


                if (
                    navigator.onLine === false
                ) {
                    break;
                }
            }
        }
    }


    /*
     * =====================================================
     * MUTE BUTTONS
     * =====================================================
     */

    function updateMuteButtons() {

        document
            .querySelectorAll(
                '[data-steene-mute-btn]'
            )
            .forEach(btn => {

                btn.textContent =
                    settings.muted
                        ? '🔇'
                        : '🔊';
            });


        const runnerBtn =
            document.getElementById(
                'btnRunnerMute'
            );


        if (runnerBtn) {

            runnerBtn.textContent =
                settings.muted
                    ? '🔇'
                    : '🔊';
        }
    }


    /*
     * =====================================================
     * PUBLIC AUDIO MANAGER
     * =====================================================
     */

    const steeneAudioManager = {

        async playHostTrack() {

            pausedForGame =
                false;


            try {

                const audio =
                    await loadTrack(
                        currentTrackIndex,
                        true
                    );


                if (pausedForGame) {
                    return;
                }


                await audio.play();

            } catch (error) {

                /*
                 * Browser autoplay may be blocked
                 * until the user interacts with the page.
                 */

                console.warn(
                    'STEENE: Background music could not start yet.',
                    error
                );
            }
        },


        /*
         * Called by host.js when a game launches.
         */

        pauseForGame() {

            if (hostAudio) {
                hostAudio.pause();
            }

            pausedForGame =
                true;
        },


        /*
         * Called when leaving a game.
         */

        resumeHostTrack() {

            if (pausedForGame) {
                this.playHostTrack();
            }
        },


        /*
         * Stop audio completely.
         */

        stop() {

            if (hostAudio) {

                hostAudio.pause();

                hostAudio.currentTime =
                    0;
            }

            pausedForGame =
                false;
        },


        /*
         * Set volume: 0–1.
         */

        setVolume(value) {

            const v =
                Math.max(
                    0,
                    Math.min(
                        1,
                        Number(value)
                    )
                );


            settings.volume =
                v;


            if (v > 0) {
                settings.muted =
                    false;
            }


            if (hostAudio) {

                hostAudio.volume =
                    settings.muted
                        ? 0
                        : v;
            }


            saveSettings(
                settings
            );


            updateMuteButtons();
        },


        getVolume() {
            return settings.volume;
        },


        toggleMute() {

            settings.muted =
                !settings.muted;


            if (hostAudio) {

                hostAudio.volume =
                    settings.muted
                        ? 0
                        : settings.volume;
            }


            saveSettings(
                settings
            );


            updateMuteButtons();


            return settings.muted;
        },


        isMuted() {
            return settings.muted;
        }
    };


    /*
     * =====================================================
     * GLOBAL ACCESS
     * ===================================================== */

    window.steeneAudioManager =
        steeneAudioManager;


    /*
     * =====================================================
     * AUTOPLAY FALLBACK
     * ===================================================== */

    function resumeOnFirstInteraction() {

        if (!pausedForGame) {

            steeneAudioManager
                .playHostTrack();
        }


        document.removeEventListener(
            'click',
            resumeOnFirstInteraction
        );


        document.removeEventListener(
            'keydown',
            resumeOnFirstInteraction
        );
    }


    document.addEventListener(
        'click',
        resumeOnFirstInteraction,
        {
            once: true
        }
    );


    document.addEventListener(
        'keydown',
        resumeOnFirstInteraction,
        {
            once: true
        }
    );


    /*
     * =====================================================
     * PAGE LOAD
     * ===================================================== */

    window.addEventListener(
        'DOMContentLoaded',
        () => {

            updateMuteButtons();


            /*
             * Start background music.
             */

            steeneAudioManager
                .playHostTrack();


            /*
             * Cache the audio file locally.
             */

            warmAudioCache();
        }
    );


    /*
     * =====================================================
     * SAVE PLAYBACK POSITION
     * ===================================================== */

    window.addEventListener(
        'beforeunload',
        () => {

            if (hostAudio) {

                localStorage.setItem(
                    'steene_audio_time',
                    String(
                        hostAudio.currentTime
                    )
                );


                localStorage.setItem(
                    'steene_audio_index',
                    String(
                        currentTrackIndex
                    )
                );
            }


            /*
             * Release Blob URL.
             */

            if (currentBlobUrl) {

                URL.revokeObjectURL(
                    currentBlobUrl
                );

                currentBlobUrl =
                    null;
            }
        }
    );

})();

