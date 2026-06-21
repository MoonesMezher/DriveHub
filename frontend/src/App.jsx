import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

const App = () => (
  <AppProviders>
    <ScrollToTop />
    <AppRouter />
  </AppProviders>
)

export default App
