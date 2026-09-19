/**
 * STEENE — steene/js/auth/auth-ui.js
 * Interaction niceties for the auth modal that don't belong in
 * auth-state.js's session-management logic: submitting a form with
 * Enter, closing on a click outside the card or on Escape, and
 * clearing form fields whenever the modal closes so a password
 * never lingers in a hidden, still-populated input.
 */

function steeneAuthHandleEnterKey(event, formType) {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    if (formType === 'login') {
        steeneAuth.signIn();
    } else if (formType === 'signup') {
        steeneAuth.signUp();
    }
}

function steeneAuthClearInputs() {
    ['login-email', 'login-password', 'signup-username', 'signup-email', 'signup-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    // Clicking the dimmed backdrop (not the card itself) closes it.
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            steeneAuth.closeModal();
        }
    });

    // Escape closes it from anywhere on the page.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            steeneAuth.closeModal();
        }
    });

    // Enter submits whichever form is currently visible.
    ['login-email', 'login-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', event => steeneAuthHandleEnterKey(event, 'login'));
    });

    ['signup-username', 'signup-email', 'signup-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', event => steeneAuthHandleEnterKey(event, 'signup'));
    });
});
