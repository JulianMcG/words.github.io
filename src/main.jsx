import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import { initScrollbar } from './utils/scrollbar.js'
import { initLisse } from './utils/lisse.js'
import App from './App.jsx'

initScrollbar()
initLisse()
import Landing from './Landing.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'
import TermsOfService from './TermsOfService.jsx'
import NotFound from './NotFound.jsx'

// SPA navigation keeps the window scroll position, so clicking a footer link
// at the bottom of the landing page would open /privacy mid-document.
function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Restore the path GitHub Pages' 404.html redirect encoded, so a direct
// navigation to e.g. /privacy lands on the right route instead of "/".
const redirect = new URLSearchParams(window.location.search).get('redirect')
if (redirect) {
  window.history.replaceState(null, '', redirect)
}

// Cache the root on the container: if HMR ever re-executes this entry module,
// reuse the existing root instead of calling createRoot twice.
const container = document.getElementById('root')
const root = container._reactRoot ?? (container._reactRoot = createRoot(container))
root.render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/new" element={<Navigate to="/documents" state={{ createNew: true }} replace />} />
        <Route path="/documents" element={<App />} />
        <Route path="/documents/:docId" element={<App />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
