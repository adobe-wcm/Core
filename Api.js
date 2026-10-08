if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
// mark third-level groups (Equipment, Maintenance...)
navSection.querySelectorAll(':scope > ul > li').forEach((item) => {
  if (item.querySelector('ul')) item.classList.add('nav-group');
});
navSection.addEventListener('click', (e) => {
  // clicks inside the open panel must not close it
  if (e.target.closest('.nav-drop > ul')) return;
  if (isDesktop.matches) {
    const expanded = navSection.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(navSections);
    navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }
});
