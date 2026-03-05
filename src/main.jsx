import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx' // <--- Llama a App, no directamente al Login

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)