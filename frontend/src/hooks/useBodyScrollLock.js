import { useEffect } from 'react';

let activeLocks = 0;
let previousStyles;

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
  previousStyles = undefined;
}

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return undefined;

    lockPageScroll();
    return unlockPageScroll;
  }, [isLocked]);
}
