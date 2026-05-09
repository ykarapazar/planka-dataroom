/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * GET /api/groups — list all groups (admin only via policies.js).
 */

module.exports = {
  async fn() {
    const groups = await Group.qm.getAll();
    return { items: groups };
  },
};
