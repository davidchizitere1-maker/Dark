(function () {

    'use strict';

    const scriptEl =
        document.currentScript;

    const scriptSrc =
        scriptEl
            ? scriptEl.src
            : window.location.href;


    function getAudioUrl(filename) {

        return new URL(
            '../../../audio-files/' + filename,
            scriptSrc
        ).href;
    }
    const AUDIO_CACHE_NAME =
        'steene-audio-v2';


    const TRACK_LIST = [

        getAudioUrl(
            'background-music1.mp3'
        ),

        getAudioUrl(
            'background-music2.mp3'
        ),

        getAudioUrl(
            'background-music3.mp3'
        ),

        getAudioUrl(
            'background-music4.mp3'
        ),

        getAudioUrl(
            'background-music5.mp3'
        ),

        getAudioUrl(
            'background-music6.mp3'
        )

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


        } catch (error) {

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

        } catch (error) {

          }
    }


    let settings =
        loadSettings();


    let hostAudio =
        null;


    let pausedForGame =
        false;


    let currentTrackIndex =
        parseInt(
            localStorage.getItem(
                'steene_audio_index'
            ),
            10
        );


    if (
        !Number.isInteger(
            currentTrackIndex
        ) ||
        currentTrackIndex < 0 ||
        currentTrackIndex >=
            TRACK_LIST.length
    ) {

        currentTrackIndex = 0;
    }


    let currentBlobUrl =
        null;


    let loadedTrackIndex =
        -1;


    const cachePromises =
        new Map();


    async function ensureTrackCached(
        trackUrl
    ) {

    
        if (
            cachePromises.has(
                trackUrl
            )
        ) {

            return cachePromises.get(
                trackUrl
            );
        }


        const cachePromise =
            (async () => {

                if (
                    !('caches' in window)
                ) {

                    throw new Error(
                        'Cache Storage is not supported by this browser.'
                    );
                }


                const cache =
                    await caches.open(
                        AUDIO_CACHE_NAME
                    );

                let response =
                    await cache.match(
                        trackUrl
                    );


                if (response) {

                    console.log(
                        'STEENE: Loaded audio from cache:',
                        trackUrl
                    );


                    return response;
                }


                if (
                    navigator.onLine === false
                ) {

                    throw new Error(
                        'STEENE: Device is offline and this track has not been cached yet.'
                    );
                }


                console.log(
                    'STEENE: Downloading audio:',
                    trackUrl
                );


                response =
                    await fetch(
                        trackUrl
                    );


                if (!response.ok) {

                    throw new Error(
                        `STEENE: Audio file returned HTTP ${response.status}: ${trackUrl}`
                    );
                }

                await cache.put(
                    trackUrl,
                    response.clone()
                );


                console.log(
                    'STEENE: Audio cached:',
                    trackUrl
                );


                return response;

            })();


        cachePromises.set(
            trackUrl,
            cachePromise
        );


        try {

            return await cachePromise;

        } catch (error) {

            cachePromises.delete(
                trackUrl
            );


            throw error;
        }
    }

    async function createPlayableUrl(
        trackUrl
    ) {

        const response =
            await ensureTrackCached(
                trackUrl
            );


        const blob =
            await response.blob();


        if (
            currentBlobUrl
        ) {

            URL.revokeObjectURL(
                currentBlobUrl
            );

            currentBlobUrl =
                null;
        }


        currentBlobUrl =
            URL.createObjectURL(
                blob
            );


        return currentBlobUrl;
    }


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
                'error',
                () => {

                    const mediaError =
                        hostAudio.error;


                    console.error(
                        'STEENE AUDIO ERROR:',
                        {
                            code:
                                mediaError
                                    ? mediaError.code
                                    : null,

                            message:
                                mediaError
                                    ? mediaError.message
                                    : null,

                            source:
                                hostAudio.src,

                            track:
                                currentTrackIndex + 1
                        }
                    );
                }
            );

            hostAudio.addEventListener(
                'ended',
                () => {

                    if (
                        pausedForGame
                    ) {

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

        if (
            loadedTrackIndex ===
                safeIndex &&
            audio.src
        ) {

            if (
                restoreSavedTime
            ) {

                restorePlaybackPosition(
                    audio
                );
            }


            return audio;
        }

        const playableUrl =
            await createPlayableUrl(
                TRACK_LIST[
                    safeIndex
                ]
            );

        if (
            pausedForGame
        ) {

            return audio;
        }


        audio.pause();


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

        if (
            restoreSavedTime
        ) {

            await waitForMetadata(
                audio
            );


            restorePlaybackPosition(
                audio
            );
        }


        return audio;
    }


    function waitForMetadata(
        audio
    ) {

        return new Promise(
            resolve => {

                if (
                    audio.readyState >= 1
                ) {

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
            }
        );
    }


    function restorePlaybackPosition(
        audio
    ) {

        const savedTime =
            parseFloat(
                localStorage.getItem(
                    'steene_audio_time'
                )
            );


        if (
            Number.isFinite(
                savedTime
            ) &&
            savedTime >= 0
        ) {

            try {

                if (
                    !Number.isFinite(
                        audio.duration
                    ) ||
                    savedTime <
                        audio.duration
                ) {

                    audio.currentTime =
                        savedTime;
                }

            } catch (error) {

                console.warn(
                    'STEENE: Could not restore audio position.',
                    error
                );
            }
        }


        localStorage.removeItem(
            'steene_audio_time'
        );
    }

    async function playNextTrack() {

        if (
            pausedForGame
        ) {

            return;
        }


        currentTrackIndex =
            (
                currentTrackIndex + 1
            ) % TRACK_LIST.length;


        try {

            console.log(
                `STEENE: Playing track ${currentTrackIndex + 1} of ${TRACK_LIST.length}`
            );


            const audio =
                await loadTrack(
                    currentTrackIndex
                );


            if (
                pausedForGame
            ) {

                return;
            }


            await audio.play();


        } catch (error) {

            console.error(
                'STEENE: Failed to play next track.',
                {
                    track:
                        currentTrackIndex + 1,

                    url:
                        TRACK_LIST[
                            currentTrackIndex
                        ],

                    error
                }
            );
        }
    }

    async function warmAudioCache() {

        console.log(
            'STEENE: Preparing background music cache...'
        );


        for (
            let i = 0;
            i < TRACK_LIST.length;
            i++
        ) {

            try {

                await ensureTrackCached(
                    TRACK_LIST[i]
                );


                console.log(
                    `STEENE: Track ${i + 1}/${TRACK_LIST.length} cached.`
                );


            } catch (error) {

                console.error(
                    `STEENE: Could not cache track ${i + 1}.`,
                    {
                        url:
                            TRACK_LIST[i],

                        error
                    }
                );

                continue;
            }
        }


        console.log(
            'STEENE: Audio cache preparation finished.'
        );
    }


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


        /*
         * Game runner mute button.
         */

        const runnerBtn =
            document.getElementById(
                'btnRunnerMute'
            );


        if (
            runnerBtn
        ) {

            runnerBtn.textContent =
                settings.muted
                    ? '🔇'
                    : '🔊';
        }
    }

    const steeneAudioManager = {


        /*
         * Start/resume background music.
         */

        async playHostTrack() {

            pausedForGame =
                false;


            try {

                const audio =
                    await loadTrack(
                        currentTrackIndex,
                        true
                    );


                if (
                    pausedForGame
                ) {

                    return;
                }


                await audio.play();


                console.log(
                    `STEENE: Background music playing - track ${currentTrackIndex + 1}`
                );


            } catch (error) {

                console.warn(
                    'STEENE: Background music could not start yet.',
                    error
                );

            }
        },

        pauseForGame() {

            if (
                hostAudio
            ) {

                hostAudio.pause();
            }


            pausedForGame =
                true;
        },

        resumeHostTrack() {

            if (
                pausedForGame
            ) {

                this.playHostTrack();
            }
        },


        stop() {

            if (
                hostAudio
            ) {

                hostAudio.pause();

                hostAudio.currentTime =
                    0;
            }


            pausedForGame =
                false;
        },

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


            if (
                v > 0
            ) {

                settings.muted =
                    false;
            }


            if (
                hostAudio
            ) {

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


            if (
                hostAudio
            ) {

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


    window.steeneAudioManager =
        steeneAudioManager;

    function resumeOnFirstInteraction() {

        if (
            !pausedForGame
        ) {

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

    window.addEventListener(
        'DOMContentLoaded',
        () => {

            updateMuteButtons();

            steeneAudioManager
                .playHostTrack();

            warmAudioCache();
        }
    );

    window.addEventListener(
        'beforeunload',
        () => {

            if (
                hostAudio
            ) {

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


            if (
                currentBlobUrl
            ) {

                URL.revokeObjectURL(
                    currentBlobUrl
                );


                currentBlobUrl =
                    null;
            }
        }
    );

})();
