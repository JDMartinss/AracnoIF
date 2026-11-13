import { useEffect } from 'react';

export function useMapGestures(viewport, zoom, setZoom, enabled = true) {
  useEffect(() => {
    const element = viewport.current;
    if (!element || !enabled) return;
    let gesture;
    const distance = (touches) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    function start(event) {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      const x = (event.touches[0].clientX + event.touches[1].clientX) / 2 - bounds.left;
      const y = (event.touches[0].clientY + event.touches[1].clientY) / 2 - bounds.top;
      gesture = {
        distance: distance(event.touches),
        zoom: Number(element.dataset.zoom || 1),
        x,
        y,
        left: element.scrollLeft,
        top: element.scrollTop,
      };
    }
    function move(event) {
      if (!gesture || event.touches.length !== 2) return;
      event.preventDefault();
      const next = Math.max(
        1,
        Math.min(3, (gesture.zoom * distance(event.touches)) / Math.max(1, gesture.distance)),
      );
      setZoom(next);
      requestAnimationFrame(() => {
        element.scrollLeft = ((gesture.left + gesture.x) * next) / gesture.zoom - gesture.x;
        element.scrollTop = ((gesture.top + gesture.y) * next) / gesture.zoom - gesture.y;
      });
    }
    const end = () => {
      gesture = null;
    };
    element.addEventListener('touchstart', start, { passive: false });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', end);
    element.addEventListener('touchcancel', end);
    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', end);
    };
  }, [viewport, setZoom, enabled]);
  // Read the current zoom at gesture start without interrupting an active pinch.
  useEffect(() => {
    if (viewport.current) viewport.current.dataset.zoom = zoom;
  }, [zoom, viewport]);
}
