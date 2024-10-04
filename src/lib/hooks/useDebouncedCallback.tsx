import { useRef, useEffect, useCallback } from "react";

function useDebouncedCallback<T extends ( ...args: any[] ) => void>(
  callback: T,
  delay: number,
) {
  const callbackRef = useRef( callback );
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update current callback to the latest one each time it changes
  useEffect( () => {
    callbackRef.current = callback;
  }, [ callback ] );

  const debouncedCallback: ( ...args: Parameters<T> ) => void = useCallback(
    ( ...args: Parameters<T> ) => {
      if ( timeoutRef.current ) {
        clearTimeout( timeoutRef.current );
      }
      timeoutRef.current = setTimeout( () => {
        callbackRef.current( ...args );
      }, delay );
    },
    [ delay ],
  );

  // Clean up on unmount
  useEffect( () => {
    return () => {
      if ( timeoutRef.current ) {
        clearTimeout( timeoutRef.current );
      }
    };
  }, [] );

  return debouncedCallback;
}

export default useDebouncedCallback;
