import { useRef, useEffect, useCallback } from "react";

function useDebouncedCallback(
  callback: (...args: any[]) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<any>();

  // Update current callback to the latest one each time it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback: (...args: any[]) => void = useCallback(
    (...args: []) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export default useDebouncedCallback;
