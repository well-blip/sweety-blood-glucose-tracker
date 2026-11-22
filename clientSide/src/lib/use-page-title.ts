import { useEffect } from 'react'

// Gives every page its own browser-tab title ("Reports · Sweety"). Screen readers announce it when
// the page changes, and people with many tabs open can tell which one is Sweety.
// (Taken from the Next.js accessibility guide: "ensure that each page has a unique and descriptive title".)
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Sweety`
  }, [title])
}
