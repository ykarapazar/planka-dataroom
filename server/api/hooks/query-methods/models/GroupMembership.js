/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room.
 */

const defaultFind = (criteria) => GroupMembership.find(criteria).sort('id');

const createOne = (values) => GroupMembership.create({ ...values }).fetch();

const getByGroupId = (groupId) => defaultFind({ groupId });

const getByUserId = (userId) => defaultFind({ userId });

const getByGroupIds = (groupIds) => defaultFind({ groupId: groupIds });

const getOneByGroupIdAndUserId = (groupId, userId) =>
  GroupMembership.findOne({ groupId, userId });

const deleteOne = (criteria) => GroupMembership.destroyOne(criteria);

const delete_ = (criteria) => GroupMembership.destroy(criteria).fetch();

module.exports = {
  createOne,
  getByGroupId,
  getByUserId,
  getByGroupIds,
  getOneByGroupIdAndUserId,
  deleteOne,
  delete: delete_,
};
