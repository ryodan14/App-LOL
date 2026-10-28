import '@fontsource-variable/inter/index.css'
import '@fontsource-variable/space-grotesk/index.css'
import './styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { OverlayRoot } from './overlay/OverlayApp'

document.documentElement.classList.add('overlay-mode')
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <OverlayRoot />
  </StrictMode>
)
