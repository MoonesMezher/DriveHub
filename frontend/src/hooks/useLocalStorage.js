import { useCallback, useState } from 'react'
import { storage } from '@/lib/helpers/storage'

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => storage.get(key, initialValue))

  const setStored = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        storage.set(key, resolved)
        return resolved
      })
    },
    [key],
  )

  const remove = useCallback(() => {
    storage.remove(key)
    setValue(initialValue)
  }, [key, initialValue])

  return [value, setStored, remove]
}
