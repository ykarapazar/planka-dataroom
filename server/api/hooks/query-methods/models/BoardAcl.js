/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room.
 */

const defaultFind = (criteria) => BoardAcl.find(criteria).sort('id');

const createOne = (values) => BoardAcl.create({ ...values }).fetch();

const getByBoardId = (boardId) => defaultFind({ boardId });

const getByUserId = (userId) => defaultFind({ userId });

const getByGroupIds = (groupIds) =>
  groupIds.length === 0 ? Promise.resolve([]) : defaultFind({ groupId: groupIds });

const getByBoardIdAndUserId = (boardId, userId) => defaultFind({ boardId, userId });

const getByBoardIdAndGroupIds = (boardId, groupIds) =>
  groupIds.length === 0 ? Promise.resolve([]) : defaultFind({ boardId, groupId: groupIds });

const getOneById = (id) => BoardAcl.findOne(id);

const deleteOne = (criteria) => BoardAcl.destroyOne(criteria);

module.exports = {
  createOne,
  getByBoardId,
  getByUserId,
  getByGroupIds,
  getByBoardIdAndUserId,
  getByBoardIdAndGroupIds,
  getOneById,
  deleteOne,
};
