import { useRef, useEffect, useCallback } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebouncedCallback<T extends (..._args: any[]) => any>(
  callback: T,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Update current callback to the latest one each time it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (..._args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callbackRef.current as any)(..._args);
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
