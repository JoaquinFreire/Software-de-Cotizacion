import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { QuotationProvider } from './context/QuotationContext';
import { UserProvider } from './context/UserContext'; // Importar el UserProvider

// eslint-disable-next-line no-console
console.warn = (msg, ...args) => {
  if (
    typeof msg === 'string' &&
    msg.includes('Failed to parse source map from') &&
    msg.includes('html2pdf.js')
  ) {
    return;
  }
  // eslint-disable-next-line prefer-rest-params
  return Function.prototype.apply.call(console.warn, console, [msg, ...args]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <UserProvider>
      <QuotationProvider>
        <App />
      </QuotationProvider>
    </UserProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

