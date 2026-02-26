import { useRef, useState, useCallback, useEffect } from 'react';

interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const INITIAL_MOBILE_SCALE = 0.55;
const INITIAL_DESKTOP_SCALE = 1;
const FOCUS_SCALE_MOBILE = 1.05;
const FOCUS_SCALE_DESKTOP = 1.2;
const DRAG_THRESHOLD = 8; // px — clicks below this are treated as taps, not drags

function isMobile() {
  return window.innerWidth < 768;
}

export function useCanvasTransform() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState<TransformState>(() => ({
    scale: isMobile() ? INITIAL_MOBILE_SCALE : INITIAL_DESKTOP_SCALE,
    translateX: 0,
    translateY: 0,
  }));

  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for gesture tracking
  const isPanning = useRef(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });
  const lastPinchDistance = useRef(0);
  const lastPinchCenter = useRef({ x: 0, y: 0 });
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const dragDistance = useRef(0);
  const animatingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ---- Pinch-to-zoom (touch) ----
  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (t1: Touch, t2: Touch) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setIsAnimating(false);
    if (e.touches.length === 2) {
      e.preventDefault();
      lastPinchDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastPinchCenter.current = getCenter(e.touches[0], e.touches[1]);
      dragDistance.current = DRAG_THRESHOLD + 1; // pinch is never a tap
    } else if (e.touches.length === 1) {
      isPanning.current = true;
      dragDistance.current = 0;
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const newDist = getDistance(e.touches[0], e.touches[1]);
      const newCenter = getCenter(e.touches[0], e.touches[1]);
      const scaleFactor = newDist / lastPinchDistance.current;

      setTransform(prev => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * scaleFactor));
        // Adjust translation so zoom is centered on pinch point
        const dx = newCenter.x - lastPinchCenter.current.x;
        const dy = newCenter.y - lastPinchCenter.current.y;
        return {
          scale: newScale,
          translateX: prev.translateX + dx,
          translateY: prev.translateY + dy,
        };
      });

      lastPinchDistance.current = newDist;
      lastPinchCenter.current = newCenter;
      isPanning.current = false;
    } else if (e.touches.length === 1 && isPanning.current) {
      const dx = e.touches[0].clientX - lastPanPoint.current.x;
      const dy = e.touches[0].clientY - lastPanPoint.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      setTransform(prev => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ---- Mouse wheel zoom (desktop) ----
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.93 : 1.07;
    
    setTransform(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
      // Zoom towards cursor
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        const scaleChange = newScale / prev.scale;
        return {
          scale: newScale,
          translateX: prev.translateX + cx * (1 - scaleChange),
          translateY: prev.translateY + cy * (1 - scaleChange),
        };
      }
      return { ...prev, scale: newScale };
    });
  }, []);

  // ---- Mouse drag pan (desktop) ----
  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Only left button
    if (e.button !== 0) return;
    setIsAnimating(false);
    isPanning.current = true;
    dragDistance.current = 0;
    lastPanPoint.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPanPoint.current.x;
    const dy = e.clientY - lastPanPoint.current.y;
    dragDistance.current += Math.abs(dx) + Math.abs(dy);
    lastPanPoint.current = { x: e.clientX, y: e.clientY };

    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ---- Attach/detach events ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  // ---- Control functions ----
  const zoomIn = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(MAX_SCALE, prev.scale * 1.25),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(MIN_SCALE, prev.scale * 0.8),
    }));
  }, []);

  const resetTransform = useCallback(() => {
    setIsAnimating(true);
    setTransform({
      scale: isMobile() ? INITIAL_MOBILE_SCALE : INITIAL_DESKTOP_SCALE,
      translateX: 0,
      translateY: 0,
    });
    clearTimeout(animatingTimeout.current);
    animatingTimeout.current = setTimeout(() => setIsAnimating(false), 500);
  }, []);

  const fitToScreen = useCallback(() => {
    setIsAnimating(true);
    setTransform({
      scale: isMobile() ? 0.4 : 0.7,
      translateX: 0,
      translateY: 0,
    });
    clearTimeout(animatingTimeout.current);
    animatingTimeout.current = setTimeout(() => setIsAnimating(false), 500);
  }, []);

  // ---- Focus on element (center + zoom) ----
  const focusOnElement = useCallback((el: HTMLElement) => {
    // If the user dragged, don't focus
    if (dragDistance.current > DRAG_THRESHOLD) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elemRect = el.getBoundingClientRect();

    // Viewport center
    const vx = containerRect.left + containerRect.width / 2;
    const vy = containerRect.top + containerRect.height / 2;

    // Element center in screen space
    const ex = elemRect.left + elemRect.width / 2;
    const ey = elemRect.top + elemRect.height / 2;

    const cur = transformRef.current;
    const newScale = isMobile() ? FOCUS_SCALE_MOBILE : FOCUS_SCALE_DESKTOP;

    // The content layer transform is: translate(Tx, Ty) scale(S)
    // with transform-origin at center of the container.
    // A point at content-space offset (cx, cy) from center appears at screen:
    //   screenX = vx + cx * S + Tx
    // Solve for cx: cx = (ex - vx - Tx) / S
    const cx = (ex - vx - cur.translateX) / cur.scale;
    const cy = (ey - vy - cur.translateY) / cur.scale;

    // New translate to center this point at viewport center with new scale:
    //   vx = vx + cx * newScale + Tx_new  =>  Tx_new = -cx * newScale
    const newTx = -cx * newScale;
    const newTy = -cy * newScale;

    setIsAnimating(true);
    setTransform({
      scale: newScale,
      translateX: newTx,
      translateY: newTy,
    });

    clearTimeout(animatingTimeout.current);
    animatingTimeout.current = setTimeout(() => setIsAnimating(false), 500);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(animatingTimeout.current);
  }, []);

  return {
    containerRef,
    transform,
    isAnimating,
    zoomIn,
    zoomOut,
    resetTransform,
    fitToScreen,
    focusOnElement,
  };
}
