exports.up = function(knex) {
  return knex.schema.createTable('usuarios', function(t) {
    t.uuid('id').primary();
    t.uuid('empresa_id').references('id').inTable('empresas').onDelete('CASCADE');
    t.string('nome').notNullable();
    t.string('email').notNullable().unique();
    t.string('telefone');
    t.string('senha_hash');
    t.string('role'); // expected: 'master','admin','financeiro','comercial','compras'
    t.string('status').defaultTo('ativo');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('usuarios');
};
// Deprecated: this knex migration was replaced by SQL migrations in supabase/migrations.
exports.up = function(knex){
  console.warn('Deprecated: create_usuarios migration replaced by Supabase SQL.');
  return Promise.resolve();
}
exports.down = function(knex){
  console.warn('Deprecated: create_usuarios migration replaced by Supabase SQL.');
  return Promise.resolve();
}
