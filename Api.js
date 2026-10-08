/* mobile-first file: the desktop media query restyles the same elements with shorter selectors */
/* stylelint-disable no-descending-specificity */

/* header theme: change the colors and row heights here */
header {
  --header-accent: #ffcd11;
  --header-background: #fff;
  --header-text: #000;
  --header-muted: #f2f2f2;
  --header-border: #d9d9d9;
  --header-nav-row-height: 48px;
}

/* header and nav layout */
header .nav-wrapper {
  position: fixed;
  z-index: 2;
  width: 100%;
  border-bottom: 1px solid var(--header-border);
  background-color: var(--header-background);
  color: var(--header-text);
}

header nav {
  box-sizing: border-box;
  display: grid;
  grid-template:
    'hamburger brand' var(--nav-height)
    'sections sections' auto
    'tools tools' auto / auto 1fr;
  align-items: center;
  gap: 0 24px;
  margin: auto;
  max-width: 1248px;
  height: var(--nav-height);
  padding: 0 24px;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size-s);
  line-height: 1.3;
}

header nav[aria-expanded='true'] {
  align-content: start;
  overflow-y: auto;
  height: 100dvh;
}

header nav p {
  margin: 0;
  line-height: 1;
}

header nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

header nav a:any-link {
  color: currentcolor;
  text-decoration: none;
}

header nav a:hover {
  text-decoration: underline;
}

header nav a:focus-visible,
header nav button:focus-visible {
  outline: 2px solid currentcolor;
  outline-offset: 2px;
}

/* hamburger */
header nav .nav-hamburger {
  grid-area: hamburger;
  height: 22px;
  display: flex;
  align-items: center;
}

header nav .nav-hamburger button {
  height: 22px;
  margin: 0;
  border: 0;
  border-radius: 0;
  padding: 0;
  background-color: var(--header-background);
  color: inherit;
  overflow: initial;
  text-overflow: initial;
  white-space: initial;
}

header nav .nav-hamburger-icon,
header nav .nav-hamburger-icon::before,
header nav .nav-hamburger-icon::after {
  box-sizing: border-box;
  display: block;
  position: relative;
  width: 20px;
}

header nav .nav-hamburger-icon::before,
header nav .nav-hamburger-icon::after {
  content: '';
  position: absolute;
  background: currentcolor;
}

header nav[aria-expanded='false'] .nav-hamburger-icon,
header nav[aria-expanded='false'] .nav-hamburger-icon::before,
header nav[aria-expanded='false'] .nav-hamburger-icon::after {
  height: 2px;
  border-radius: 2px;
  background: currentcolor;
}

header nav[aria-expanded='false'] .nav-hamburger-icon::before {
  top: -6px;
}

header nav[aria-expanded='false'] .nav-hamburger-icon::after {
  top: 6px;
}

header nav[aria-expanded='true'] .nav-hamburger-icon {
  height: 22px;
}

header nav[aria-expanded='true'] .nav-hamburger-icon::before,
header nav[aria-expanded='true'] .nav-hamburger-icon::after {
  top: 3px;
  left: 1px;
  transform: rotate(45deg);
  transform-origin: 2px 1px;
  width: 24px;
  height: 2px;
  border-radius: 2px;
}

header nav[aria-expanded='true'] .nav-hamburger-icon::after {
  top: unset;
  bottom: 3px;
  transform: rotate(-45deg);
}

/* brand */
header nav .nav-brand {
  grid-area: brand;
  font-size: var(--heading-font-size-s);
  font-weight: 700;
  line-height: 1;
}

header nav .nav-brand img {
  display: block;
  width: auto;
  height: 32px;
}

/* sections and tools: hidden on mobile until the hamburger opens the nav */
header nav .nav-sections,
header nav .nav-tools {
  display: none;
}

header nav .nav-sections {
  grid-area: sections;
}

header nav .nav-tools {
  grid-area: tools;
  padding-bottom: 24px;
}

header nav[aria-expanded='true'] .nav-sections,
header nav[aria-expanded='true'] .nav-tools {
  display: block;
}

/* mobile menu: one full-width row per item */
header nav li {
  border-bottom: 1px solid var(--header-border);
}

header nav .nav-menu > li {
  font-weight: 700;
}

header nav li > a,
header nav .nav-drop > button,
header nav .nav-group > button,
header nav .nav-back {
  all: unset;
  box-sizing: border-box;
  display: block;
  position: relative;
  width: 100%;
  padding: 14px 28px 14px 0;
  cursor: pointer;
}

/* chevron pointing to the next level */
header nav .nav-drop > button::after,
header nav .nav-group > button::after,
header nav .nav-back::before {
  content: '';
  position: absolute;
  top: calc(50% - 4px);
  right: 6px;
  transform: rotate(45deg);
  width: 6px;
  height: 6px;
  border: solid currentcolor;
  border-width: 2px 2px 0 0;
}

/* mobile panels: each level slides over the previous one */
header nav .nav-panel,
header nav .nav-mega .nav-content {
  box-sizing: border-box;
  display: none;
  position: fixed;
  inset: var(--nav-height) 0 0;
  z-index: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  background-color: var(--header-background);
  font-weight: 400;
}

header nav .nav-drop > button[aria-expanded='true'] + .nav-panel,
header nav .nav-group > button[aria-expanded='true'] + .nav-content {
  display: block;
}

header nav .nav-back {
  border-bottom: 4px solid var(--header-accent);
  padding: 14px 0 14px 28px;
  font-weight: 700;
}

header nav .nav-back::before {
  right: auto;
  left: 6px;
  transform: rotate(225deg);
}

header nav .nav-group {
  font-weight: 700;
}

header nav .nav-rail {
  margin-top: 24px;
  padding: 0 16px;
  background-color: var(--header-muted);
  font-weight: 700;
}

header nav .nav-rail > li:last-child {
  border-bottom: 0;
}

@media (width >= 900px) {
  /* two rows: brand and tools, then the main navigation */
  header {
    height: auto;
    min-height: calc(var(--nav-height) + var(--header-nav-row-height));
  }

  header .nav-wrapper {
    position: relative;
  }

  header nav {
    grid-template:
      'brand tools' var(--nav-height)
      'sections sections' var(--header-nav-row-height) / auto 1fr;
    align-items: stretch;
    max-width: 1264px;
    height: auto;
    padding: 0 32px;
  }

  header nav .nav-hamburger,
  header nav .nav-back {
    display: none;
  }

  header nav .nav-brand {
    align-self: center;
  }

  header nav .nav-sections,
  header nav .nav-tools {
    display: block;
    padding: 0;
  }

  header nav .nav-tools {
    justify-self: end;
    font-size: var(--body-font-size-xs);
  }

  header nav .nav-sections > div,
  header nav .nav-tools > div {
    height: 100%;
  }

  header nav .nav-menu {
    display: flex;
    gap: 32px;
    height: 100%;
  }

  header nav .nav-tools .nav-menu {
    gap: 24px;
  }

  header nav li {
    border-bottom: 0;
  }

  header nav .nav-menu > li {
    display: flex;
    align-items: stretch;
    white-space: nowrap;
  }

  /* the first plain link after the menus (Buy Parts) sits on the right */
  header nav .nav-sections .nav-drop + li:not(.nav-drop) {
    margin-left: auto;
  }

  header nav .nav-tools .nav-menu > li {
    position: relative;
    font-weight: 400;
  }

  header nav li > a {
    width: auto;
    padding: 6px 0;
  }

  header nav .nav-menu > li > a,
  header nav .nav-drop > button {
    display: flex;
    align-items: center;
    width: auto;
    padding: 0;
  }

  /* accent bar under the hovered and the open item */
  header nav .nav-sections .nav-menu > li > a:hover,
  header nav .nav-sections .nav-drop > button:hover,
  header nav .nav-sections .nav-drop > button[aria-expanded='true'] {
    box-shadow: inset 0 -4px 0 var(--header-accent);
    text-decoration: none;
  }

  header nav .nav-tools .nav-drop > button:hover,
  header nav .nav-tools .nav-drop > button[aria-expanded='true'] {
    text-decoration: underline;
  }

  header nav .nav-drop > button::after {
    position: static;
    transform: translateY(-2px) rotate(135deg);
    margin-left: 8px;
    width: 5px;
    height: 5px;
  }

  header nav .nav-drop > button[aria-expanded='true']::after {
    transform: translateY(2px) rotate(315deg);
  }

  /* panel: full width below the header */
  header nav .nav-panel {
    position: absolute;
    inset: 100% 0 auto;
    max-height: calc(100dvh - var(--nav-height) - var(--header-nav-row-height) - 24px);
    border-top: 1px solid var(--header-border);
    padding: 32px max(32px, calc((100% - 1200px) / 2));
    box-shadow: 0 8px 16px rgb(0 0 0 / 15%);
    white-space: normal;
  }

  header nav .nav-content {
    display: flex;
    align-items: flex-start;
    gap: 48px;
  }

  header nav .nav-links {
    flex: 1 1 auto;
    columns: 4 180px;
    column-gap: 32px;
  }

  header nav .nav-links > li {
    break-inside: avoid;
  }

  header nav .nav-rail {
    flex: 0 0 220px;
    margin: 0;
    border-left: 1px solid var(--header-border);
    padding: 0 0 0 32px;
    background-color: transparent;
  }

  /* mega menu: groups on the left, the links of the active group next to them */
  header nav .nav-mega > button[aria-expanded='true'] + .nav-panel {
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-rows: repeat(var(--nav-groups), auto) 1fr;
    column-gap: 48px;
  }

  header nav .nav-mega .nav-groups,
  header nav .nav-mega .nav-groups > li {
    display: contents;
  }

  header nav .nav-mega .nav-groups > li > a,
  header nav .nav-mega .nav-group > button {
    grid-column: 1;
    border-left: 4px solid transparent;
    padding: 12px 32px 12px 16px;
    font-weight: 700;
  }

  header nav .nav-mega .nav-group > button::after {
    right: 16px;
  }

  header nav .nav-mega .nav-group > button[aria-expanded='true'] {
    border-left-color: var(--header-accent);
    background-color: var(--header-muted);
  }

  header nav .nav-mega .nav-content,
  header nav .nav-mega .nav-group > button[aria-expanded='true'] + .nav-content {
    position: static;
    grid-area: 1 / 2 / -1 / 3;
    z-index: auto;
    overflow: visible;
    padding: 0;
  }

  header nav .nav-mega .nav-group > button[aria-expanded='true'] + .nav-content {
    display: flex;
  }

  header nav .nav-mega .nav-links {
    columns: 3 180px;
  }

  /* tools menus: small panels aligned to the right */
  header nav .nav-tools .nav-panel {
    inset: 100% 0 auto auto;
    width: 280px;
    padding: 16px 24px;
  }

  header nav .nav-tools .nav-content {
    flex-direction: column;
    gap: 12px;
  }

  header nav .nav-tools .nav-links {
    columns: auto;
  }

  header nav .nav-tools .nav-rail {
    flex: 0 0 auto;
    align-self: stretch;
    border-top: 1px solid var(--header-border);
    border-left: 0;
    padding: 12px 0 0;
    font-weight: 400;
  }
}
