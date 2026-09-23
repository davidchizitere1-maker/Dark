/* ==========================================================
   STEENE — settings.js (Fully Internationalized)
   ========================================================== */

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

// Settings-specific translations
const settingsTranslations = {
    en: {
        guestNoticeBold: "Guest mode",
        guestNoticeText: "Your settings are saved on this device.",
        logIn: "Log in",
        guestNoticeSuffix: "to prepare for account syncing.",
        audioTitle: "Audio",
        audioSub: "Control music and game sounds",
        musicLabel: "Background Music",
        musicDesc: "Play the STEENE soundtrack across the platform",
        volLabel: "Music Volume",
        volDesc: "Adjust the platform soundtrack volume",
        sfxLabel: "Game Sound Effects",
        sfxDesc: "Play move, capture, win, and notification sounds",
        displayTitle: "Display",
        displaySub: "Customize your visual experience",
        themeLabel: "Interface Theme",
        themeDesc: "Choose the appearance of STEENE",
        themeDark: "Dark",
        themeMidnight: "Midnight Blue",
        themeGraphite: "Graphite",
        motionLabel: "Reduce Motion",
        motionDesc: "Minimize animations and visual transitions",
        compactLabel: "Compact Layout",
        compactDesc: "Use tighter spacing for smaller screens",
        perfLabel: "Performance Monitor",
        perfDesc: "Show FPS and performance information in supported games",
        gameplayTitle: "Gameplay",
        gameplaySub: "Configure your in-game experience",
        confirmLabel: "Confirm Moves",
        confirmDesc: "Ask for confirmation before submitting a move",
        coordsLabel: "Board Coordinates",
        coordsDesc: "Show coordinates on supported board games",
        queenLabel: "Auto-Promote to Queen",
        queenDesc: "Automatically select a queen during pawn promotion",
        orientLabel: "Board Orientation",
        orientDesc: "Choose how game boards are positioned",
        orientAuto: "Automatic",
        orientWhite: "White at Bottom",
        orientBlack: "Black at Bottom",
        notifTitle: "Notifications",
        notifSub: "Choose which alerts you receive",
        platNotifLabel: "Platform Notifications",
        platNotifDesc: "Enable notifications from STEENE",
        matchLabel: "Match Invites",
        matchDesc: "Receive invitations to online games",
        friendReqLabel: "Friend Requests",
        friendReqDesc: "Receive notifications for new friend requests",
        remindLabel: "Game Reminders",
        remindDesc: "Receive reminders about unfinished games",
        privacyTitle: "Privacy",
        privacySub: "Control your social gaming presence",
        statusLabel: "Online Status",
        statusDesc: "Choose how your status appears to other players",
        statusOnline: "Show as Online",
        statusAway: "Show as Away",
        statusInvisible: "Appear Offline",
        visLabel: "Profile Visibility",
        visDesc: "Choose who can view your profile",
        visPublic: "Everyone",
        visFriends: "Friends Only",
        visPrivate: "Only Me",
        allowFriendLabel: "Allow Friend Requests",
        allowFriendDesc: "Let other players send you friend requests",
        historyLabel: "Show Game History",
        historyDesc: "Display your completed games on your profile",
        langTitle: "Language",
        langSub: "Select your preferred platform language",
        langLabel: "Platform Language",
        langDesc: "Language support may vary by game",
        langEn: "English",
        langEs: "Español",
        langFr: "Français",
        langDe: "Deutsch",
        savedLocally: "Settings saved locally",
        savedLocallyDesc: "Changes are applied automatically on this device.",
        accountData: "Account & Data",
        accountDataDesc: "Reset your local preferences or sign out of STEENE.",
        resetSettings: "Reset Settings",
        signOut: "Sign Out",
        confirmReset: "Reset all STEENE settings to their defaults?"
    },
    es: {
        guestNoticeBold: "Modo invitado",
        guestNoticeText: "Tus ajustes se guardan en este dispositivo.",
        logIn: "Iniciar sesión",
        guestNoticeSuffix: "para prepararte para la sincronización de cuenta.",
        audioTitle: "Audio",
        audioSub: "Controla la música y los sonidos del juego",
        musicLabel: "Música de Fondo",
        musicDesc: "Reproduce la banda sonora de STEENE en toda la plataforma",
        volLabel: "Volumen de la Música",
        volDesc: "Ajusta el volumen de la banda sonora de la plataforma",
        sfxLabel: "Efectos de Sonido",
        sfxDesc: "Reproduce sonidos de movimiento, captura, victoria y notificaciones",
        displayTitle: "Pantalla",
        displaySub: "Personaliza tu experiencia visual",
        themeLabel: "Tema de la Interfaz",
        themeDesc: "Elige la apariencia de STEENE",
        themeDark: "Oscuro",
        themeMidnight: "Azul Medianoche",
        themeGraphite: "Grafito",
        motionLabel: "Reducir Movimiento",
        motionDesc: "Minimiza animaciones y transiciones visuales",
        compactLabel: "Diseño Compacto",
        compactDesc: "Usa un espaciado más ajustado para pantallas pequeñas",
        perfLabel: "Monitor de Rendimiento",
        perfDesc: "Muestra FPS e información de rendimiento en juegos compatibles",
        gameplayTitle: "Jugabilidad",
        gameplaySub: "Configura tu experiencia de juego",
        confirmLabel: "Confirmar Movimientos",
        confirmDesc: "Pide confirmación antes de enviar un movimiento",
        coordsLabel: "Coordenadas del Tablero",
        coordsDesc: "Muestra coordenadas en juegos de mesa compatibles",
        queenLabel: "Auto-Promocionar a Reina",
        queenDesc: "Selecciona automáticamente una reina durante la promoción de peón",
        orientLabel: "Orientación del Tablero",
        orientDesc: "Elige cómo se posicionan los tableros de juego",
        orientAuto: "Automático",
        orientWhite: "Blancas Abajo",
        orientBlack: "Negras Abajo",
        notifTitle: "Notificaciones",
        notifSub: "Elige qué alertas recibes",
        platNotifLabel: "Notificaciones de la Plataforma",
        platNotifDesc: "Habilita notificaciones de STEENE",
        matchLabel: "Invitaciones de Partida",
        matchDesc: "Recibe invitaciones a juegos en línea",
        friendReqLabel: "Solicitudes de Amistad",
        friendReqDesc: "Recibe notificaciones de nuevas solicitudes de amistad",
        remindLabel: "Recordatorios de Juegos",
        remindDesc: "Recibe recordatorios sobre partidas inconclusas",
        privacyTitle: "Privacidad",
        privacySub: "Controla tu presencia de juego social",
        statusLabel: "Estado en Línea",
        statusDesc: "Elige cómo aparece tu estado ante otros jugadores",
        statusOnline: "Mostrar como En Línea",
        statusAway: "Mostrar como Ausente",
        statusInvisible: "Aparecer Desconectado",
        visLabel: "Visibilidad del Perfil",
        visDesc: "Elige quién puede ver tu perfil",
        visPublic: "Todos",
        visFriends: "Solo Amigos",
        visPrivate: "Solo Yo",
        allowFriendLabel: "Permitir Solicitudes de Amistad",
        allowFriendDesc: "Permite que otros jugadores te envíen solicitudes de amistad",
        historyLabel: "Mostrar Historial de Juegos",
        historyDesc: "Muestra tus juegos completados en tu perfil",
        langTitle: "Idioma",
        langSub: "Selecciona tu idioma preferido para la plataforma",
        langLabel: "Idioma de la Plataforma",
        langDesc: "El soporte de idiomas puede variar según el juego",
        langEn: "English",
        langEs: "Español",
        langFr: "Français",
        langDe: "Deutsch",
        savedLocally: "Ajustes guardados localmente",
        savedLocallyDesc: "Los cambios se aplican automáticamente en este dispositivo.",
        accountData: "Cuenta y Datos",
        accountDataDesc: "Restablece tus preferencias locales o cierra sesión en STEENE.",
        resetSettings: "Restablecer Ajustes",
        signOut: "Cerrar Sesión",
        confirmReset: "¿Restablecer todos los ajustes de STEENE a sus valores predeterminados?"
    },
    fr: {
        guestNoticeBold: "Mode invité",
        guestNoticeText: "Vos paramètres sont enregistrés sur cet appareil.",
        logIn: "Connexion",
        guestNoticeSuffix: "pour vous préparer à la synchronisation du compte.",
        audioTitle: "Audio",
        audioSub: "Contrôlez la musique et les sons du jeu",
        musicLabel: "Musique de Fond",
        musicDesc: "Jouez la bande originale de STEENE sur toute la plateforme",
        volLabel: "Volume de la Musique",
        volDesc: "Ajustez le volume de la bande originale de la plateforme",
        sfxLabel: "Effets Sonores",
        sfxDesc: "Jouez les sons de mouvement, de capture, de victoire et de notification",
        displayTitle: "Affichage",
        displaySub: "Personnalisez votre expérience visuelle",
        themeLabel: "Thème de l'Interface",
        themeDesc: "Choisissez l'apparence de STEENE",
        themeDark: "Sombre",
        themeMidnight: "Bleu Minuit",
        themeGraphite: "Graphite",
        motionLabel: "Réduire les Mouvements",
        motionDesc: "Minimisez les animations et les transitions visuelles",
        compactLabel: "Mise en Page Compacte",
        compactDesc: "Utilisez un espacement plus serré pour les petits écrans",
        perfLabel: "Moniteur de Performance",
        perfDesc: "Affichez les FPS et les informations de performance dans les jeux pris en charge",
        gameplayTitle: "Gameplay",
        gameplaySub: "Configurez votre expérience de jeu",
        confirmLabel: "Confirmer les Mouvements",
        confirmDesc: "Demandez une confirmation avant de soumettre un mouvement",
        coordsLabel: "Coordonnées du Plateau",
        coordsDesc: "Affichez les coordonnées sur les jeux de société pris en charge",
        queenLabel: "Auto-Promotion en Dame",
        queenDesc: "Sélectionnez automatiquement une dame lors de la promotion du pion",
        orientLabel: "Orientation du Plateau",
        orientDesc: "Choisissez la façon dont les plateaux de jeu sont positionnés",
        orientAuto: "Automatique",
        orientWhite: "Blancs en bas",
        orientBlack: "Noirs en bas",
        notifTitle: "Notifications",
        notifSub: "Choisissez les alertes que vous recevez",
        platNotifLabel: "Notifications de la Plateforme",
        platNotifDesc: "Activez les notifications de STEENE",
        matchLabel: "Invitations de Match",
        matchDesc: "Recevez des invitations à des jeux en ligne",
        friendReqLabel: "Demandes d'Amis",
        friendReqDesc: "Recevez des notifications pour les nouvelles demandes d'amis",
        remindLabel: "Rappels de Jeux",
        remindDesc: "Recevez des rappels concernant les parties non terminées",
        privacyTitle: "Confidentialité",
        privacySub: "Contrôlez votre présence sociale en jeu",
        statusLabel: "Statut en Ligne",
        statusDesc: "Choisissez comment votre statut apparaît aux autres joueurs",
        statusOnline: "Afficher en Ligne",
        statusAway: "Afficher Absent",
        statusInvisible: "Apparaître Hors Ligne",
        visLabel: "Visibilité du Profil",
        visDesc: "Choisissez qui peut voir votre profil",
        visPublic: "Tout le monde",
        visFriends: "Amis seulement",
        visPrivate: "Moi seulement",
        allowFriendLabel: "Autoriser les Demandes d'Amis",
        allowFriendDesc: "Laissez les autres joueurs vous envoyer des demandes d'amis",
        historyLabel: "Afficher l'Historique des Jeux",
        historyDesc: "Affichez vos parties terminées sur votre profil",
        langTitle: "Langue",
        langSub: "Sélectionnez votre langue de plateforme préférée",
        langLabel: "Langue de la Plateforme",
        langDesc: "La prise en charge des langues peut varier selon le jeu",
        langEn: "English",
        langEs: "Español",
        langFr: "Français",
        langDe: "Deutsch",
        savedLocally: "Paramètres enregistrés localement",
        savedLocallyDesc: "Les modifications sont appliquées automatiquement sur cet appareil.",
        accountData: "Compte et Données",
        accountDataDesc: "Réinitialisez vos préférences locales ou déconnectez-vous de STEENE.",
        resetSettings: "Réinitialiser les Paramètres",
        signOut: "Se Déconnecter",
        confirmReset: "Réinitialiser tous les paramètres STEENE à leurs valeurs par défaut ?"
    },
    de: {
        guestNoticeBold: "Gastmodus",
        guestNoticeText: "Deine Einstellungen werden auf diesem Gerät gespeichert.",
        logIn: "Anmelden",
        guestNoticeSuffix: "um dich auf die Kontosynchronisierung vorzubereiten.",
        audioTitle: "Audio",
        audioSub: "Steuere Musik und Spielgeräusche",
        musicLabel: "Hintergrundmusik",
        musicDesc: "Spiele den STEENE-Soundtrack auf der gesamten Plattform",
        volLabel: "Musiklautstärke",
        volDesc: "Passe die Lautstärke des Plattform-Soundtracks an",
        sfxLabel: "Spielsoundeffekte",
        sfxDesc: "Spiele Zug-, Fang-, Gewinn- und Benachrichtigungssounds ab",
        displayTitle: "Anzeige",
        displaySub: "Passe dein visuelles Erlebnis an",
        themeLabel: "Oberflächen-Theme",
        themeDesc: "Wähle das Aussehen von STEENE",
        themeDark: "Dunkel",
        themeMidnight: "Mitternachtsblau",
        themeGraphite: "Graphit",
        motionLabel: "Bewegung Reduzieren",
        motionDesc: "Minimiere Animationen und visuelle Übergänge",
        compactLabel: "Kompaktes Layout",
        compactDesc: "Verwende enauere Abstände für kleinere Bildschirme",
        perfLabel: "Leistungsmonitor",
        perfDesc: "Zeige FPS und Leistungsinformationen in unterstützten Spielen an",
        gameplayTitle: "Gameplay",
        gameplaySub: "Konfiguriere dein Spielerlebnis",
        confirmLabel: "Züge Bestätigen",
        confirmDesc: "Frage vor dem Absenden eines Zuges um Bestätigung",
        coordsLabel: "Brettkoordinaten",
        coordsDesc: "Zeige Koordinaten auf unterstützten Brettspielen an",
        queenLabel: "Automatisch zur Dame umwandeln",
        queenDesc: "Wähle während der Bauernumwandlung automatisch eine Dame aus",
        orientLabel: "Brettausrichtung",
        orientDesc: "Wähle, wie Spielbretter positioniert werden",
        orientAuto: "Automatisch",
        orientWhite: "Weiß unten",
        orientBlack: "Schwarz unten",
        notifTitle: "Benachrichtigungen",
        notifSub: "Wähle, welche Benachrichtigungen du erhältst",
        platNotifLabel: "Plattform-Benachrichtigungen",
        platNotifDesc: "Aktiviere Benachrichtigungen von STEENE",
        matchLabel: "Match-Einladungen",
        matchDesc: "Erhalte Einladungen zu Online-Spielen",
        friendReqLabel: "Freundschaftsanfragen",
        friendReqDesc: "Erhalte Benachrichtigungen für neue Freundschaftsanfragen",
        remindLabel: "Spielerinnerungen",
        remindDesc: "Erhalte Erinnerungen an unvollendete Spiele",
        privacyTitle: "Datenschutz",
        privacySub: "Steuere deine soziale Gaming-Präsenz",
        statusLabel: "Online-Status",
        statusDesc: "Wähle, wie dein Status anderen Spielern angezeigt wird",
        statusOnline: "Als Online anzeigen",
        statusAway: "Als Abwesend anzeigen",
        statusInvisible: "Als Offline erscheinen",
        visLabel: "Profilsichtbarkeit",
        visDesc: "Wähle, wer dein Profil sehen kann",
        visPublic: "Jeder",
        visFriends: "Nur Freunde",
        visPrivate: "Nur ich",
        allowFriendLabel: "Freundschaftsanfragen Erlauben",
        allowFriendDesc: "Lass andere Spieler dir Freundschaftsanfragen senden",
        historyLabel: "Spielverlauf Anzeigen",
        historyDesc: "Zeige deine abgeschlossenen Spiele in deinem Profil an",
        langTitle: "Sprache",
        langSub: "Wähle deine bevorzugte Plattformsprache",
        langLabel: "Plattformsprache",
        langDesc: "Die Sprachunterstützung kann je nach Spiel variieren",
        langEn: "English",
        langEs: "Español",
        langFr: "Français",
        langDe: "Deutsch",
        savedLocally: "Einstellungen lokal gespeichert",
        savedLocallyDesc: "Änderungen werden auf diesem Gerät automatisch angewendet.",
        accountData: "Konto & Daten",
        accountDataDesc: "Setze deine lokalen Einstellungen zurück oder melde dich von STEENE ab.",
        resetSettings: "Einstellungen Zurücksetzen",
        signOut: "Abmelden",
        confirmReset: "Alle STEENE-Einstellungen auf die Standardwerte zurücksetzen?"
    }
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
        // Storage may be unavailable.
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
    _session: null,
    _authSubscription: null,

    t(key) {
        const lang = this._settings.language || 'en';
        const dict = settingsTranslations[lang] || settingsTranslations.en;
        return dict[key] || settingsTranslations.en[key] || key;
    },

    init() {
        this.applySettings();
        this.subscribeToAuthChanges();
    },

    subscribeToAuthChanges() {
        const supabase = window.steeneSupabase;

        if (supabase && supabase.auth) {
            const result = supabase.auth.onAuthStateChange((_event, session) => {
                this._session = session;
                this.render();
            });
            this._authSubscription = result?.data?.subscription || null;
        } else {
            this._session = window.steeneAuth?.currentSession || null;
            this.render();
        }
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

        const session = this._session;
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
                            <strong>${steeneEscapeHtml(this.t('guestNoticeBold'))}</strong>
                            <span>
                                ${steeneEscapeHtml(this.t('guestNoticeText'))}
                                <a href="#" onclick="steeneAuth.openModal('login'); return false;">
                                    ${steeneEscapeHtml(this.t('logIn'))}
                                </a>
                                ${steeneEscapeHtml(this.t('guestNoticeSuffix'))}
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
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('audioTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('audioSub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'musicEnabled',
                            this.t('musicLabel'),
                            this.t('musicDesc'),
                            musicEnabled
                        )}

                        <div class="settings-row">
                            <div>
                                <div class="settings-label">${steeneEscapeHtml(this.t('volLabel'))}</div>
                                <div class="settings-desc">
                                    ${steeneEscapeHtml(this.t('volDesc'))}
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
                            this.t('sfxLabel'),
                            this.t('sfxDesc'),
                            this._settings.soundEffects
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">◈</span>
                                <div>
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('displayTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('displaySub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'theme',
                            this.t('themeLabel'),
                            this.t('themeDesc'),
                            this._settings.theme,
                            {
                                dark: this.t('themeDark'),
                                midnight: this.t('themeMidnight'),
                                graphite: this.t('themeGraphite')
                            }
                        )}

                        ${this.toggleRow(
                            'reduceMotion',
                            this.t('motionLabel'),
                            this.t('motionDesc'),
                            this._settings.reduceMotion
                        )}

                        ${this.toggleRow(
                            'compactMode',
                            this.t('compactLabel'),
                            this.t('compactDesc'),
                            this._settings.compactMode
                        )}

                        ${this.toggleRow(
                            'showPerformance',
                            this.t('perfLabel'),
                            this.t('perfDesc'),
                            this._settings.showPerformance
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">♟</span>
                                <div>
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('gameplayTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('gameplaySub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'confirmMoves',
                            this.t('confirmLabel'),
                            this.t('confirmDesc'),
                            this._settings.confirmMoves
                        )}

                        ${this.toggleRow(
                            'showCoordinates',
                            this.t('coordsLabel'),
                            this.t('coordsDesc'),
                            this._settings.showCoordinates
                        )}

                        ${this.toggleRow(
                            'autoPromoteToQueen',
                            this.t('queenLabel'),
                            this.t('queenDesc'),
                            this._settings.autoPromoteToQueen
                        )}

                        ${this.selectRow(
                            'boardOrientation',
                            this.t('orientLabel'),
                            this.t('orientDesc'),
                            this._settings.boardOrientation,
                            {
                                auto: this.t('orientAuto'),
                                white: this.t('orientWhite'),
                                black: this.t('orientBlack')
                            }
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">♢</span>
                                <div>
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('notifTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('notifSub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.toggleRow(
                            'notifications',
                            this.t('platNotifLabel'),
                            this.t('platNotifDesc'),
                            this._settings.notifications
                        )}

                        ${this.toggleRow(
                            'matchInvites',
                            this.t('matchLabel'),
                            this.t('matchDesc'),
                            this._settings.matchInvites
                        )}

                        ${this.toggleRow(
                            'friendRequests',
                            this.t('friendReqLabel'),
                            this.t('friendReqDesc'),
                            this._settings.friendRequests
                        )}

                        ${this.toggleRow(
                            'gameReminders',
                            this.t('remindLabel'),
                            this.t('remindDesc'),
                            this._settings.gameReminders
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">◎</span>
                                <div>
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('privacyTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('privacySub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'onlineStatus',
                            this.t('statusLabel'),
                            this.t('statusDesc'),
                            this._settings.onlineStatus,
                            {
                                online: this.t('statusOnline'),
                                away: this.t('statusAway'),
                                invisible: this.t('statusInvisible')
                            }
                        )}

                        ${this.selectRow(
                            'profileVisibility',
                            this.t('visLabel'),
                            this.t('visDesc'),
                            this._settings.profileVisibility,
                            {
                                public: this.t('visPublic'),
                                friends: this.t('visFriends'),
                                private: this.t('visPrivate')
                            }
                        )}

                        ${this.toggleRow(
                            'allowFriendRequests',
                            this.t('allowFriendLabel'),
                            this.t('allowFriendDesc'),
                            this._settings.allowFriendRequests
                        )}

                        ${this.toggleRow(
                            'showGameHistory',
                            this.t('historyLabel'),
                            this.t('historyDesc'),
                            this._settings.showGameHistory
                        )}
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-heading">
                            <div>
                                <span class="settings-icon">文</span>
                                <div>
                                    <div class="settings-section-title">${steeneEscapeHtml(this.t('langTitle'))}</div>
                                    <div class="settings-section-subtitle">
                                        ${steeneEscapeHtml(this.t('langSub'))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        ${this.selectRow(
                            'language',
                            this.t('langLabel'),
                            this.t('langDesc'),
                            this._settings.language,
                            {
                                en: this.t('langEn'),
                                es: this.t('langEs'),
                                fr: this.t('langFr'),
                                de: this.t('langDe')
                            }
                        )}
                    </section>

                </div>

                <aside class="settings-sidebar">
                    <div class="settings-status-card">
                        <div class="settings-status-dot"></div>
                        <div>
                            <strong>${steeneEscapeHtml(this.t('savedLocally'))}</strong>
                            <p>
                                ${steeneEscapeHtml(this.t('savedLocallyDesc'))}
                            </p>
                        </div>
                    </div>

                    <div class="settings-danger-card">
                        <div class="settings-section-title">
                            ${steeneEscapeHtml(this.t('accountData'))}
                        </div>

                        <p>
                            ${steeneEscapeHtml(this.t('accountDataDesc'))}
                        </p>

                        <button
                            class="settings-danger-button"
                            type="button"
                            onclick="steeneSettingsView.resetSettings()"
                        >
                            ${steeneEscapeHtml(this.t('resetSettings'))}
                        </button>

                        ${
                            session
                                ? `
                                    <button
                                        class="settings-secondary-button"
                                        type="button"
                                        onclick="steeneAuth.signOut()"
                                    >
                                        ${steeneEscapeHtml(this.t('signOut'))}
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

        if (key === 'language') {
            this.render(); // Re-render settings page to instantly translate labels
        }
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
    },

    resetSettings() {
        const confirmed = window.confirm(this.t('confirmReset'));

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

        document.documentElement.lang = this._settings.language;

        if (
            window.steenePlatform &&
            typeof window.steenePlatform.syncSettingsToIframe === 'function'
        ) {
            window.steenePlatform.syncSettingsToIframe();
        }

        window.dispatchEvent(new CustomEvent('steene:settings-updated', {
            detail: this._settings
        }));
    }
};

window.steeneSettingsView = steeneSettingsView;

window.addEventListener('DOMContentLoaded', () => {
    steeneSettingsView.init();
});