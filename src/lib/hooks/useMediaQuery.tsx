import { useEffect, useState } from "react";

// credit for this hook came from this website: https://usehooks-ts.com/react-hook/use-media-query
// I modified it a bit to remove some deprecated methods not supported by all browsers

export const useMediaQuery = (query: string) => {
  //returns true/false if window matches our query, if window is undefined returns false
  const getMatches = (query: string) => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // piece of state telling whether or not our query matches window
  const [matches, setMatches] = useState(getMatches(query));

  // sets our state based on our query, runs initially and with the change event listener
  const handleChange = () => {
    setMatches(getMatches(query));
  };

  useEffect(() => {
    // Triggered at the first client-side load and if query changes
    handleChange();

    window.addEventListener("resize", handleChange);
    // eslint-disable-next-line
  }, [query]);

  return matches;
};
