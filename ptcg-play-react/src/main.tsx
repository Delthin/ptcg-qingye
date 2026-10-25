import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/orbitron/latin-800.css'
import '@fontsource/urbanist/latin-600.css'
import '@fontsource/urbanist/latin-700.css'
import '@fontsource/urbanist/latin-800.css'
import '@fontsource/zcool-qingke-huangyou/chinese-simplified-400.css'
import './styles/fonts.css'
import './styles/design-system.css'
import './styles/arena.css'
import './index.css'
import './styles/game-effects.css'
import './components/twinleaf/twinleafTheme.css'
import './i18n/i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
