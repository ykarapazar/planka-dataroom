/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.5).
 *
 * GET /api/boards/:boardId/board-acls — list ACL grants on a board (admin only).
 */

const Errors = {
  BOARD_NOT_FOUND: { boardNotFound: 'Board not found' },
};

module.exports = {
  inputs: {
    boardId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    boardNotFound: { responseType: 'notFound' },
  },

  async fn(inputs) {
    const board = await Board.qm.getOneById(inputs.boardId);
    if (!board) throw 'boardNotFound';

    const acls = await BoardAcl.qm.getByBoardId(board.id);
    return { items: acls };
  },
};
