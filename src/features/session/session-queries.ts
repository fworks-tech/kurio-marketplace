import { queryOptions, useQuery } from '@tanstack/react-query'
import { authService } from '@/shared/services'
import { queryKeys } from '@/shared/lib/query-client'
import { ApiError } from '@/shared/api/api-error'

export function getSessionQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      try {
        return await authService.getSession({ signal })
      } catch (error) {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          return null
        }
        throw error
      }
    },
    retry: false
  })
}

export function useSession() {
  return useQuery(getSessionQueryOptions())
}

