const navigationFragmentElement = typeof fragmentElement !== 'undefined' ? fragmentElement : document.querySelector('.fragment-left-navigation');

if (navigationFragmentElement) {
    const submenuTriggers = navigationFragmentElement.querySelectorAll('.has-submenu > .nav-link');

    submenuTriggers.forEach(trigger => {
        trigger.addEventListener('click', function (e) {
            if (navigationFragmentElement.classList.contains('collapsed')) {
                return;
            }

            e.preventDefault();
            const parentLi = this.parentElement;
            parentLi.classList.toggle('expanded');
        });
    });

    // Handle global toggle event
    window.addEventListener('toggleSidebar', () => {
        navigationFragmentElement.classList.toggle('collapsed');
    });
}
