
import { useRef, useCallback } from 'react';

interface AnimationState {
  startValue: number;
  targetValue: number;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
}

export const useSmoothAnimation = () => {
  const animationRef = useRef<number>();
  const stateRef = useRef<AnimationState | null>(null);

  const animate = useCallback((
    startValue: number,
    targetValue: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void,
    easing: (t: number) => number = (t) => t
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    stateRef.current = {
      startValue,
      targetValue,
      startTime: performance.now(),
      duration,
      easing
    };

    const step = (currentTime: number) => {
      if (!stateRef.current) return;

      const elapsed = currentTime - stateRef.current.startTime;
      const progress = Math.min(elapsed / stateRef.current.duration, 1);
      const easedProgress = stateRef.current.easing(progress);
      
      const currentValue = stateRef.current.startValue + 
        (stateRef.current.targetValue - stateRef.current.startValue) * easedProgress;
      
      onUpdate(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        stateRef.current = null;
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
      stateRef.current = null;
    }
  }, []);

  return { animate, stop };
};
