import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabaseClient.js';
import { useAuth } from './AuthContext.jsx';

const EmpresasContext = createContext(null);

export function EmpresasProvider({ children }){
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);

  function novaEmpresaBase(){
    return {
      id: uuidv4(),
      nomeFantasia: '',
      razao: '',
      cnpj: '',
      email: '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        municipio: '',
        uf: ''
      }
    };
  }

  const { user } = useAuth();

  async function fetchEmpresas(){
    setCarregando(true);
    let q = supabase.from('empresas').select('*');
    if (user && user.id) q = q.eq('owner_empresa_id', user.id);
    const { data, error } = await q;
    if (error) {
      console.error('Erro ao buscar empresas', error);
      setCarregando(false);
      return;
    }
    setEmpresas(data || []);
    setCarregando(false);
  }

  useEffect(()=>{ fetchEmpresas(); },[]);

  async function salvarEmpresa(data){
    setCarregando(true);
    const exists = empresas.find(e => e.id === data.id);
    if (!exists) {
      if (!data.id) data.id = uuidv4();
      // map form fields to database columns
      const payload = {
        id: data.id,
        razao_social: data.razao || data.razao_social || '',
        cnpj: String(data.cnpj || '').replace(/\D/g, ''),
        telefone: data.telefone || null,
        email: data.email || null,
        owner_empresa_id: user && user.id ? user.id : null,
        data: {
          nome_fantasia: data.nomeFantasia || data.nome_fantasia || null,
          endereco: data.endereco || null,
          dataAbertura: data.dataAbertura || null
        }
      };
      const { data: inserted, error } = await supabase.from('empresas').insert(payload).select().single();
      if (error) { console.error('Erro insert empresa', error); setCarregando(false); return; }
      setEmpresas(prev => [inserted, ...prev]);
    } else {
      const id = data.id;
      const payload = {
        razao_social: data.razao || data.razao_social || undefined,
        cnpj: data.cnpj ? String(data.cnpj).replace(/\D/g,'') : undefined,
        telefone: data.telefone !== undefined ? (data.telefone || null) : undefined,
        email: data.email !== undefined ? (data.email || null) : undefined,
        data: data.data !== undefined ? data.data : undefined
      };
      const { data: updated, error } = await supabase.from('empresas').update(payload).eq('id', id).select().single();
      if (error) { console.error('Erro update empresa', error); setCarregando(false); return; }
      setEmpresas(prev => prev.map(e => e.id === id ? updated : e));
    }
    setEmpresaSelecionada(null);
    setCarregando(false);
  }

  function selecionarEmpresa(id){
    const e = empresas.find(x => x.id === id);
    setEmpresaSelecionada(e ? {...e} : null);
  }

  function limparSelecao(){ setEmpresaSelecionada(null); }

  async function removerEmpresa(id){
    setCarregando(true);
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) { console.error('Erro removendo empresa', error); setCarregando(false); return; }
    setEmpresas(prev => prev.filter(e => e.id !== id));
    if (empresaSelecionada?.id === id) setEmpresaSelecionada(null);
    setCarregando(false);
  }

  async function duplicarEmpresa(id){
    const e = empresas.find(x => x.id === id);
    if (!e) return;
    const copy = { ...e, id: uuidv4(), nomeFantasia: e.nomeFantasia + ' (cópia)' };
    // insert in supabase
    const { data, error } = await supabase.from('empresas').insert(copy).select().single();
    if (error) { console.error('Erro duplicando empresa', error); return; }
    setEmpresas(prev => [data, ...prev]);
  }

  return (
    <EmpresasContext.Provider value={{
      empresas,
      empresaSelecionada,
      carregando,
      salvarEmpresa,
      selecionarEmpresa,
      limparSelecao,
      removerEmpresa,
      duplicarEmpresa,
      novaEmpresaBase
    }}>
      {children}
    </EmpresasContext.Provider>
  );
}

export function useEmpresas(){
  const ctx = useContext(EmpresasContext);
  if (!ctx) throw new Error('useEmpresas must be used inside EmpresasProvider');
  return ctx;
}

