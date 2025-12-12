import React from 'react';
import { useEmpresas } from '../context/EmpresasContext.jsx';

export default function EmpresasList(){
  const { empresas, selecionarEmpresa, removerEmpresa, duplicarEmpresa, carregando } = useEmpresas();

  if (carregando) return <div>Carregando empresas...</div>;
  if (!empresas || empresas.length === 0) return <div>Nenhuma empresa cadastrada.</div>;

  return (
    <div style={{ background:'#fff', padding:12, borderRadius:8 }}>
      <h3>Empresas</h3>
      <ul style={{ listStyle:'none', padding:0, margin:0 }}>
        {empresas.map(e => (
          <li key={e.id} style={{ borderBottom:'1px solid #f4f6f8', padding:'8px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700 }}>{e.nomeFantasia || e.razao_social || '—'}</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>{e.cnpj || ''}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => selecionarEmpresa(e.id)}>Editar</button>
              <button onClick={() => duplicarEmpresa(e.id)}>Duplicar</button>
              <button onClick={() => removerEmpresa(e.id)}>Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
