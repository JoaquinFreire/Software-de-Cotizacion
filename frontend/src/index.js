import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importar los estilos globales, incluyendo la barra de desplazamiento
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

