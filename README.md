# planka-dataroom

A modified fork of [PLANKA](https://github.com/plankanban/planka) (v2.1.0) by [Karapazar Hukuk](https://karapazarhukuk.com) for the Paydaş × Taranis Capital data room project.

This fork is distributed under the same [PLANKA Community License](LICENSES/PLANKA%20Community%20License%20EN.md) as upstream. We honor the license by:

- Keeping all upstream copyright notices intact in modified files.
- Displaying a "Modified by Karapazar Hukuk" notice in the in-app About modal that links back to this fork.
- Not modifying any file under the separate Commercial License (anything with `.pe.` in path or header).

## Modifications vs upstream `master`

- **Per-card and per-board ACL** with first-class user `groups` as ACL subjects. Schema: `groups`, `group_members`, `board_acls`, `card_acls` (two-FK design with CHECK XOR).
- **Socket broadcast filter**: card-mutation events route to per-`user:<id>` rooms when the card has an ACL, instead of the whole `board:<id>` room.
- **Unified View** at `/unified`: an aggregator page that shows every card the current user can read, grouped by status, with drag-and-drop between columns.
- **Brand strip**: Karapazar Hukuk logos and accent color; vanilla Planka brand assets retained as fallback.
- **Custom card fields** for the IRL workflow (`ref`, `priority`, `wave`) using Planka v2's built-in Base Custom Field Group system.
- **Companion MCP service** (separate repo: `ykarapazar/planka-mcp`) wrapping the Planka REST so Claude can drive board state.

## Use case

Single law-firm-internal engagement; named collaborators only; not offered as a hosted service to third parties. Within scope of the Community License's allowed uses.

## Deployment

See `nginx/`, `deployment/ecosystem.config.js`, and `scripts/seed_irl.py` for the deployment artifacts. The plan file (private to the firm) at `~/.claude/plans/paydasdataroom-planka-fork-v1.md` is the source of truth for the implementation sequence.

---

Below this point: vanilla upstream README is preserved verbatim for reference.

---

<details>
<summary>Original upstream README</summary>

<div align="center">

  ![Logo](https://raw.githubusercontent.com/plankanban/planka/master/assets/logo.png)

  # PLANKA

  _Project mastering driven by fun_

  ![Version](https://img.shields.io/github/package-json/v/plankanban/planka?style=flat-square) [![Docker Pulls](https://img.shields.io/badge/docker_pulls-8M%2B-%23066da5?style=flat-square&color=red)](https://github.com/plankanban/planka/pkgs/container/planka) [![Contributors](https://img.shields.io/github/contributors/plankanban/planka?style=flat-square&color=blue)](https://github.com/plankanban/planka/graphs/contributors) [![Chat](https://img.shields.io/discord/1041440072953765979?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/WqqYNd7Jvt)

  [Install](https://docs.planka.cloud/docs/installation/docker/production-version/) ·  [Demo](https://planka.app) · [Docs](https://docs.planka.cloud/docs/welcome/) · [API](https://plankanban.github.io/planka/swagger-ui/) · [Cloud](https://planka.app/pricing) · [Pro version](https://planka.app/pro)

</div>

For full upstream documentation, see https://github.com/plankanban/planka.

</details>
