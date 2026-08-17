import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
