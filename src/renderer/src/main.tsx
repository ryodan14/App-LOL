import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/space-grotesk/index.css'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { OverlayRoot } from './overlay/OverlayApp'

const overlay = new URLSearchParams(window.location.search).get('overlay') === '1'
const root = createRoot(document.getElementById('root') as HTMLElement)

if (overlay) {
  document.documentElement.classList.add('overlay-mode')
  root.render(
    <StrictMode>
      <OverlayRoot />
    </StrictMode>
  )
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
