/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * DELETE /api/group-memberships/:id — remove a user from a group (admin only).
 */

const Errors = {
  NOT_FOUND: { notFound: 'Group membership not found' },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    notFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const membership = await GroupMembership.findOne({ id: inputs.id });
    if (!membership) throw 'notFound';

    await GroupMembership.qm.deleteOne({ id: membership.id });

    return { item: membership };
  },
};
