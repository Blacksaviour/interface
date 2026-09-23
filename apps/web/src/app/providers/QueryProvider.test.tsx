import { describe, expect, it } from 'vitest'
import { queryClient } from './QueryProvider'

describe('QueryProvider queryClient configuration', () => {
  it('should have the correct defaults configured', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    
    // Assert stale time
    expect(defaultOptions.queries?.staleTime).toBe(30000)
    
    // Assert refetch defaults
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true)
    
    // Assert retry default (implicitly 3 in react-query, but undefined here unless explicitly set)
    expect(defaultOptions.queries?.retry).toBeUndefined()
    
    // Assert error handling config (meta silent is used to bypass global errors)
    expect(defaultOptions.queries?.meta).toEqual({ silent: true })
  })
})
