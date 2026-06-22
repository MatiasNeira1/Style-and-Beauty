import { useEffect } from 'react';

let activeLocks = 0;
let previousStyles;
let guardsAttached = false;

function eventStartedInsideModal(event) {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (path.some((target) => target?.classList?.contains?.('modal'))) {
    return true;
  }

  return event.target instanceof Element && Boolean(event.target.closest('.modal'));
}

function preventBackgroundScroll(event) {
  if (activeLocks <= 0 || eventStartedInsideModal(event)) return;
  event.preventDefault();
}

function attachScrollGuards() {
  if (guardsAttached) return;
  document.addEventListener('wheel', preventBackgroundScroll, { capture: true, passive: false });
  document.addEventListener('touchmove', preventBackgroundScroll, { capture: true, passive: false });
  guardsAttached = true;
}

function detachScrollGuards() {
  if (!guardsAttached) return;
  document.removeEventListener('wheel', preventBackgroundScroll, { capture: true });
  document.removeEventListener('touchmove', preventBackgroundScroll, { capture: true });
  guardsAttached = false;
}

function lockPageScroll() {
  if (activeLocks === 0) {
    const { body, documentElement } = document;
    previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: documentElement.style.overflow,
    };

    const scrollbarGap = window.innerWidth - documentElement.clientWidth;
    body.classList.add('modal-open');
    documentElement.classList.add('modal-open');
    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    if (scrollbarGap > 0) body.style.paddingRight = `${scrollbarGap}px`;
    attachScrollGuards();
  }

  activeLocks += 1;
}

function unlockPageScroll() {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks !== 0 || !previousStyles) return;

  const { body, documentElement } = document;
  body.classList.remove('modal-open');
  documentElement.classList.remove('modal-open');
  body.style.overflow = previousStyles.bodyOverflow;
  body.style.paddingRight = previousStyles.bodyPaddingRight;
  documentElement.style.overflow = previousStyles.htmlOverflow;
  detachScrollGuards();
  previousStyles = undefined;
}

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return undefined;

    lockPageScroll();
    return unlockPageScroll;
  }, [isLocked]);
}
