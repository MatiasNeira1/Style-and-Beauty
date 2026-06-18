import { Children } from 'react';

export function getBalancedGridClassName(count, className = '') {
  const total = Math.max(0, Number(count) || 0);
  const cappedCount = Math.min(total, 6);
  const classes = [
    'balanced-card-grid',
    cappedCount ? `balanced-card-grid--count-${cappedCount}` : '',
    total > 0 && total % 2 === 1 ? 'balanced-card-grid--odd' : '',
    total > 4 && total % 3 ? `balanced-card-grid--remainder-${total % 3}` : '',
    className,
  ];

  return classes.filter(Boolean).join(' ');
}

export function BalancedGrid({ children, className = '' }) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <div className={getBalancedGridClassName(items.length, className)}>
      {items}
    </div>
  );
}
