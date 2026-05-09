/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * POST /api/groups/:groupId/group-memberships — add a user to a group (admin only).
 */

const Errors = {
  GROUP_NOT_FOUND: { groupNotFound: 'Group not found' },
  USER_NOT_FOUND: { userNotFound: 'User not found' },
  ALREADY_MEMBER: { alreadyMember: 'User is already a member of this group' },
};

module.exports = {
  inputs: {
    groupId: {
      type: 'string',
      required: true,
    },
    userId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    groupNotFound: { responseType: 'notFound' },
    userNotFound: { responseType: 'notFound' },
    alreadyMember: { responseType: 'conflict' },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const group = await Group.qm.getOneById(inputs.groupId);
    if (!group) throw 'groupNotFound';

    const user = await User.qm.getOneById(inputs.userId);
    if (!user) throw 'userNotFound';

    const existing = await GroupMembership.qm.getOneByGroupIdAndUserId(group.id, user.id);
    if (existing) throw 'alreadyMember';

    const membership = await GroupMembership.qm.createOne({
      groupId: group.id,
      userId: user.id,
      addedByUserId: currentUser.id,
    });

    return { item: membership };
  },
};
