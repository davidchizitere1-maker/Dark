/**
 * STEENE — steene/js/auth/auth-ui.js
 * Handles additional UI-specific interactions for the authentication modals
 * and tab switching.
 */

const steeneAuthUi = {
    init() {
        // Close modal when clicking outside the card content
        const modalBg = document.getElementById('auth-modal');
        if (modalBg) {
            modalBg.addEventListener('click', (e) => {
                if (e.target === modalBg) {
                    if (typeof steeneAuth !== 'undefined' && steeneAuth.closeModal) {
                        steeneAuth.closeModal();
                    }
                }
            });
        }

        // Support pressing Enter key in authentication inputs
        ['login-email', 'login-password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && typeof steeneAuth !== 'undefined') {
                        steeneAuth.signIn();
                    }
                });
            }
        });

        ['signup-username', 'signup-email', 'signup-password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && typeof steeneAuth !== 'undefined') {
                        steeneAuth.signUp();
                    }
                });
            }
        });
    }
};

window.addEventListener('DOMContentLoaded', () => {
    steeneAuthUi.init();
});