exports.up = function(knex) {
  return knex.schema.hasTable('email_tokens').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('email_tokens', function(t) {
        t.uuid('id').primary();
        t.uuid('user_id').references('id').inTable('usuarios').onDelete('CASCADE');
        t.string('token').notNullable().unique();
        t.timestamp('expires_at');
        t.boolean('used').defaultTo(false);
        t.timestamps(true, true);
      });
    }
  }).then(function(){
    return knex.schema.hasColumn('usuarios', 'email_confirmed').then(function(has){
      if (!has) {
        return knex.schema.alterTable('usuarios', function(t){
          t.boolean('email_confirmed').defaultTo(false);
        });
      }
    });
  });
};
// Deprecated: this knex migration was replaced by SQL migrations in supabase/migrations.
exports.up = function(knex){
  console.warn('Deprecated: add_email_tokens_and_flag migration replaced by Supabase SQL.');
  return Promise.resolve();
}
exports.down = function(knex){
  console.warn('Deprecated: add_email_tokens_and_flag migration replaced by Supabase SQL.');
  return Promise.resolve();
}
