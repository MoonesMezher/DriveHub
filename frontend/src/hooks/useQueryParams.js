import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value === undefined || value === null || value === '') {
      next.delete(key)
    } else {
      next.set(key, String(value))
    }
    setSearchParams(next)
  }

  return { params, setParam, setSearchParams }
}
