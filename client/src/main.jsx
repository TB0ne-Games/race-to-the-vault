import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx is executing');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
