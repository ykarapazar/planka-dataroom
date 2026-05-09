/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * GET /api/groups/:groupId/group-memberships — list memberships of a group.
 */

const Errors = {
  GROUP_NOT_FOUND: { groupNotFound: 'Group not found' },
};

module.exports = {
  inputs: {
    groupId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    groupNotFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const group = await Group.qm.getOneById(inputs.groupId);
    if (!group) throw 'groupNotFound';

    const memberships = await GroupMembership.qm.getByGroupId(group.id);
    const userIds = memberships.map((m) => m.userId);
    const users = userIds.length > 0 ? await User.qm.getByIds(userIds) : [];

    return {
      items: memberships,
      included: { users: users.map((u) => sails.helpers.users.presentOne(u)) },
    };
  },
};
