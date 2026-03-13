import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertProvider } from './context/AlertContext'
import { WatchedLocationsProvider } from './context/WatchedLocationsContext'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlertProvider>
      <WatchedLocationsProvider>
        <App />
      </WatchedLocationsProvider>
    </AlertProvider>
  </StrictMode>,
)
