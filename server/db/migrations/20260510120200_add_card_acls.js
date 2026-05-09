/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.1).
 *
 * Per-card ACL with two-FK design (CHECK XOR). Lean semantics:
 *   - empty card_acls for a card → fall through to board membership
 *     (open-within-board, like a normal Trello card)
 *   - non-empty card_acls → require an explicit user OR user-group grant at
 *     the requested level, plus the always-allowed set (assignees,
 *     subscribers, project managers, admins) per get-eligible-viewers.js
 */

module.exports.up = async (knex) => {
  await knex.schema.createTable('card_acl', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('user_id');
    table.bigInteger('group_id');

    table.text('level').notNullable(); // 'view' | 'comment' | 'edit'

    table.bigInteger('created_by_user_id');
    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.index('card_id');
    table.index(['user_id', 'level']);
    table.index(['group_id', 'level']);
    table.unique(['card_id', 'user_id', 'group_id']);
  });

  await knex.raw(`
    ALTER TABLE card_acl
      ADD CONSTRAINT card_acl_user_xor_group
      CHECK ((user_id IS NULL) <> (group_id IS NULL))
  `);
};

module.exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('card_acl');
};
