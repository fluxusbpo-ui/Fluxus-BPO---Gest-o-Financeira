import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { EmpresasProvider } from './context/EmpresasContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const el = document.getElementById('root');
  if (el) {
  const root = createRoot(el);
  root.render(
      <AuthProvider>
        <EmpresasProvider>
          <App />
        </EmpresasProvider>
      </AuthProvider>
  );
} else {
  console.warn('Elemento #root não encontrado. Verifique companies-new.html');
}

