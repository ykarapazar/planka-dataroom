/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.2).
 *
 * Per-board ACL: each row references either a User OR a Group (CHECK XOR is
 * enforced at the SQL level by the migration). Additive to BoardMembership.
 */

const Levels = {
  VIEW: 'view',
  EDIT: 'edit',
  ADMIN: 'admin',
};

const LEVEL_RANKS = {
  [Levels.VIEW]: 1,
  [Levels.EDIT]: 3,
  [Levels.ADMIN]: 4,
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

    boardId: {
      model: 'Board',
      required: true,
      columnName: 'board_id',
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

  tableName: 'board_acl',
};
