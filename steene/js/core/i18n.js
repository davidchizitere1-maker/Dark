const platformTranslations = {
    en: {
        navGames: "Games",
        navProfile: "Profile",
        navSettings: "Settings",
        btnLogin: "Log In",
        btnSignup: "Sign Up",
        btnLogout: "Log Out",
        authNewpasswordPlaceholder: "At least 6 characters",
        dashEyebrow: "STEENE GAMESTORE",
        dashTitle: "Welcome to STEENE",
        dashSubtitle: "Your premium destination for classic and modern board games.",
        discover: "DISCOVER",
        gamesMarket: "Games Market",
        exploreSteene: "Explore STEENE",
        authLoginTitle: "Log In to STEENE",
        authSignupTitle: "Create Your STEENE Account",
        emailLabel: "Email",
        nickName: "Your name",
        authEmailLabel: "Email",
        authPasswordLabel: "Password",
        authEmailPlaceholder: "you@example.com",
        authPasswordPlaceholder: "••••••••",
        passwordLabel: "Password",
        nameLabel: "Display Name",
        noAccount: "Don't have an account?",
        hasAccount: "Already have an account?"
    },
    es: {
        navGames: "Juegos",
        authNewpasswordPlaceholder: "Al menos 6 caracteres",
        navProfile: "Perfil",
        sIGNuP: "Registrarse",
        nickName: "Tu nombre",
        authSwitchToSignup: "¿No tienes una cuenta? ",
        authSwitchToLogin: "¿Ya tienes una cuenta? ",
        navSettings: "Ajustes",
        btnLogin: "Iniciar Sesión",
        btnSignup: "Registrarse",
        btnLogout: "Cerrar Sesión",
        createAccountTitle: "Crea tu cuenta de STEENE",
        dashEyebrow: "TIENDA DE JUEGOS STEENE",
        dashTitle: "Bienvenido a STEENE",
        dashSubtitle: "Tu destino prémium para juegos de mesa clásicos y modernos.",
        discover: "DESCUBRIR",
        gamesMarket: "Mercado de Juegos",
        searchGames: "Buscar Juegos",
        authLoginTitle: "Iniciar Sesión en STEENE",
        authSignupTitle: "Crea tu cuenta de STEENE",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        nameLabel: "Nombre de usuario",
        noAccount: "¿No tienes una cuenta?",
        hasAccount: "¿Ya tienes una cuenta?",
        mobToggle: "⚙",
        modalCLOSE: "❎",
        loGINeRROR: "Error de inicio de sesión. Por favor, verifica tus credenciales.",
        authEmailLabel: "Correo electrónico",
        authPasswordLabel: "Contraseña",
        authEmailPlaceholder: "you@example.com",
        authPasswordPlaceholder: "••••••••",
        settingsTitle: "Ajustes",
        preferencesTitle: "Preferencias",
        backTOgames: "← Volver a Juegos",
        
    },
    fr: {
        navGames: "Jeux",
        navProfile: "Profil",
        nickName: "Votre nom",
        sIGNuP: "S'inscrire",
        authSwitchToSignup: "Vous n'avez pas de compte ?",
        authSwitchToLogin: "Vous avez déjà un compte ?",
        navSettings: "Paramètres",
        authEmailLabel: "E-mail",
        authPasswordLabel: "Mot de passe",
        authEmailPlaceholder: "you@example.com",
        createAccountTitle: "Créez votre compte STEENE",
        authPasswordPlaceholder: "••••••••",
        loGINeRROR: "Erreur de connexion. Veuillez vérifier vos identifiants.",
        backTOgames: "← Retour aux Jeux",
        btnLogin: "Connexion",
        btnSignup: "S'inscrire",
        btnLogout: "Déconnexion",
        dashEyebrow: "BOUTIQUE DE JEUX STEENE",
        dashTitle: "Bienvenue sur STEENE",
        dashSubtitle: "Votre destination privilégiée pour les jeux de société classiques et modernes.",
        discover: "DÉCOUVRIR",
        gamesMarket: "Marché des Jeux",
        authNewpasswordPlaceholder: "Au moins 6 caractères",
        searchGames: "Rechercher des Jeux",
        authLoginTitle: "Connexion à STEENE",
        authSignupTitle: "Créer votre compte STEENE",
        emailLabel: "E-mail",
        passwordLabel: "Mot de passe",
        nameLabel: "Nom d'affichage",
        noAccount: "Vous n'avez pas de compte ?",
        hasAccount: "Vous avez déjà un compte ?",
        mobToggle: "🍔",
        modalCLOSE: "✖",
        settingsTitle: "Paramètres",
        preferencesTitle: "Préférences",
        settingsSub: "Personnalisez votre expérience STEENE sur toute la plateforme."
    },
    de: {
        navGames: "Spiele",
        nickName: "Ihr Name",
        navProfile: "Profil",
        createAccountTitle: "Erstellen Sie Ihr STEENE-Konto",
        navSettings: "Einstellungen",
        sIGNuP: "Registrieren",
        authSwitchToSignup: "Sie haben kein Konto?",
        authSwitchToLogin: "Sie haben bereits ein Konto?",
        authEmailLabel: "E-Mail",
        authPasswordLabel: "Passwort",
        authEmailPlaceholder: "you@example.com",
        authPasswordPlaceholder: "••••••••",
        btnLogin: "Anmelden",
        loGINeRROR: "Anmeldefehler. Bitte überprüfen Sie Ihre Anmeldedaten.",
        btnSignup: "Registrieren",
        btnLogout: "Abmelden",
        dashEyebrow: "STEENE SPIELELADEN",
        dashTitle: "Willkommen bei STEENE",
        dashSubtitle: "Ihre Premium-Plattform für klassische und moderne Brettspiele.",
        discover: "ENTDECKEN",
        gamesMarket: "Spielemarkt",
        authNewpasswordPlaceholder: "Mindestens 6 Zeichen",
        searchGames: "Spiele suchen",
        authLoginTitle: "Bei STEENE Anmelden",
        authSignupTitle: "Erstellen Sie Ihr STEENE-Konto",
        emailLabel: "E-Mail",
        passwordLabel: "Passwort",
        nameLabel: "Anzeigename",
        noAccount: "Sie haben kein Konto?",
        hasAccount: "Sie haben bereits ein Konto?",
        modalCLOSE: "❌",
        backTOgames: "← Zurück zu Spielen",
        mobToggle: "📝",
        settingsTitle: "Einstellungen",
        preferencesTitle: "Präferenzen",
        settingsSub: "Personalisieren Sie Ihr STEENE-Erlebnis auf der gesamten Plattform."
    }
};
 
function applyPlatformLanguage(langCode) {
    const dict =
        platformTranslations[langCode] ||
        platformTranslations.en;

    document.documentElement.lang = langCode;

    // Translate all elements marked with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");

        // Only skip if the translation key does not exist.
        if (!Object.prototype.hasOwnProperty.call(dict, key)) {
            return;
        }

        const translatedText = dict[key];

        /*
         * INPUT fields:
         * Translate only the placeholder.
         * Never use textContent on an input.
         */
        if (
            el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA"
        ) {
            if (el.hasAttribute("placeholder")) {
                el.placeholder = translatedText;
            }

            return;
        }

        /*
         * Special case for the modal close button.
         * Its visible content is "×", while data-i18n is
         * intended to translate the aria-label.
         */
        if (key === "modalCLOSE") {
            el.setAttribute("aria-label", translatedText);
            return;
        }

        /*
         * If the element contains another element with
         * data-i18n, do NOT use textContent because that
         * would destroy the child element.
         *
         * Example:
         * <label data-i18n="authEmailLabel">
         *     Email
         *     <input ...>
         * </label>
         */
        const hasNestedI18nElement =
            el.querySelector("[data-i18n]");

        if (hasNestedI18nElement) {
            /*
             * Find the first meaningful direct text node and
             * replace only that text.
             */
            for (const node of el.childNodes) {
                if (
                    node.nodeType === Node.TEXT_NODE &&
                    node.textContent.trim() !== ""
                ) {
                    node.textContent = translatedText;
                    return;
                }
            }

            return;
        }

        /*
         * Normal elements such as headings, buttons,
         * paragraphs, links, etc.
         */
        el.textContent = translatedText;
    });
}


// Listen for global settings changes triggered by settings.js
window.addEventListener("steene:settings-updated", (event) => {
    const settings = event.detail || {};

    applyPlatformLanguage(
        settings.language || "en"
    );
});


// Apply language on initial load if settings exist
window.addEventListener("DOMContentLoaded", () => {
    try {
        const saved = localStorage.getItem(
            "steene_platform_settings"
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            applyPlatformLanguage(
                parsed.language || "en"
            );
        }
    } catch (e) {
        console.warn(
            "STEENE: Unable to apply saved platform language.",
            e
        );
    }
});
