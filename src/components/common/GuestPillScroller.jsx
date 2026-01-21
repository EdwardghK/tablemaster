import React from 'react';
import { cn } from '@/utils';

const ITEM_WIDTH = 56;

export default function GuestPillScroller({
  items,
  value,
  onChange,
  visibleCount = 5,
  ariaLabel = 'Select guest',
  className,
  disabled = false,
}) {
  const containerRef = React.useRef(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const startScrollLeft = React.useRef(0);
  const velocityHistory = React.useRef([]);
  const momentumFrame = React.useRef(0);
  const snapTimeoutRef = React.useRef(0);
  const scrollEndTimeoutRef = React.useRef(0);
  const activePointerId = React.useRef(null);

  const itemsWithKeys = React.useMemo(
    () => items.map((item, index) => ({ ...item, key: `${item.id ?? item.value ?? index}` })),
    [items]
  );

  const getValueIndex = React.useCallback(
    (val) => itemsWithKeys.findIndex((item) => `${item.id}` === `${val}`),
    [itemsWithKeys]
  );

  const setScrollToValue = React.useCallback(
    (val, opts = { animate: true }) => {
      const container = containerRef.current;
      if (!container) return;
      const index = getValueIndex(val);
      if (index === -1) return;
      const targetScroll = index * ITEM_WIDTH;
      container.scrollTo({
        left: targetScroll,
        behavior: opts.animate ? 'smooth' : 'instant',
      });
    },
    [getValueIndex]
  );

  React.useEffect(() => {
    setScrollToValue(value, { animate: false });
  }, [setScrollToValue, value]);

  const snapToNearest = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const maxIndex = itemsWithKeys.length - 1;
    const maxScroll = Math.max(0, maxIndex * ITEM_WIDTH);
    const currentScroll = container.scrollLeft;
    let nearestIndex;
    if (currentScroll <= ITEM_WIDTH / 2) {
      nearestIndex = 0;
    } else if (currentScroll >= maxScroll - ITEM_WIDTH / 2) {
      nearestIndex = maxIndex;
    } else {
      const rawIndex = currentScroll / ITEM_WIDTH;
      nearestIndex = Math.max(0, Math.min(maxIndex, Math.round(rawIndex)));
    }
    const selected = itemsWithKeys[nearestIndex];
    if (selected && `${selected.id}` !== `${value}`) {
      onChange?.(selected.id, { via: 'programmatic' });
    }
    container.scrollTo({
      left: nearestIndex * ITEM_WIDTH,
      behavior: 'smooth',
    });
  }, [itemsWithKeys, onChange, value]);

  const calculateVelocity = React.useCallback(() => {
    const history = velocityHistory.current;
    if (history.length < 2) return 0;
    const samples = history.slice(-5);
    if (samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    if (!dt) return 0;
    return (last.x - first.x) / dt;
  }, []);

  const applyMomentum = React.useCallback(
    (initialVelocity) => {
      const container = containerRef.current;
      if (!container) {
        snapToNearest();
        return;
      }

      let velocity = initialVelocity;
      const friction = 0.92;
      const minVelocity = 0.5;
      const maxScroll = Math.max(0, (itemsWithKeys.length - 1) * ITEM_WIDTH);

      const animate = () => {
        if (Math.abs(velocity) < minVelocity) {
          snapToNearest();
          return;
        }

        let nextScroll = container.scrollLeft + velocity;
        if (nextScroll < 0) {
          nextScroll *= 0.3;
          velocity *= 0.5;
        } else if (nextScroll > maxScroll) {
          nextScroll = maxScroll + (nextScroll - maxScroll) * 0.3;
          velocity *= 0.5;
        }

        container.scrollLeft = nextScroll;
        velocity *= friction;
        momentumFrame.current = requestAnimationFrame(animate);
      };

      momentumFrame.current = requestAnimationFrame(animate);
    },
    [itemsWithKeys.length, snapToNearest]
  );

  const finishDrag = React.useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    activePointerId.current = null;

    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }

    const velocity = calculateVelocity();
    const scrollVelocity = -velocity * 16;
    if (Math.abs(scrollVelocity) > 2) {
      applyMomentum(scrollVelocity);
    } else {
      snapToNearest();
    }

    velocityHistory.current = [];
  }, [applyMomentum, calculateVelocity, snapToNearest]);

  const handlePointerDown = React.useCallback(
    (e) => {
      if (disabled) return;
      if (e.pointerType !== 'mouse') return;
      if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current);
      isDragging.current = true;
      activePointerId.current = e.pointerId;
      startX.current = e.clientX;
      startScrollLeft.current = containerRef.current?.scrollLeft ?? 0;
      velocityHistory.current = [{ x: e.clientX, t: performance.now() }];
      containerRef.current?.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [disabled]
  );

  const handlePointerMove = React.useCallback(
    (e) => {
      if (!isDragging.current || disabled || e.pointerId !== activePointerId.current) return;
      e.preventDefault();
      const dx = e.clientX - startX.current;
      const container = containerRef.current;
      if (!container) return;
      container.scrollLeft = startScrollLeft.current - dx;
      velocityHistory.current.push({ x: e.clientX, t: performance.now() });
      if (velocityHistory.current.length > 10) velocityHistory.current.shift();
    },
    [disabled]
  );

  const handlePointerUp = React.useCallback(
    (e) => {
      if (!isDragging.current || disabled || e.pointerId !== activePointerId.current) return;
      containerRef.current?.releasePointerCapture(e.pointerId);
      finishDrag();
    },
    [disabled, finishDrag]
  );

  const handlePointerCancel = React.useCallback(
    (e) => {
      if (isDragging.current && e.pointerId === activePointerId.current) {
        containerRef.current?.releasePointerCapture(e.pointerId);
        finishDrag();
      }
    },
    [finishDrag]
  );

  const handleItemClick = React.useCallback(
    (itemId) => {
      if (disabled) return;
      onChange?.(itemId, { via: 'pointer' });
      setScrollToValue(itemId, { animate: true });
    },
    [disabled, onChange, setScrollToValue]
  );

  const handleScroll = React.useCallback(() => {
    if (disabled || isDragging.current) return;
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = window.setTimeout(() => {
      snapToNearest();
    }, 120);
  }, [disabled, snapToNearest]);

  React.useEffect(
    () => () => {
      if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    },
    []
  );

  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{ height: 64 }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent dark:from-stone-900"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent dark:from-stone-900"
        aria-hidden="true"
      />
      <div
        ref={containerRef}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={`guest-pill-${value}`}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'flex items-center gap-0 overflow-x-auto overflow-y-hidden scrollbar-hide',
          'cursor-grab active:cursor-grabbing',
          disabled && 'cursor-not-allowed'
        )}
        style={{
          scrollSnapType: 'x mandatory',
          paddingLeft: `calc(50% - ${ITEM_WIDTH / 2}px)`,
          paddingRight: `calc(50% - ${ITEM_WIDTH / 2}px)`,
          touchAction: 'pan-x',
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onScroll={handleScroll}
      >
        {itemsWithKeys.map((item) => {
          const isSelected = `${item.id}` === `${value}`;
          return (
            <button
              key={item.key}
              id={`guest-pill-${item.id}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={cn(
                'flex-shrink-0 min-w-[56px] px-3 py-1.5 rounded-full border text-sm snap-center transition-all',
                isSelected
                  ? 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/70 dark:text-amber-100 dark:border-amber-500/60 scale-110 opacity-100'
                  : 'bg-stone-100 border-stone-200 text-stone-600 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 scale-90 opacity-50'
              )}
              style={{ width: ITEM_WIDTH }}
              onClick={() => handleItemClick(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
