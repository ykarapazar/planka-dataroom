/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * DELETE /api/card-acls/:id — revoke a card ACL grant (admin only).
 */

const Errors = {
  NOT_FOUND: { notFound: 'Card ACL not found' },
};

module.exports = {
  inputs: {
    id: { type: 'string', required: true },
  },

  exits: {
    notFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const acl = await CardAcl.qm.getOneById(inputs.id);
    if (!acl) throw 'notFound';

    await CardAcl.qm.deleteOne({ id: acl.id });
    return { item: acl };
  },
};
