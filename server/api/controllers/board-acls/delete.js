/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * DELETE /api/board-acls/:id — revoke a board ACL grant (admin only).
 */

const Errors = {
  NOT_FOUND: { notFound: 'Board ACL not found' },
};

module.exports = {
  inputs: {
    id: { type: 'string', required: true },
  },

  exits: {
    notFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const acl = await BoardAcl.qm.getOneById(inputs.id);
    if (!acl) throw 'notFound';

    await BoardAcl.qm.deleteOne({ id: acl.id });
    return { item: acl };
  },
};
