/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room.
 */

const defaultFind = (criteria) => CardAcl.find(criteria).sort('id');

const createOne = (values) => CardAcl.create({ ...values }).fetch();

const getByCardId = (cardId) => defaultFind({ cardId });

const getByCardIds = (cardIds) =>
  cardIds.length === 0 ? Promise.resolve([]) : defaultFind({ cardId: cardIds });

const getByCardIdAndUserId = (cardId, userId) => defaultFind({ cardId, userId });

const getByCardIdAndGroupIds = (cardId, groupIds) =>
  groupIds.length === 0 ? Promise.resolve([]) : defaultFind({ cardId, groupId: groupIds });

const countByCardId = async (cardId) => CardAcl.count({ cardId });

const getOneById = (id) => CardAcl.findOne(id);

const deleteOne = (criteria) => CardAcl.destroyOne(criteria);

const delete_ = (criteria) => CardAcl.destroy(criteria).fetch();

module.exports = {
  createOne,
  getByCardId,
  getByCardIds,
  getByCardIdAndUserId,
  getByCardIdAndGroupIds,
  countByCardId,
  getOneById,
  deleteOne,
  delete: delete_,
};
