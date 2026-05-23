import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { initScrollbar } from './utils/scrollbar.js'
import App from './App.jsx'

initScrollbar()
import Landing from './Landing.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'
import TermsOfService from './TermsOfService.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/new" element={<Navigate to="/documents" state={{ createNew: true }} replace />} />
        <Route path="/documents" element={<App />} />
        <Route path="/documents/:docId" element={<App />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
