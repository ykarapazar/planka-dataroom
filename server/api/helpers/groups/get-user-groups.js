/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.3).
 *
 * Returns group IDs the given user is a member of. The caller is expected to
 * cache this on the request via `req._userGroupsCache` to avoid N+1 lookups
 * when filtering large card lists (see plan §6.4).
 */

module.exports = {
  inputs: {
    userId: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const memberships = await GroupMembership.qm.getByUserId(inputs.userId);
    return memberships.map((m) => m.groupId);
  },
};
