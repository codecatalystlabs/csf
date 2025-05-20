"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  // Default to false during SSR
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Set initial value once mounted
    const media = window.matchMedia(query)
    setMatches(media.matches)

    // Define a callback function to handle changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add the callback as a listener
    media.addEventListener("change", listener)

    // Clean up
    return () => {
      media.removeEventListener("change", listener)
    }
  }, [query])

  return matches
}

