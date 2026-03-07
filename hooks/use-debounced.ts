import { useEffect, useState } from 'react'

export function useDebounced<T>(value: T, delay = 250): T {
  const [val, setVal] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setVal(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return val
}
