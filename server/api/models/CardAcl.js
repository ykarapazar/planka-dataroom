/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.2).
 *
 * Per-card ACL with two-FK design (CHECK XOR). Lean semantics:
 *   empty card_acls → fall through to board membership (open-within-board)
 *   non-empty       → require an explicit user OR user-group grant at the
 *                     requested level, plus the always-allowed set
 *                     (assignees, subscribers, project managers, admins) per
 *                     get-eligible-viewers.js.
 */

const Levels = {
  VIEW: 'view',
  COMMENT: 'comment',
  EDIT: 'edit',
};

const LEVEL_RANKS = {
  [Levels.VIEW]: 1,
  [Levels.COMMENT]: 2,
  [Levels.EDIT]: 3,
};

module.exports = {
  Levels,
  LEVEL_RANKS,

  attributes: {
    level: {
      type: 'string',
      isIn: Object.values(Levels),
      required: true,
    },

    cardId: {
      model: 'Card',
      required: true,
      columnName: 'card_id',
    },
    userId: {
      model: 'User',
      columnName: 'user_id',
    },
    groupId: {
      model: 'Group',
      columnName: 'group_id',
    },
    createdByUserId: {
      model: 'User',
      columnName: 'created_by_user_id',
    },
  },

  tableName: 'card_acl',
};
