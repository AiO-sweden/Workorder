import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/shared/animations.css';
// import 'jspdf-autotable'; // No longer needed here as it's imported directly in ReportsPage
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'; // ✅ Importera Router

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Lägg till BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
