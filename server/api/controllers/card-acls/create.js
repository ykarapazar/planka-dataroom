/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * POST /api/cards/:cardId/card-acls — grant a user OR group access on a card.
 * Exactly one of userId / groupId must be provided.
 */

const Errors = {
  CARD_NOT_FOUND: { cardNotFound: 'Card not found' },
  GROUP_NOT_FOUND: { groupNotFound: 'Group not found' },
  USER_NOT_FOUND: { userNotFound: 'User not found' },
  XOR_VIOLATION: { xorViolation: 'Provide exactly one of userId or groupId' },
  DUPLICATE: { duplicate: 'ACL grant already exists' },
};

module.exports = {
  inputs: {
    cardId: { type: 'string', required: true },
    userId: { type: 'string' },
    groupId: { type: 'string' },
    level: {
      type: 'string',
      isIn: ['view', 'comment', 'edit'],
      required: true,
    },
  },

  exits: {
    cardNotFound: { responseType: 'notFound' },
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

    const card = await Card.qm.getOneById(inputs.cardId);
    if (!card) throw 'cardNotFound';

    if (inputs.userId) {
      const user = await User.qm.getOneById(inputs.userId);
      if (!user) throw 'userNotFound';
    } else {
      const group = await Group.qm.getOneById(inputs.groupId);
      if (!group) throw 'groupNotFound';
    }

    const existing = await CardAcl.find({
      cardId: card.id,
      userId: inputs.userId || null,
      groupId: inputs.groupId || null,
    });
    if (existing.length > 0) throw 'duplicate';

    const acl = await CardAcl.qm.createOne({
      cardId: card.id,
      userId: inputs.userId || null,
      groupId: inputs.groupId || null,
      level: inputs.level,
      createdByUserId: currentUser.id,
    });

    return { item: acl };
  },
};
