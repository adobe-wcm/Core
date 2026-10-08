import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

let panelCount = 0;

/**
 * Sets the expanded state of a menu button
 * @param {Element} button The button element
 * @param {Boolean} expanded Whether the panel it controls is shown
 */
function setExpanded(button, expanded) {
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/**
 * Closes every open top level menu
 * @param {Element} nav The nav element
 * @param {Element} except Optional menu button to leave untouched
 */
function closeDrops(nav, except = null) {
  nav.querySelectorAll('.nav-drop > button[aria-expanded="true"]').forEach((button) => {
    if (button !== except) setExpanded(button, false);
  });
}

/**
 * Shows one group of a mega menu and hides its sibling groups
 * @param {Element} group The group list item to show
 */
function activateGroup(group) {
  group.parentElement.querySelectorAll(':scope > .nav-group > button').forEach((button) => {
    setExpanded(button, button.parentElement === group);
  });
}

/**
 * Opens or closes a top level menu
 * @param {Element} nav The nav element
 * @param {Element} button The menu button
 */
function toggleDrop(nav, button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  closeDrops(nav, button);
  setExpanded(button, !expanded);
  // desktop: a mega menu always shows one group, start with the first
  // mobile: start on the list of groups
  button.parentElement.querySelectorAll('.nav-group > button').forEach((groupButton, i) => {
    setExpanded(groupButton, !expanded && isDesktop.matches && i === 0);
  });
}

/**
 * Opens or closes the mobile menu, and resets every menu inside it
 * @param {Element} nav The nav element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  // the desktop nav is always expanded, so aria-expanded only applies to the mobile menu
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  nav.querySelectorAll('.nav-drop > button, .nav-group > button').forEach((b) => setExpanded(b, false));
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

/**
 * Moves the label of a list item into a button
 * @param {Element} item The list item
 * @param {Element} list The nested list of the item, which stays outside the button
 * @returns {Element} The button
 */
function createToggle(item, list) {
  const button = document.createElement('button');
  button.type = 'button';
  [...item.childNodes].forEach((node) => {
    if (node !== list) button.append(node);
  });
  // the label can arrive wrapped in a paragraph, keep only its content
  const paragraph = button.querySelector(':scope > p');
  if (paragraph) paragraph.replaceWith(...paragraph.childNodes);
  if (!button.children.length) button.textContent = button.textContent.trim();
  setExpanded(button, false);
  item.prepend(button);
  return button;
}

/**
 * Connects a button to the panel it shows, and adds the mobile back button to the panel
 * @param {Element} button The button that opens the panel
 * @param {Element} panel The panel
 */
function connect(button, panel) {
  panelCount += 1;
  panel.id = `nav-panel-${panelCount}`;
  button.setAttribute('aria-controls', panel.id);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'nav-back';
  back.textContent = button.textContent;
  back.addEventListener('click', () => {
    setExpanded(button, false);
    button.focus();
  });
  panel.prepend(back);
}

/**
 * Wraps a list of links, moving the links authored in italics into a side list
 * @param {Element} list The list of links
 * @returns {Element} The wrapper
 */
function buildContent(list) {
  const content = document.createElement('div');
  content.className = 'nav-content';
  list.replaceWith(content);
  list.classList.add('nav-links');
  content.append(list);

  const rail = document.createElement('ul');
  rail.className = 'nav-rail';
  [...list.children].forEach((item) => {
    const em = item.querySelector('em');
    if (!em) return;
    em.replaceWith(...em.childNodes);
    rail.append(item);
  });
  if (rail.children.length) content.append(rail);
  return content;
}

/**
 * Turns the nested lists of a nav area into menus
 * @param {Element} nav The nav element
 * @param {Element} area The sections or tools container
 */
function decorateMenu(nav, area) {
  const menu = area.querySelector('ul');
  if (!menu) return;
  menu.classList.add('nav-menu');

  [...menu.children].forEach((item) => {
    const list = item.querySelector(':scope > ul');
    if (!list) return;
    item.classList.add('nav-drop');
    const button = createToggle(item, list);
    const panel = document.createElement('div');
    panel.className = 'nav-panel';
    item.append(panel);
    panel.append(list);
    button.addEventListener('click', () => toggleDrop(nav, button));

    // list items with their own list are the groups of a mega menu
    const groups = [...list.children].filter((child) => child.querySelector(':scope > ul'));
    if (!groups.length) {
      buildContent(list);
      connect(button, panel);
      return;
    }

    item.classList.add('nav-mega');
    list.classList.add('nav-groups');
    panel.style.setProperty('--nav-groups', list.children.length);
    groups.forEach((group) => {
      group.classList.add('nav-group');
      const links = group.querySelector(':scope > ul');
      const groupButton = createToggle(group, links);
      connect(groupButton, buildContent(links));
      groupButton.addEventListener('click', () => activateGroup(group));
      groupButton.addEventListener('mouseenter', () => {
        if (isDesktop.matches) activateGroup(group);
      });
      groupButton.addEventListener('focus', () => {
        if (isDesktop.matches) activateGroup(group);
      });
    });
    connect(button, panel);
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand ? navBrand.querySelector('.button') : null;
  if (brandLink) {
    brandLink.className = '';
    const container = brandLink.closest('.button-container');
    if (container) container.className = '';
  }

  nav.querySelectorAll('.nav-sections, .nav-tools').forEach((area) => decorateMenu(nav, area));

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  // escape closes the open menu on desktop, and goes back one level on mobile
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const openDrop = nav.querySelector('.nav-drop > button[aria-expanded="true"]');
    const openGroup = nav.querySelector('.nav-group > button[aria-expanded="true"]');
    if (isDesktop.matches) {
      if (!openDrop) return;
      closeDrops(nav);
      openDrop.focus();
    } else if (openGroup || openDrop) {
      const open = openGroup || openDrop;
      setExpanded(open, false);
      open.focus();
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      nav.querySelector('.nav-hamburger button').focus();
    }
  });

  // close the open menu on a click outside the nav, or when tabbing out of it
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeDrops(nav);
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && e.relatedTarget && !nav.contains(e.relatedTarget)) closeDrops(nav);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
