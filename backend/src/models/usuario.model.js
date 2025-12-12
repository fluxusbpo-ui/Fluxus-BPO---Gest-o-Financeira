const supabase = require('../supabaseClient');

async function createUsuario(obj) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert(obj)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getUsuarioById(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = { createUsuario, findByEmail, getUsuarioById };
