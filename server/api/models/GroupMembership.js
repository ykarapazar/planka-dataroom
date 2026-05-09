/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §3, §6.2).
 *
 * Joins Group ↔ User. addedByUserId records who added the user (admin only).
 */

module.exports = {
  attributes: {
    groupId: {
      model: 'Group',
      required: true,
      columnName: 'group_id',
    },
    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
    },
    addedByUserId: {
      model: 'User',
      columnName: 'added_by_user_id',
    },
  },

  tableName: 'group_membership',
};
