import React, { useEffect, useState } from 'react';
import { useEmpresas } from '../context/EmpresasContext.jsx';

export default function EmpresasForm(){
  const { empresaSelecionada, salvarEmpresa, novaEmpresaBase } = useEmpresas();
  const [form, setForm] = useState(novaEmpresaBase());

  useEffect(() => {
    if (empresaSelecionada) setForm(empresaSelecionada);
    else setForm(novaEmpresaBase());
  }, [empresaSelecionada]);

  function handleChange(e){
    const { name, value } = e.target;
    if (name.includes('.')){
      const [root, child] = name.split('.');
      setForm(prev => ({ ...prev, [root]: { ...(prev[root]||{}), [child]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  async function onSave(e){
    e.preventDefault();
    await salvarEmpresa(form);
  }

  return (
    <form onSubmit={onSave} style={{background:'#fff',padding:12,borderRadius:8,border:'1px solid #eee'}}>
      <div style={{marginBottom:8}}>
        <label>CNPJ</label>
        <input name="cnpj" value={form.cnpj||''} onChange={handleChange} />
      </div>

      <div style={{marginBottom:8}}>
        <label>Razão Social</label>
        <input name="razao" value={form.razao||''} onChange={handleChange} style={{ width:'60%' }} />
      </div>

      <div style={{display:'flex',gap:10,marginBottom:10}}>
        <div style={{flex:1}}>
          <label>Nome Fantasia</label>
          <input name="nomeFantasia" value={form.nomeFantasia||''} onChange={handleChange} />
        </div>

        <div style={{width:180}}>
          <label>Data de Abertura</label>
          <input name="dataAbertura" value={form.dataAbertura||''} onChange={handleChange} placeholder="dd/mm/aaaa" />
        </div>
      </div>

      <fieldset style={{ padding:12, background:'#f0f8ff', borderRadius:6 }}>
        <legend>Endereço</legend>
        <div style={{ display:'flex', gap:10 }}>
          <input name="endereco.cep" value={form.endereco?.cep||''} onChange={handleChange} placeholder="CEP" />
          <input name="endereco.logradouro" value={form.endereco?.logradouro||''} onChange={handleChange} placeholder="Logradouro" style={{ flex:1 }} />
        </div>

        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <input name="endereco.numero" value={form.endereco?.numero||''} onChange={handleChange} placeholder="Número" />
          <input name="endereco.complemento" value={form.endereco?.complemento||''} onChange={handleChange} placeholder="Complemento" style={{ flex:1 }} />
        </div>

        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <input name="endereco.bairro" value={form.endereco?.bairro||''} onChange={handleChange} placeholder="Bairro" style={{ flex:1 }} />
          <input name="endereco.municipio" value={form.endereco?.municipio||''} onChange={handleChange} placeholder="Município" style={{ flex:1 }} />
          <input name="endereco.uf" value={form.endereco?.uf||''} onChange={handleChange} placeholder="UF" style={{ width:80 }} />
        </div>
      </fieldset>

      <div style={{ marginTop: 14 }}>
        <button type="submit">Salvar</button>
        <button type="button" onClick={() => { setForm(novaEmpresaBase()); }}>Limpar</button>
      </div>
    </form>
  );
}
