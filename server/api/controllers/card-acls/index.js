/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * GET /api/cards/:cardId/card-acls — list ACL grants on a card.
 */

const Errors = {
  CARD_NOT_FOUND: { cardNotFound: 'Card not found' },
};

module.exports = {
  inputs: {
    cardId: { type: 'string', required: true },
  },

  exits: {
    cardNotFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const card = await Card.qm.getOneById(inputs.cardId);
    if (!card) throw 'cardNotFound';

    const acls = await CardAcl.qm.getByCardId(card.id);
    return { items: acls };
  },
};
