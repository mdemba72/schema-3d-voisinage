import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-600.css'
import '@fontsource/public-sans/latin-400.css'
import '@fontsource/public-sans/latin-600.css'
import './styles.css'
import App from './App'

const racine = document.getElementById('root')
if (!racine) throw new Error('Élément #root absent de index.html')

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
