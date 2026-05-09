/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room.
 */

const defaultFind = (criteria) => Group.find(criteria).sort('name');

const createOne = (values) => Group.create({ ...values }).fetch();

const getAll = () => defaultFind({});

const getByIds = (ids) => defaultFind({ id: ids });

const getOneById = (id) => Group.findOne(id);

const getOneByName = (name) => Group.findOne({ name });

const updateOne = (criteria, values) => Group.updateOne(criteria).set({ ...values });

const deleteOne = (criteria) => Group.destroyOne(criteria);

module.exports = {
  createOne,
  getAll,
  getByIds,
  getOneById,
  getOneByName,
  updateOne,
  deleteOne,
};
