import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login(){
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [status, setStatus] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setStatus('Entrando...');
    try{
      await signIn({ email, password: senha });
      setStatus('Ok! Redirecionando...');
      window.location.href = '/system.html';
    } catch(err){
      console.error(err);
      setStatus(err.message || 'Falha no login');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" value={senha} onChange={e=>setSenha(e.target.value)} /></label>
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-primary" type="submit">Entrar</button>
        <a className="btn btn-outline" href="/index.html">Voltar</a>
      </div>
      <div style={{ color: status.includes('Falha') ? 'crimson' : 'green', fontWeight:600 }}>{status}</div>
    </form>
  );
}
