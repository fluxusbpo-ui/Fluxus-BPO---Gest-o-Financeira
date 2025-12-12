// Deprecated: this knex migration was replaced by SQL migrations in supabase/migrations.
// Keep this file for historical reference; don't run knex migrations for Supabase.
exports.up = function(knex){
  console.warn('Deprecated: create_empresas migration replaced by Supabase SQL.');
  return Promise.resolve();
}
exports.down = function(knex){
  console.warn('Deprecated: create_empresas migration replaced by Supabase SQL.');
  return Promise.resolve();
}

