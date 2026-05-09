/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.1).
 *
 * Per-board ACL with two-FK design: each row references either a user OR a
 * group (CHECK XOR enforces exactly one). BoardMembership remains the existing
 * Planka mechanism; board_acls is *additive* (max-of-grants wins).
 */

module.exports.up = async (knex) => {
  await knex.schema.createTable('board_acl', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('board_id').notNullable();
    table.bigInteger('user_id');
    table.bigInteger('group_id');

    table.text('level').notNullable(); // 'view' | 'edit' | 'admin'

    table.bigInteger('created_by_user_id');
    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.index('board_id');
    table.index(['user_id', 'level']);
    table.index(['group_id', 'level']);
    table.unique(['board_id', 'user_id', 'group_id']);
  });

  // Exactly one of user_id / group_id must be set.
  await knex.raw(`
    ALTER TABLE board_acl
      ADD CONSTRAINT board_acl_user_xor_group
      CHECK ((user_id IS NULL) <> (group_id IS NULL))
  `);
};

module.exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('board_acl');
};
