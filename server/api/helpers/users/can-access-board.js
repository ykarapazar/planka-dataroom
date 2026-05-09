/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.3).
 *
 * Decides whether `user` may access `board` at `requiredLevel`. ACL semantics:
 *
 *   admin           → always true (no further checks)
 *   project manager → always true
 *   board member    → grants 'view'+'edit' depending on BoardMembership.role
 *                     ('editor' → edit; 'viewer' → view, plus comment if
 *                     canComment is true)
 *   board_acls      → ADDITIVE (max-of-grants wins). User-direct grants AND
 *                     group-mediated grants are unioned with BoardMembership
 *                     rights; the highest rank held wins.
 *
 * level ranks: view=1, edit=3, admin=4. requiredLevel must be a key from
 * BoardAcl.LEVEL_RANKS.
 */

module.exports = {
  sync: false,

  inputs: {
    userId: {
      type: 'string',
      required: true,
    },
    boardId: {
      type: 'string',
      required: true,
    },
    requiredLevel: {
      type: 'string',
      isIn: ['view', 'edit', 'admin'],
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const requiredRank = BoardAcl.LEVEL_RANKS[inputs.requiredLevel];
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

    // Project-manager bypass: scope to the project this board belongs to.
    const board = await Board.qm.getOneById(inputs.boardId);
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

    let bestRank = 0;

    // BoardMembership grant (existing Planka model — additive).
    const membership = await BoardMembership.qm.getOneByBoardIdAndUserId(
      board.id,
      user.id,
    );
    if (membership) {
      if (membership.role === BoardMembership.Roles.EDITOR) {
        bestRank = Math.max(bestRank, BoardAcl.LEVEL_RANKS.edit);
      } else {
        bestRank = Math.max(bestRank, BoardAcl.LEVEL_RANKS.view);
      }
      if (bestRank >= requiredRank) {
        return true;
      }
    }

    // Direct user grants on this board.
    const directGrants = await BoardAcl.qm.getByBoardIdAndUserId(board.id, user.id);
    for (const acl of directGrants) {
      bestRank = Math.max(bestRank, BoardAcl.LEVEL_RANKS[acl.level] || 0);
      if (bestRank >= requiredRank) {
        return true;
      }
    }

    // Group grants on this board (per-request cache).
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
      const groupGrants = await BoardAcl.qm.getByBoardIdAndGroupIds(board.id, groupIds);
      for (const acl of groupGrants) {
        bestRank = Math.max(bestRank, BoardAcl.LEVEL_RANKS[acl.level] || 0);
        if (bestRank >= requiredRank) {
          return true;
        }
      }
    }

    return false;
  },
};
