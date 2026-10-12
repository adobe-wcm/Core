import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Header block
 *
 * Reads the nav document (/nav, or the page's "nav" metadata). Its sections, in order:
 *   1 brand     logo image, and a link to the home page
 *   2 search    one link to the search results page, e.g. /search?q=
 *   3 tools     list: a link, or a label with a nested list that opens a side drawer
 *   4 sections  list: a label with a nested list opens a menu panel, nested groups make tabs
 *   5 region    list: one label, nested regions, each with a list of language links
 *
 * Authoring conventions:
 *   :icon-name:        icon from /icons, e.g. :pin:
 *   italic link        secondary link, shown in the side column of a panel or drawer
 *   bold tools label   stays in the mobile top bar (icon only)
 *   italic tools label shows only its icon on desktop
 *   bold drawer link   button
 *   link + line break + text in a drawer: card with title, description and domain
 */

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

// UI text that is not authored in the nav document
const LABELS = {
  openNav: 'Open navigation',
  closeNav: 'Close navigation',
  close: 'Close',
  search: 'Search',
  chooser: 'Select Region/Language',
  region: 'Region',
  save: 'Save',
  cancel: 'Cancel',
  newWindow: '(opens in a new window)',
};

const SECTIONS = ['brand', 'search', 'tools', 'sections', 'region'];

let idCount = 0;

/**
 * Returns a unique id
 * @param {string} prefix The id prefix
 * @returns {string} The id
 */
function nextId(prefix) {
  idCount += 1;
  return `${prefix}-${idCount}`;
}

/**
 * Creates an element with a class and optional text
 * @param {string} tag The tag name
 * @param {string} className The class name
 * @param {string} text Optional text content
 * @returns {Element} The element
 */
function el(tag, className, text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

/**
 * Turns an icon span into a CSS mask so it takes the text color
 * @param {Element} span The span.icon element
 */
function maskIcon(span) {
  const name = [...span.classList].find((c) => c.startsWith('icon-'));
  if (!name) return;
  span.style.setProperty('--icon', `url("${window.hlx.codeBasePath}/icons/${name.substring(5)}.svg")`);
  span.setAttribute('aria-hidden', 'true');
  span.replaceChildren();
}

/**
 * Creates an icon
 * @param {string} name The icon name, a file in /icons
 * @returns {Element} The icon
 */
function createIcon(name) {
  const span = el('span', `icon icon-${name}`);
  maskIcon(span);
  return span;
}

/**
 * Removes an element and keeps its content in place
 * @param {Element} element The element to unwrap
 */
function unwrap(element) {
  if (element) element.replaceWith(...element.childNodes);
}

/**
 * Wraps everything except icons in a label span
 * @param {Element} element The link or button
 */
function wrapLabel(element) {
  const label = el('span', 'nav-label');
  const icons = [];
  [...element.childNodes].forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('icon')) icons.push(node);
    else label.append(node);
  });
  label.textContent = label.textContent.trim();
  element.replaceChildren(...icons, label);
}

/**
 * Sets the expanded state of a menu button
 * @param {Element} button The button
 * @param {Boolean} expanded Whether the panel it controls is shown
 */
function setExpanded(button, expanded) {
  button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/**
 * Closes every open menu panel
 * @param {Element} nav The nav element
 * @param {Element} except Optional menu button to leave untouched
 */
function closeDrops(nav, except = null) {
  nav.querySelectorAll('.nav-drop > button[aria-expanded="true"]').forEach((button) => {
    if (button !== except) setExpanded(button, false);
  });
}

/**
 * Shows one tab of a menu panel and hides the others
 * @param {Element} group The group list item to show
 */
function activateGroup(group) {
  group.parentElement.querySelectorAll(':scope > .nav-group > button').forEach((button) => {
    setExpanded(button, button.parentElement === group);
  });
}

/**
 * Opens or closes a menu panel
 * @param {Element} nav The nav element
 * @param {Element} button The menu button
 */
function toggleDrop(nav, button) {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  closeDrops(nav, button);
  setExpanded(button, !expanded);
  // desktop shows the first tab, mobile starts on the list of tabs
  button.parentElement.querySelectorAll('.nav-group > button').forEach((tab, i) => {
    setExpanded(tab, !expanded && isDesktop.matches && i === 0);
  });
}

/**
 * Locks or unlocks page scrolling behind the open menu or drawer
 */
function updateScrollLock() {
  const nav = document.getElementById('nav');
  const menuOpen = nav && !isDesktop.matches && nav.getAttribute('aria-expanded') === 'true';
  const drawerOpen = !!document.querySelector('header .nav-drawer[open]');
  document.body.style.overflowY = (menuOpen || drawerOpen) ? 'hidden' : '';
}

/**
 * Opens or closes the mobile menu, and resets every panel inside it
 * @param {Element} nav The nav element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  // the desktop nav is always expanded, so aria-expanded only applies to the mobile menu
  if (isDesktop.matches) nav.removeAttribute('aria-expanded');
  else nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  nav.querySelectorAll('.nav-drop > button, .nav-group > button').forEach((b) => setExpanded(b, false));
  button.setAttribute('aria-label', expanded ? LABELS.openNav : LABELS.closeNav);
  updateScrollLock();
}

/**
 * Moves the label of a list item into a button
 * @param {Element} item The list item
 * @param {Element} list The nested list, which stays outside the button
 * @returns {Element} The button
 */
function createToggle(item, list) {
  const button = el('button');
  button.type = 'button';
  [...item.childNodes].forEach((node) => {
    if (node !== list) button.append(node);
  });
  wrapLabel(button);
  item.prepend(button);
  return button;
}

/**
 * Connects a button to the panel it opens, and adds the mobile back button
 * @param {Element} button The button
 * @param {Element} panel The panel
 */
function connect(button, panel) {
  panel.id = nextId('nav-panel');
  button.setAttribute('aria-controls', panel.id);
  setExpanded(button, false);
  const back = el('button', 'nav-back', button.textContent.trim());
  back.type = 'button';
  back.addEventListener('click', () => {
    setExpanded(button, false);
    button.focus();
  });
  panel.prepend(back);
}

/**
 * Wraps a list of links, moving italic links into a side list
 * @param {Element} list The list of links
 * @returns {Element} The wrapper
 */
function buildContent(list) {
  const content = el('div', 'nav-content');
  list.replaceWith(content);
  list.classList.add('nav-links');
  content.append(list);
  const side = el('ul', 'nav-side');
  [...list.children].forEach((item) => {
    const em = item.querySelector('em');
    if (!em) return;
    unwrap(em);
    side.append(item);
  });
  if (side.children.length) content.append(side);
  return content;
}

/**
 * Builds the menu panels of the main navigation
 * @param {Element} nav The nav element
 * @param {Element} section The sections container
 */
function decorateSections(nav, section) {
  const menu = section.querySelector('ul');
  if (!menu) return;
  menu.classList.add('nav-menu');

  [...menu.children].forEach((item) => {
    const list = item.querySelector(':scope > ul');
    if (!list) {
      const link = item.querySelector('a');
      if (link) wrapLabel(link);
      return;
    }
    item.classList.add('nav-drop');
    const button = createToggle(item, list);
    const panel = el('div', 'nav-panel');
    item.append(panel);
    panel.append(list);
    button.addEventListener('click', () => toggleDrop(nav, button));

    // list items with their own list are the tabs of the panel
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
      const tab = createToggle(group, links);
      connect(tab, buildContent(links));
      tab.addEventListener('click', () => activateGroup(group));
      tab.addEventListener('mouseenter', () => {
        if (isDesktop.matches) activateGroup(group);
      });
      tab.addEventListener('focus', () => {
        if (isDesktop.matches) activateGroup(group);
      });
    });
    connect(button, panel);
  });
}

/**
 * Creates an empty side drawer
 * @param {string} title The drawer title
 * @returns {Object} The dialog and its body and footer
 */
function createDrawer(title) {
  const dialog = el('dialog', 'nav-drawer');
  const titleId = nextId('nav-drawer-title');
  dialog.setAttribute('aria-labelledby', titleId);

  const head = el('div', 'nav-drawer-head');
  const heading = el('h2', 'nav-drawer-title', title);
  heading.id = titleId;
  const close = el('button', 'nav-drawer-close');
  close.type = 'button';
  close.setAttribute('aria-label', LABELS.close);
  close.append(createIcon('close'));
  close.addEventListener('click', () => dialog.close());
  head.append(heading, close);

  const body = el('div', 'nav-drawer-body');
  const footer = el('div', 'nav-drawer-footer');
  dialog.append(head, body, footer);

  // a click on the backdrop lands on the dialog itself
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', updateScrollLock);
  return { dialog, body, footer };
}

/**
 * Fills a drawer with a list of links, buttons, text and cards
 * @param {Object} drawer The drawer parts
 * @param {Element} list The authored list
 */
function fillListDrawer({ dialog, body, footer }, list) {
  list.className = 'nav-drawer-list';
  const side = el('ul', 'nav-drawer-list nav-drawer-side');
  [...list.children].forEach((item) => {
    const em = item.querySelector('em');
    if (em) {
      unwrap(em);
      side.append(item);
    }
    const link = item.querySelector('a');
    if (!link) {
      item.classList.add('nav-drawer-text');
      return;
    }
    const strong = link.closest('strong');
    if (strong) {
      unwrap(strong);
      item.classList.add('nav-drawer-action');
      link.className = 'nav-drawer-button';
      return;
    }
    // text after the link is a description
    const icon = item.querySelector('.icon');
    const description = item.textContent.replace(link.textContent, '').trim();
    if (!description) return;
    item.classList.add('nav-drawer-card');
    link.className = 'nav-drawer-card-title';
    const text = el('div', 'nav-drawer-card-text');
    text.append(link, el('p', 'nav-drawer-card-description', description));
    try {
      text.append(el('span', 'nav-drawer-card-domain', new URL(link.href).host.replace(/^www\./, '')));
    } catch { /* relative link, no domain shown */ }
    item.replaceChildren(...(icon ? [icon] : []), text);
  });
  body.append(list);
  if (side.children.length) body.append(side);

  const close = el('button', 'nav-drawer-secondary', LABELS.close);
  close.type = 'button';
  close.addEventListener('click', () => dialog.close());
  footer.append(close);
}

/**
 * Fills a drawer with a region select and language options
 * @param {Object} drawer The drawer parts
 * @param {Element} list The authored list of regions, each with a list of language links
 */
function fillChooser({ dialog, body, footer }, list) {
  const groups = [...list.children].filter((item) => item.querySelector(':scope > ul'));
  const field = el('div', 'nav-chooser-field');
  const select = el('select');
  select.id = nextId('nav-chooser');
  const label = el('label', '', LABELS.region);
  label.htmlFor = select.id;
  field.append(label, select);
  body.append(field);

  const radioName = nextId('nav-chooser-option');
  const here = window.location.href;
  let current = 0;
  const sets = groups.map((group, i) => {
    const name = [...group.childNodes]
      .filter((node) => node.nodeName !== 'UL')
      .map((node) => node.textContent).join('').trim();
    const option = el('option', '', name);
    option.value = i;
    select.append(option);

    const set = el('fieldset', 'nav-chooser-options');
    set.append(el('legend', 'nav-sr-only', name));
    group.querySelectorAll(':scope > ul > li a').forEach((link) => {
      const choice = el('label', 'nav-chooser-option');
      const input = el('input');
      input.type = 'radio';
      input.name = radioName;
      input.value = link.href;
      if (here.startsWith(link.href.replace(/\.html$/, ''))) {
        input.checked = true;
        current = i;
      }
      choice.append(input, el('span', '', link.textContent.trim()));
      set.append(choice);
    });
    body.append(set);
    return set;
  });

  const show = (index) => {
    sets.forEach((set, i) => { set.hidden = i !== index; });
    const visible = sets[index];
    if (visible && !visible.querySelector('input:checked')) {
      const first = visible.querySelector('input');
      if (first) first.checked = true;
    }
  };
  select.value = current;
  show(current);
  select.addEventListener('change', () => show(Number(select.value)));

  const save = el('button', 'nav-drawer-primary', LABELS.save);
  save.type = 'button';
  save.addEventListener('click', () => {
    const checked = body.querySelector('fieldset:not([hidden]) input:checked');
    if (checked) window.location.href = checked.value;
    else dialog.close();
  });
  const cancel = el('button', 'nav-drawer-link', LABELS.cancel);
  cancel.type = 'button';
  cancel.addEventListener('click', () => dialog.close());
  footer.append(save, cancel);
}

/**
 * Builds the tools and region lists: plain links, and labels that open drawers
 * @param {Element} nav The nav element
 * @param {Element} section The tools or region container
 * @param {Element} drawers The container that collects the drawers
 */
function decorateTools(nav, section, drawers) {
  const menu = section.querySelector('ul');
  if (!menu) return;
  menu.classList.add('nav-menu');

  [...menu.children].forEach((item) => {
    // bold keeps the item in the mobile top bar, italics shows only its icon on desktop
    const strong = item.querySelector(':scope > strong');
    if (strong) {
      item.classList.add('nav-pinned');
      unwrap(strong);
    }
    const em = item.querySelector(':scope > em');
    if (em) {
      item.classList.add('nav-icon-only');
      unwrap(em);
    }

    const list = item.querySelector(':scope > ul');
    if (!list) {
      const link = item.querySelector('a');
      if (!link) return;
      item.querySelectorAll(':scope > .icon').forEach((icon) => link.prepend(icon));
      wrapLabel(link);
      item.replaceChildren(link);
      return;
    }

    const button = createToggle(item, list);
    button.setAttribute('aria-haspopup', 'dialog');
    const isChooser = [...list.children].some((child) => child.querySelector(':scope > ul'));
    const drawer = createDrawer(isChooser ? LABELS.chooser : button.textContent.trim());
    if (isChooser) fillChooser(drawer, list);
    else fillListDrawer(drawer, list);
    list.remove();
    drawers.append(drawer.dialog);
    button.addEventListener('click', () => {
      closeDrops(nav);
      drawer.dialog.showModal();
      updateScrollLock();
    });
  });
}

/**
 * Builds the logo link
 * @param {Element} section The brand container
 * @returns {string} The host of the home page
 */
function decorateBrand(section) {
  const link = section.querySelector('a[href]');
  const picture = section.querySelector('picture') || section.querySelector('img');
  const home = el('a', 'nav-logo');
  home.href = link ? link.href : '/';
  if (picture) {
    const img = picture.tagName === 'IMG' ? picture : picture.querySelector('img');
    home.append(picture);
    if (img && !img.alt) img.alt = link ? link.textContent.trim() : 'Home';
  } else {
    home.textContent = link ? link.textContent.trim() : '';
  }
  section.replaceChildren(home);
  return new URL(home.href).host;
}

/**
 * Builds the search form from the authored search link
 * @param {Element} section The search container
 */
function decorateSearch(section) {
  const link = section.querySelector('a[href]');
  if (!link) {
    section.remove();
    return;
  }
  const url = new URL(link.href);
  const [param = 'q'] = [...url.searchParams.keys()];
  const placeholder = link.textContent.trim() || LABELS.search;

  const form = el('form', 'nav-search-form');
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = `${url.origin}${url.pathname}`;
  const input = el('input');
  input.type = 'search';
  input.name = param;
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.setAttribute('aria-label', placeholder);
  const submit = el('button');
  submit.type = 'submit';
  submit.setAttribute('aria-label', LABELS.search);
  submit.append(createIcon('search'));
  form.append(input, submit);
  section.replaceChildren(form);
}

/**
 * Marks links to other sites with an icon, and opens them in a new window
 * @param {Element} nav The nav element
 * @param {string} homeHost The host of the home page
 */
function decorateExternalLinks(nav, homeHost) {
  nav.querySelectorAll('.nav-sections a[href], .nav-tools a[href]').forEach((link) => {
    let url;
    try {
      url = new URL(link.href);
    } catch {
      return;
    }
    if (url.host === window.location.host || url.host === homeHost) return;
    link.target = '_blank';
    link.rel = 'noopener';
    link.append(createIcon('external'), el('span', 'nav-sr-only', ` ${LABELS.newWindow}`));
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
  const nav = el('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // undo the default content decoration the fragment received
  nav.querySelectorAll('li > p').forEach(unwrap);
  nav.querySelectorAll('.button').forEach((link) => link.classList.remove('button', 'primary', 'secondary', 'accent'));
  nav.querySelectorAll('.button-wrapper, .button-container').forEach((p) => p.removeAttribute('class'));
  nav.querySelectorAll('span.icon').forEach(maskIcon);

  SECTIONS.forEach((name, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${name}`);
  });

  const drawers = el('div', 'nav-drawers');
  const brand = nav.querySelector('.nav-brand');
  const homeHost = brand ? decorateBrand(brand) : window.location.host;
  const search = nav.querySelector('.nav-search');
  if (search) decorateSearch(search);
  const sections = nav.querySelector('.nav-sections');
  if (sections) decorateSections(nav, sections);
  nav.querySelectorAll('.nav-tools, .nav-region').forEach((section) => decorateTools(nav, section, drawers));
  decorateExternalLinks(nav, homeHost);

  // hamburger for mobile
  const hamburger = el('div', 'nav-hamburger');
  const hamburgerButton = el('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', LABELS.openNav);
  hamburgerButton.append(el('span', 'nav-hamburger-icon'));
  hamburger.append(hamburgerButton);
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, isDesktop.matches));

  // escape closes the open panel on desktop, and goes back one level on mobile
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape' || drawers.querySelector('dialog[open]')) return;
    const openDrop = nav.querySelector('.nav-drop > button[aria-expanded="true"]');
    const openTab = nav.querySelector('.nav-group > button[aria-expanded="true"]');
    if (isDesktop.matches) {
      if (!openDrop) return;
      closeDrops(nav);
      openDrop.focus();
    } else if (openTab || openDrop) {
      const open = openTab || openDrop;
      setExpanded(open, false);
      open.focus();
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
      hamburgerButton.focus();
    }
  });

  // close the open panel on a click outside the nav, or when tabbing out of it
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeDrops(nav);
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && e.relatedTarget && !nav.contains(e.relatedTarget)) closeDrops(nav);
  });

  const navWrapper = el('div', 'nav-wrapper');
  navWrapper.append(nav, drawers);
  block.append(navWrapper);
}
