/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.3).
 *
 * ACL semantics (lean — see plan §6.1):
 *   admin / project manager → always true (assignment is invisible otherwise)
 *   empty card_acls         → board membership decides (open-within-board, like Trello default)
 *   non-empty card_acls     → require explicit user OR user-group grant at rank ≥ required
 *   ALWAYS                  → card assignees, subscribers, project managers, admins
 *                             see the card regardless. Mirror this in
 *                             `cards/get-eligible-viewers.js`.
 *
 * level ranks: view=1, comment=2, edit=3.
 */

module.exports = {
  sync: false,

  inputs: {
    userId: {
      type: 'string',
      required: true,
    },
    cardId: {
      type: 'string',
      required: true,
    },
    requiredLevel: {
      type: 'string',
      isIn: ['view', 'comment', 'edit'],
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const requiredRank = CardAcl.LEVEL_RANKS[inputs.requiredLevel];
    if (!requiredRank) {
      return false;
    }

    const user = await User.qm.getOneById(inputs.userId);
    if (!user || user.isDeactivated) {
      return false;
    }
    if (user.role === User.Roles.ADMIN) {
      return true;
    }

    const card = await Card.qm.getOneById(inputs.cardId);
    if (!card) {
      return false;
    }

    const list = await List.qm.getOneById(card.listId);
    if (!list) {
      return false;
    }

    // Project manager bypass.
    const board = await Board.qm.getOneById(list.boardId);
    if (!board) {
      return false;
    }
    const isManager = await sails.helpers.users.isProjectManager.with({
      id: user.id,
      projectId: board.projectId,
    });
    if (isManager) {
      return true;
    }

    // Always-allow set: card assignees and subscribers see the card.
    const assignment = await CardMembership.qm.getOneByCardIdAndUserId(card.id, user.id);
    if (assignment && requiredRank <= CardAcl.LEVEL_RANKS.comment) {
      return true;
    }
    const subscription = await CardSubscription.qm.getOneByCardIdAndUserId(card.id, user.id);
    if (subscription && requiredRank <= CardAcl.LEVEL_RANKS.view) {
      return true;
    }

    // Board-level access is a prerequisite for any card-level access. We need
    // at least 'view' on the board.
    const canViewBoard = await sails.helpers.users.canAccessBoard.with({
      userId: user.id,
      boardId: board.id,
      requiredLevel: 'view',
      request: inputs.request,
    });
    if (!canViewBoard) {
      return false;
    }

    // Empty-ACL fast path: card has no card_acls → board membership decides.
    const aclCount = await CardAcl.qm.countByCardId(card.id);
    if (aclCount === 0) {
      const membership = await BoardMembership.qm.getOneByBoardIdAndUserId(
        board.id,
        user.id,
      );
      if (membership) {
        if (membership.role === BoardMembership.Roles.EDITOR) {
          return true; // editor → all 3 levels
        }
        // viewer → view always; comment iff canComment; never edit
        if (requiredRank <= CardAcl.LEVEL_RANKS.view) return true;
        if (
          requiredRank === CardAcl.LEVEL_RANKS.comment &&
          membership.canComment === true
        ) {
          return true;
        }
        return false;
      }
      // Not a board member → no access via fast path.
      // canAccessBoard already returned true (e.g. via board_acls) so allow view-equivalent
      // up to the level held on the board for cards without their own ACL.
      const canEditBoard = await sails.helpers.users.canAccessBoard.with({
        userId: user.id,
        boardId: board.id,
        requiredLevel: 'edit',
        request: inputs.request,
      });
      if (canEditBoard) return true;
      return requiredRank <= CardAcl.LEVEL_RANKS.view;
    }

    // Non-empty card_acls: require explicit user or group grant.
    let bestRank = 0;

    const directGrants = await CardAcl.qm.getByCardIdAndUserId(card.id, user.id);
    for (const acl of directGrants) {
      bestRank = Math.max(bestRank, CardAcl.LEVEL_RANKS[acl.level] || 0);
      if (bestRank >= requiredRank) return true;
    }

    let groupIds;
    if (inputs.request && inputs.request._userGroupsCache) {
      groupIds = inputs.request._userGroupsCache;
    } else {
      groupIds = await sails.helpers.groups.getUserGroups.with({ userId: user.id });
      if (inputs.request) {
        inputs.request._userGroupsCache = groupIds;
      }
    }

    if (groupIds.length > 0) {
      const groupGrants = await CardAcl.qm.getByCardIdAndGroupIds(card.id, groupIds);
      for (const acl of groupGrants) {
        bestRank = Math.max(bestRank, CardAcl.LEVEL_RANKS[acl.level] || 0);
        if (bestRank >= requiredRank) return true;
      }
    }

    return false;
  },
};
