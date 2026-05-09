/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * DELETE /api/groups/:id — delete a group + cascade memberships and ACL rows
 * referencing it (admin only via policies.js).
 */

const Errors = {
  GROUP_NOT_FOUND: { groupNotFound: 'Group not found' },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    groupNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const group = await Group.qm.getOneById(inputs.id);
    if (!group) {
      throw 'groupNotFound';
    }

    await GroupMembership.qm.delete({ groupId: group.id });
    await BoardAcl.destroy({ groupId: group.id });
    await CardAcl.destroy({ groupId: group.id });
    await Group.qm.deleteOne({ id: group.id });

    return { item: group };
  },
};
