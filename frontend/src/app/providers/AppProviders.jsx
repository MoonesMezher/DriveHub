import { Toaster } from 'sonner'
import { AuthProvider } from './AuthProvider'
import { QueryProvider } from './QueryProvider'

export const AppProviders = ({ children }) => (
  <QueryProvider>
    <AuthProvider>
      {children}
      <Toaster position="top-center" dir="rtl" richColors closeButton />
    </AuthProvider>
  </QueryProvider>
)
