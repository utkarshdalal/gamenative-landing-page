import { useEffect, useState } from 'react'
import { searchGames } from '@/utils/api'
import { useDebounced } from '@/hooks/use-debounced'
import type { GameSuggestion } from '@/types/api'

interface UseGameSuggestionsReturn {
  suggestions: GameSuggestion[]
  loading: boolean
}

/** Debounced game search with automatic abort on query change / unmount. */
export function useGameSuggestions(query: string): UseGameSuggestionsReturn {
  const debouncedQuery = useDebounced(query, 300)
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const ac = new AbortController()
    setLoading(true)

    searchGames(debouncedQuery, ac.signal)
      .then(({ games }) => {
        if (!ac.signal.aborted) {
          setSuggestions(games)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setSuggestions([])
          setLoading(false)
        }
      })

    return () => ac.abort()
  }, [debouncedQuery])

  return { suggestions, loading }
}
