/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * POST /api/groups — create a group (admin only via policies.js).
 */

const Errors = {
  NAME_TAKEN: { nameTaken: 'Group name already taken' },
};

module.exports = {
  inputs: {
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

  exits: {
    nameTaken: {
      responseType: 'conflict',
    },
  },

  async fn(inputs) {
    const existing = await Group.qm.getOneByName(inputs.name);
    if (existing) {
      throw 'nameTaken';
    }

    const group = await Group.qm.createOne({
      name: inputs.name,
      description: inputs.description || null,
    });

    return { item: group };
  },
};
