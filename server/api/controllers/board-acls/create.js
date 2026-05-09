/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * POST /api/boards/:boardId/board-acls — grant a user OR group access at a level.
 * Exactly one of userId / groupId must be provided.
 */

const Errors = {
  BOARD_NOT_FOUND: { boardNotFound: 'Board not found' },
  GROUP_NOT_FOUND: { groupNotFound: 'Group not found' },
  USER_NOT_FOUND: { userNotFound: 'User not found' },
  XOR_VIOLATION: { xorViolation: 'Provide exactly one of userId or groupId' },
  DUPLICATE: { duplicate: 'ACL grant already exists' },
};

module.exports = {
  inputs: {
    boardId: { type: 'string', required: true },
    userId: { type: 'string' },
    groupId: { type: 'string' },
    level: {
      type: 'string',
      isIn: ['view', 'edit', 'admin'],
      required: true,
    },
  },

  exits: {
    boardNotFound: { responseType: 'notFound' },
    groupNotFound: { responseType: 'notFound' },
    userNotFound: { responseType: 'notFound' },
    xorViolation: { responseType: 'unprocessableEntity' },
    duplicate: { responseType: 'conflict' },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    if ((inputs.userId == null) === (inputs.groupId == null)) {
      throw 'xorViolation';
    }

    const board = await Board.qm.getOneById(inputs.boardId);
    if (!board) throw 'boardNotFound';

    if (inputs.userId) {
      const user = await User.qm.getOneById(inputs.userId);
      if (!user) throw 'userNotFound';
    } else {
      const group = await Group.qm.getOneById(inputs.groupId);
      if (!group) throw 'groupNotFound';
    }

    const existing = await BoardAcl.find({
      boardId: board.id,
      userId: inputs.userId || null,
      groupId: inputs.groupId || null,
    });
    if (existing.length > 0) throw 'duplicate';

    const acl = await BoardAcl.qm.createOne({
      boardId: board.id,
      userId: inputs.userId || null,
      groupId: inputs.groupId || null,
      level: inputs.level,
      createdByUserId: currentUser.id,
    });

    return { item: acl };
  },
};
