/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §3, §6.2).
 *
 * First-class user group used as an ACL subject on board_acls and card_acls.
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true,
      maxLength: 128,
    },
    description: {
      type: 'string',
      allowNull: true,
    },
  },

  tableName: 'group',
};
