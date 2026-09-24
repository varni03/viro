import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Attach the login JWT to every request to the Viro API (the AI endpoints
// require it). One wrapper covers every fetch call site across the app.
const VIRO_API = 'https://viro1.vercel.app'
const rawFetch = window.fetch.bind(window)
window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : (input && input.url) || ''
  if (url.startsWith(VIRO_API)) {
    const token = localStorage.getItem('viro_token')
    if (token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined))
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
      init = { ...init, headers }
    }
  }
  return rawFetch(input, init)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
