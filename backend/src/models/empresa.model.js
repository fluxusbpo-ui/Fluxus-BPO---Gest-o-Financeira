const supabase = require('../supabaseClient');

async function createEmpresa({ id, razao_social, cnpj, telefone, email, owner_empresa_id }) {
  const { data, error } = await supabase
    .from('empresas')
    .insert({ id, razao_social, cnpj, telefone, email, owner_empresa_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getEmpresaById(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function listEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*');
  if (error) throw error;
  return data;
}

async function deleteEmpresa(id) {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

module.exports = { createEmpresa, getEmpresaById, listEmpresas, deleteEmpresa };
