/**
 * Deciding *where* a "fill" action should apply.
 *
 * When the user is inside a popup (modal / dialog / drawer) or inside a
 * carousel slide / tab panel, only that container should be filled - never the
 * page behind it.
 *
 * If the site you are testing marks its popups or slides with a class or
 * attribute that is not listed below, just add it to the relevant list.
 * Nothing else needs to change.
 */

/** Containers that sit on top of the page. */
export const POPUP_CONTAINER_SELECTORS: string[] = [
  // Standards based
  "dialog[open]",
  "[role='dialog']",
  "[role='alertdialog']",
  "[aria-modal='true']",
  // Bootstrap 3 / 4 / 5
  ".modal.show",
  ".modal.in",
  ".modal-dialog",
  ".offcanvas.show",
  ".offcanvas.showing",
  // jQuery UI
  ".ui-dialog",
  ".ui-widget.dialog",
  ".ui-dialog-content",
  // Semantic UI
  ".ui.modal",
  // Material UI
  ".MuiDialog-root",
  ".MuiModal-root",
  ".MuiDrawer-root",
  // PrimeReact
  ".p-dialog",
  // Ant Design
  ".ant-modal",
  // Element UI
  ".el-dialog",
  ".el-drawer",
  // SweetAlert2
  ".swal2-container",
  // Video.js
  ".ve-modal",
  // Ext JS
  ".x-window",
  // Frequently hand rolled names
  ".drawer.show",
  ".drawer.open",
  ".popup.show",
  ".popup.open",
  ".lightbox",
];

/** In-page region switchers: carousel slides, tab panels, wizard steps. */
export const SLIDE_CONTAINER_SELECTORS: string[] = [
  // Bootstrap 4 / 5 carousel
  ".carousel-item",
  // Generic, Owl and Bootstrap 3 carousels
  ".slide",
  // slick
  ".slick-slide",
  // Swiper
  ".swiper-slide",
  // Flickity
  ".carousel-cell",
  // Bootstrap tabs
  ".tab-pane",
  // jQuery UI tabs
  ".ui-tabs-panel",
  // ARIA tabs
  "[role='tabpanel']",
];

/** Used only when nothing is focused, to work out which slide is on screen. */
export const ACTIVE_SLIDE_SELECTORS: string[] = [
  ".carousel-item.active",
  ".carousel .slide.active",
  ".swiper-slide-active",
  ".slick-active",
  ".flickity-selected",
  ".tab-pane.active",
];

const POPUP_SELECTOR = POPUP_CONTAINER_SELECTORS.join(", ");
const SLIDE_SELECTOR = SLIDE_CONTAINER_SELECTORS.join(", ");
const ACTIVE_SLIDE_SELECTOR = ACTIVE_SLIDE_SELECTORS.join(", ");

function isRendered(element: HTMLElement): boolean {
  if (!element.offsetHeight && !element.offsetWidth) {
    return false;
  }

  return window.getComputedStyle(element).visibility !== "hidden";
}

/**
 * Walks up from `start` and returns the container that a fill should be limited
 * to, or `undefined` when the element does not live inside one.
 *
 * A popup wins over a slide, and the outermost popup is used: anything outside
 * of a modal counts as "background", so the modal itself is the boundary. When
 * there is no popup, the innermost slide/tab panel is the natural scope.
 */
export function findScopeContainer(start: Element | null | undefined): HTMLElement | undefined {
  if (!start) {
    return undefined;
  }

  const popups: HTMLElement[] = [];
  const slides: HTMLElement[] = [];
  let current: Element | null = start;

  while (current) {
    // `parentElement` only ever yields elements, so no instanceof check is
    // needed here (and avoiding one keeps this realm independent).
    const element = current as HTMLElement;

    if (element.matches(POPUP_SELECTOR)) {
      popups.push(element);
    } else if (element.matches(SLIDE_SELECTOR)) {
      slides.push(element);
    }

    current = current.parentElement;
  }

  if (popups.length > 0) {
    // Collected innermost first, so the last entry is the outermost popup.
    return popups[popups.length - 1];
  }

  return slides[0];
}

/**
 * Fallback for when nothing is focused (focus sits on `<body>`): returns the
 * popup that is currently open, otherwise the slide that is currently on
 * screen. Returns `undefined` when neither exists.
 */
export function findOpenContainer(): HTMLElement | undefined {
  const popups = Array.from(document.querySelectorAll<HTMLElement>(POPUP_SELECTOR)).filter(isRendered);

  if (popups.length > 0) {
    // Keep only the popups that are not nested inside another popup, then take
    // the last one in DOM order, which is the topmost of the stacked overlays.
    const outermost = popups.filter((popup) => !popups.some((other) => other !== popup && other.contains(popup)));

    return outermost[outermost.length - 1];
  }

  const activeSlide = document.querySelector<HTMLElement>(ACTIVE_SLIDE_SELECTOR);

  return activeSlide && isRendered(activeSlide) ? activeSlide : undefined;
}
