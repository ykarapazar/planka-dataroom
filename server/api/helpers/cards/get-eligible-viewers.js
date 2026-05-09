/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.3, §6.6).
 *
 * Returns the set of userIds eligible to receive socket events for a card.
 * Used by helpers/sockets/broadcast-card.js to per-recipient filter
 * card-mutation broadcasts when the card has its own ACL.
 *
 * Union: admin users + project managers (for the card's project) + card
 * assignees + card subscribers + (if card_acls non-empty) explicit ACL
 * grantees (direct user grants + group-mediated grants).
 *
 * For cards with empty card_acls, also includes board members of the card's
 * board — those users would normally receive the board-room broadcast, so
 * including them here keeps fallback semantics correct when callers always
 * route through this helper.
 */

module.exports = {
  inputs: {
    cardId: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const card = await Card.qm.getOneById(inputs.cardId);
    if (!card) return [];

    const list = await List.qm.getOneById(card.listId);
    if (!list) return [];
    const board = await Board.qm.getOneById(list.boardId);
    if (!board) return [];

    const ids = new Set();

    // Admins: every active admin sees everything.
    const admins = await User.qm.getAll({
      roleOrRoles: [User.Roles.ADMIN],
      isDeactivated: false,
    });
    admins.forEach((u) => ids.add(u.id));

    // Project managers for this board's project.
    const managers = await ProjectManager.qm.getByProjectId(board.projectId);
    managers.forEach((m) => ids.add(m.userId));

    // Card assignees.
    const memberships = await CardMembership.qm.getByCardId(card.id);
    memberships.forEach((m) => ids.add(m.userId));

    // Card subscribers.
    const subs = await CardSubscription.qm.getByCardId(card.id);
    subs.forEach((s) => ids.add(s.userId));

    // ACL: if any card_acls exist, add explicit grantees (direct + group).
    const acls = await CardAcl.qm.getByCardId(card.id);
    if (acls.length === 0) {
      // Empty-ACL fast path: also include board members so fallback behavior
      // matches the original board-room broadcast.
      const boardMembers = await BoardMembership.qm.getByBoardId(board.id);
      boardMembers.forEach((bm) => ids.add(bm.userId));
    } else {
      const directUserIds = acls.filter((a) => a.userId).map((a) => a.userId);
      directUserIds.forEach((uid) => ids.add(uid));

      const groupIds = acls.filter((a) => a.groupId).map((a) => a.groupId);
      if (groupIds.length > 0) {
        const groupMembers = await GroupMembership.qm.getByGroupIds(groupIds);
        groupMembers.forEach((gm) => ids.add(gm.userId));
      }
    }

    return Array.from(ids);
  },
};
