import React from 'react';
import EmpresasForm from './components/EmpresasForm.jsx';
import EmpresasList from './components/EmpresasList.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App(){
  const { user, signOut } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#0f3b5a', fontSize: 28 }}>Cadastrar Nova Empresa</h1>
      </header>

      <main style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          {user ? <EmpresasForm /> : <div style={{ background:'#fff', padding:12, borderRadius:8 }}><h3>Faça login para gerenciar empresas</h3><Login/></div>}
          {!user && <div style={{ marginTop: 14 }}><h4>Ainda não tem conta?</h4><Register/></div>}
        </div>

        <aside style={{ width: 360 }}>
          {user && <EmpresasList />}
          {user && <div style={{ marginTop:10 }}><button onClick={()=>signOut()}>Sair</button></div>}
        </aside>
      </main>
    </div>
  );
}
