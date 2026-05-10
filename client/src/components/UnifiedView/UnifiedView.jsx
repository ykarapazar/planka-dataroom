/*!
 * Karapazar Hukuk addition for the Paydaş × Taranis Data Room (per plan §6.8).
 *
 * Standalone read-only Unified View at /unified. Renders every card the
 * current user can read across all boards in a 5-column kanban (Not Started /
 * In Progress / Provided / Blocked / N/A). Each card links to its home board's
 * card view so the user can act on it.
 *
 * Deliberately bypasses Planka's redux/saga layer to keep the surface area
 * small. Drag-drop is deferred to v1.5 (use the home board's UI for now).
 */

import React, { useEffect, useState } from 'react';
import Config from '../../constants/Config';
import Paths from '../../constants/Paths';
import { getAccessToken } from '../../utils/access-token-storage';

import styles from './UnifiedView.module.scss';

const COLUMN_ORDER = ['Not Started', 'In Progress', 'Provided', 'Blocked', 'N/A'];

function formatDue(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

const UnifiedView = React.memo(() => {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = Paths.LOGIN;
      return;
    }

    fetch(`${Config.BASE_PATH}/api/cards/visible?groupBy=status`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })
      .then(async (resp) => {
        if (resp.status === 401) {
          window.location.href = Paths.LOGIN;
          return null;
        }
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        return resp.json();
      })
      .then((body) => {
        if (body) setState({ status: 'ready', data: body });
      })
      .catch((err) => setState({ status: 'error', message: String(err) }));
  }, []);

  if (state.status === 'loading') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.error}>Failed to load: {state.message}</div>
      </div>
    );
  }

  const grouped = state.data.grouped || {};

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.title}>All my cards · {state.data.items.length} total</div>
        <a href={Paths.ROOT} className={styles.backLink}>
          ← Back to projects
        </a>
      </div>
      <div className={styles.columns}>
        {COLUMN_ORDER.map((col) => {
          const cards = grouped[col] || [];
          return (
            <div key={col} className={styles.column}>
              <div className={styles.columnHeader}>
                <span>{col}</span>
                <span className={styles.columnCount}>{cards.length}</span>
              </div>
              {cards.length === 0 ? (
                <div className={styles.empty}>No cards</div>
              ) : (
                cards.map((c) => {
                  const due = formatDue(c.dueDate);
                  return (
                    <a
                      key={c.id}
                      className={styles.card}
                      href={Paths.CARDS.replace(':id', c.id)}
                    >
                      <div className={styles.cardName}>{c.name}</div>
                      <div className={styles.cardMeta}>
                        {c.boardName && (
                          <span className={styles.boardChip}>{c.boardName}</span>
                        )}
                        {due && <span className={styles.dueChip}>Due {due}</span>}
                      </div>
                    </a>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default UnifiedView;
