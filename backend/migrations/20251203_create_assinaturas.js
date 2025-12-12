exports.up = function(knex) {
  return knex.schema.createTable('assinaturas', function(t) {
    t.uuid('id').primary();
    t.uuid('empresa_id').references('id').inTable('empresas').onDelete('CASCADE');
    t.uuid('plano_id').references('id').inTable('planos');
    t.string('stripe_subscription_id');
    t.string('status');
    t.timestamp('inicio');
    t.timestamp('fim');
    t.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('assinaturas');
};
// Deprecated: this knex migration was replaced by SQL migrations in supabase/migrations.
exports.up = function(knex){
  console.warn('Deprecated: create_assinaturas migration replaced by Supabase SQL.');
  return Promise.resolve();
}
exports.down = function(knex){
  console.warn('Deprecated: create_assinaturas migration replaced by Supabase SQL.');
  return Promise.resolve();
}
