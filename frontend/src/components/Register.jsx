import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register(){
  const { signUp } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [status, setStatus] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    if (senha !== senha2) { setStatus('Senhas não conferem'); return; }
    try{
      setStatus('Criando...');
      await signUp({ email, password: senha, options: { data: { nome } } });
      setStatus('Usuário criado — confirme seu e-mail se necessário.');
    } catch(err){
      console.error(err);
      setStatus(err.message || 'Erro ao criar usuário');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ background:'#fff', padding:12, borderRadius:8 }}>
      <label>Nome<input value={nome} onChange={e => setNome(e.target.value)} /></label>
      <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" value={senha} onChange={e => setSenha(e.target.value)} /></label>
      <label>Confirmar senha<input type="password" value={senha2} onChange={e => setSenha2(e.target.value)} /></label>
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button className="btn btn-primary" type="submit">Criar</button>
      </div>
      <div style={{ marginTop:8, color: status.includes('Erro') ? 'crimson' : 'green' }}>{status}</div>
    </form>
  );
}
