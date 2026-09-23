/**
 * STEENE — steene/js/components/navigation.js
 * Mobile navigation menu behavior only. Does NOT handle view routing
 * — steene/js/core/router.js is the single owner of hash routing on
 * index.html, and #profile/#settings are separate pages
 * navigated to with ordinary links, so no routing logic belongs
 * here at all. (Previously this file, host.js, and router.js each
 * independently listened for `hashchange` — that duplication has
 * been removed as part of this refactor.)
 */

window.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('steeneNavbar');
    const toggle = document.getElementById('mobileMenuToggle');

    if (!navbar || !toggle) return;

    toggle.addEventListener('click', () => {
        navbar.classList.toggle('menu-open');
    });

    // Choosing a nav link closes the mobile menu automatically.
    navbar.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('menu-open');
        });
    });

    // Tapping/clicking anywhere outside the open menu closes it.
    document.addEventListener('click', event => {
        if (!navbar.classList.contains('menu-open')) return;
        if (!navbar.contains(event.target)) {
            navbar.classList.remove('menu-open');
        }
    });
});
