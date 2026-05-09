/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.6).
 *
 * Per-recipient socket broadcast for card-mutation events. When the card has
 * its own ACL (card_acls non-empty), the event is emitted to per-`user:<id>`
 * rooms instead of the public `board:<id>` room. Empty-ACL fast path keeps
 * the common case cheap (single broadcast).
 *
 * Server-side socket join: clients are subscribed to `user:<id>` on
 * access-tokens/create.js (see plan §6.6 patch). The client-side socket saga
 * keys handlers off event NAME, not room name, so the existing handler picks
 * up the per-user emission with no client-side change needed.
 */

module.exports = {
  inputs: {
    cardId: {
      type: 'string',
      required: true,
    },
    boardId: {
      type: 'string',
      required: true,
    },
    eventName: {
      type: 'string',
      required: true,
    },
    payload: {
      type: 'json',
    },
  },

  async fn(inputs) {
    const aclCount = await CardAcl.qm.countByCardId(inputs.cardId);

    // Empty-ACL fast path: behave exactly like the unmodified Planka.
    if (aclCount === 0) {
      sails.sockets.broadcast(
        `board:${inputs.boardId}`,
        inputs.eventName,
        inputs.payload,
      );
      return;
    }

    // Non-empty ACL: per-recipient broadcast.
    const eligibleUserIds = await sails.helpers.cards.getEligibleViewers.with({
      cardId: inputs.cardId,
    });
    eligibleUserIds.forEach((userId) => {
      sails.sockets.broadcast(`user:${userId}`, inputs.eventName, inputs.payload);
    });
  },
};
