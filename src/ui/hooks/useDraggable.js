import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

function normalizePoint(value) {
  return {
    x: Number.isFinite(Number(value?.x)) ? Number(value.x) : 0,
    y: Number.isFinite(Number(value?.y)) ? Number(value.y) : 0,
  };
}

function getShadowHostOffset(target) {
  const root = target?.getRootNode?.();
  if (root && root.host instanceof HTMLElement) {
    const rect = root.host.getBoundingClientRect();
    return {
      left: Number.isFinite(rect.left) ? rect.left : 0,
      top: Number.isFinite(rect.top) ? rect.top : 0,
      root,
    };
  }
  return {
    left: 0,
    top: 0,
    root,
  };
}

function localPointerPosition(event, offset) {
  return {
    x: event.clientX - offset.left,
    y: event.clientY - offset.top,
  };
}

function applyBounds(point, bounds) {
  if (!bounds) return point;
  const minX = Number.isFinite(Number(bounds.minX)) ? Number(bounds.minX) : point.x;
  const maxX = Number.isFinite(Number(bounds.maxX)) ? Number(bounds.maxX) : point.x;
  const minY = Number.isFinite(Number(bounds.minY)) ? Number(bounds.minY) : point.y;
  const maxY = Number.isFinite(Number(bounds.maxY)) ? Number(bounds.maxY) : point.y;

  return {
    x: Math.min(maxX, Math.max(minX, point.x)),
    y: Math.min(maxY, Math.max(minY, point.y)),
  };
}

/**
 * Shadow DOM-safe draggable hook.
 * Coordinates are maintained relative to the shadow host so dragging remains stable.
 */
export function useDraggable({
  initialPosition,
  disabled = false,
  getBounds,
  onPositionChange,
  onPositionCommit,
}) {
  const [position, setPosition] = useState(() => normalizePoint(initialPosition));
  const [dragging, setDragging] = useState(false);
  const positionRef = useRef(normalizePoint(initialPosition));
  const dragRef = useRef({
    pointerId: null,
    startPointer: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    moveListener: null,
    upListener: null,
    listenersTarget: null,
    lastPosition: normalizePoint(initialPosition),
  });

  useEffect(() => {
    if (dragging) return;
    const next = normalizePoint(initialPosition);
    positionRef.current = next;
    setPosition(next);
  }, [initialPosition?.x, initialPosition?.y, dragging]);

  const startDrag = useCallback((event) => {
    if (disabled) return;
    const isPrimaryPointer = event.button === 0 || event.buttons === 1;
    if (!isPrimaryPointer) return;

    event.preventDefault();

    const handleEl = event.currentTarget;
    const offset = getShadowHostOffset(handleEl);
    const startPointer = localPointerPosition(event, offset);
    const startPosition = normalizePoint(positionRef.current);

    const bounds = typeof getBounds === 'function' ? getBounds(startPosition) : null;

    const onMove = (moveEvent) => {
      const pointer = localPointerPosition(moveEvent, offset);
      const next = applyBounds({
        x: startPosition.x + (pointer.x - startPointer.x),
        y: startPosition.y + (pointer.y - startPointer.y),
      }, bounds);
      positionRef.current = next;
      dragRef.current.lastPosition = next;
      setPosition(next);
      onPositionChange?.(next);
    };

    const onUp = () => {
      setDragging(false);
      const final = normalizePoint(dragRef.current.lastPosition || positionRef.current);
      positionRef.current = final;
      onPositionCommit?.(final);

      const listenersTarget = dragRef.current.listenersTarget;
      if (listenersTarget?.removeEventListener) {
        listenersTarget.removeEventListener('pointermove', dragRef.current.moveListener, true);
        listenersTarget.removeEventListener('pointerup', dragRef.current.upListener, true);
      }
      window.removeEventListener('pointermove', dragRef.current.moveListener, true);
      window.removeEventListener('pointerup', dragRef.current.upListener, true);

      dragRef.current.pointerId = null;
      dragRef.current.moveListener = null;
      dragRef.current.upListener = null;
      dragRef.current.listenersTarget = null;
    };

    dragRef.current.pointerId = event.pointerId;
    dragRef.current.startPointer = startPointer;
    dragRef.current.startPosition = startPosition;
    dragRef.current.moveListener = (moveEvent) => {
      onMove(moveEvent);
    };
    dragRef.current.upListener = onUp;

    setDragging(true);

    const listenersTarget = offset.root && typeof offset.root.addEventListener === 'function'
      ? offset.root
      : window;

    dragRef.current.listenersTarget = listenersTarget;

    listenersTarget.addEventListener('pointermove', dragRef.current.moveListener, true);
    listenersTarget.addEventListener('pointerup', dragRef.current.upListener, true);
    window.addEventListener('pointermove', dragRef.current.moveListener, true);
    window.addEventListener('pointerup', dragRef.current.upListener, true);

    if (typeof handleEl?.setPointerCapture === 'function') {
      try {
        handleEl.setPointerCapture(event.pointerId);
      } catch {
        // Ignore: some hosts reject capture while still dispatching pointer events.
      }
    }
  }, [disabled, getBounds, onPositionChange, onPositionCommit]);

  return {
    position,
    setPosition,
    dragging,
    startDrag,
  };
}
