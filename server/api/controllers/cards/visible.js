/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.8).
 *
 * GET /api/cards/visible — returns a flat list of all cards the current user
 * can read across every board they have access to. Used by the Unified View
 * (/unified) and by the MCP wrapper for cross-board queries.
 *
 * Honors the same canAccessBoard / canAccessCard helpers used by the
 * regular show + index controllers, so visibility is consistent.
 */

module.exports = {
  inputs: {
    groupBy: {
      type: 'string',
      isIn: ['status'],
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const projects = await Project.find({}).sort('id');
    const projectIds = sails.helpers.utils.mapRecords(projects);
    const allBoards = await Board.qm.getByProjectIds(projectIds);

    let visibleBoards = allBoards;
    if (currentUser.role !== User.Roles.ADMIN) {
      const checks = await Promise.all(
        allBoards.map((b) =>
          sails.helpers.users.canAccessBoard.with({
            userId: currentUser.id,
            boardId: b.id,
            requiredLevel: 'view',
            request: this.req,
          }),
        ),
      );
      visibleBoards = allBoards.filter((_b, i) => checks[i]);
    }

    const visibleBoardIds = sails.helpers.utils.mapRecords(visibleBoards);
    const lists =
      visibleBoardIds.length === 0
        ? []
        : await List.find({ boardId: visibleBoardIds }).sort('position');
    const finiteLists = lists.filter((l) => sails.helpers.lists.isFinite(l));
    const listIds = sails.helpers.utils.mapRecords(finiteLists);

    let cards = await Card.qm.getByListIds(listIds);

    if (currentUser.role !== User.Roles.ADMIN && cards.length > 0) {
      const allowed = await Promise.all(
        cards.map((c) =>
          sails.helpers.users.canAccessCard.with({
            userId: currentUser.id,
            cardId: c.id,
            requiredLevel: 'view',
            request: this.req,
          }),
        ),
      );
      cards = cards.filter((_c, i) => allowed[i]);
    }

    // Index helpers for the client.
    const boardById = new Map(visibleBoards.map((b) => [b.id, b]));
    const listById = new Map(finiteLists.map((l) => [l.id, l]));

    const enriched = cards.map((c) => {
      const list = listById.get(c.listId);
      const board = list ? boardById.get(list.boardId) : null;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        dueDate: c.dueDate,
        listId: c.listId,
        listName: list?.name ?? null,
        listType: list?.type ?? null,
        boardId: board?.id ?? null,
        boardName: board?.name ?? null,
        boardPosition: board?.position ?? 0,
        position: c.position,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    if (inputs.groupBy === 'status') {
      const grouped = {};
      for (const c of enriched) {
        const key = c.listName ?? '(unknown)';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
      }
      return {
        items: enriched,
        grouped,
      };
    }

    return { items: enriched };
  },
};
