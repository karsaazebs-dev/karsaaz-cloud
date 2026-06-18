import { useEffect, useState } from 'react'
import { isCurrentUserAdmin } from '../services/nextcloud'

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    isCurrentUserAdmin()
      .then(setIsAdmin)
      .finally(() => setLoading(false))
  }, [])

  return { isAdmin, loading }
}
