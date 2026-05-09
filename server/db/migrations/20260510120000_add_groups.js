/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.1).
 *
 * Adds first-class user groups so board/card ACLs can grant access to a group
 * rather than naming individual users.
 */

module.exports.up = async (knex) => {
  await knex.schema.createTable('group', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.text('name').notNullable();
    table.text('description');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.unique(['name']);
  });

  await knex.schema.createTable('group_membership', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('group_id').notNullable();
    table.bigInteger('user_id').notNullable();
    table.bigInteger('added_by_user_id');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.unique(['group_id', 'user_id']);
    table.index('user_id');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('group_membership');
  await knex.schema.dropTableIfExists('group');
};
