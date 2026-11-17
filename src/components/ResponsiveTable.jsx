/**
 * One table that becomes a card list on a phone.
 *
 * Every list in this app was a desktop table inside `.table-wrap`, which on a
 * narrow screen means a horizontal side-scroll - the reader has to drag the
 * table sideways to find the column they wanted. That is the single clearest
 * "this is a desktop app in a phone browser" tell, and it matters here because
 * employees open the portal on their phone to sign with Aadhaar.
 *
 * Above the breakpoint this renders the exact `.data-table` markup the pages
 * used before, so desktop is unchanged on purpose. Below it, each row becomes
 * a card: the primary cell on top, a status badge beside it, the remaining
 * columns as a label/value grid, and the row's actions along the bottom.
 *
 * Columns are declared once and both layouts are generated from them, so a
 * page cannot drift into showing different data on phone and desktop.
 *
 *   columns: [{ key, header, cell(row), role?, className?, align?, hideOnCard? }]
 *   role: 'primary' - the identity cell; spans the top of the card
 *         'badge'   - status; sits top-right of the card
 *         'select'  - a checkbox; sits top-left of the card
 *         'actions' - buttons; sit in the card footer
 *         (default) - a labelled value in the card body grid
 */
import clsx from 'clsx';

/* Tailwind only sees class names that appear literally in the source, so the
 * breakpoint cannot be interpolated - it is chosen from this map. */
const BREAKPOINTS = {
  sm: { table: 'hidden sm:block', cards: 'sm:hidden' },
  md: { table: 'hidden md:block', cards: 'md:hidden' },
  lg: { table: 'hidden lg:block', cards: 'lg:hidden' },
};

const ALIGN = { right: 'text-right', center: 'text-center' };

/**
 * Assign each column to its place on the phone card.
 *
 * The invariant that matters: every column lands in exactly one slot, or is
 * deliberately dropped via `hideOnCard`. A column appearing twice renders
 * duplicate data; a column silently vanishing loses it.
 */
export function slotColumns(columns = []) {
  const primary = columns.find((c) => c.role === 'primary') || columns[0];
  const badge = columns.find((c) => c.role === 'badge');
  const select = columns.find((c) => c.role === 'select');
  const actions = columns.find((c) => c.role === 'actions');
  const taken = new Set([primary, badge, select, actions].filter(Boolean));
  return {
    primary,
    badge,
    select,
    actions,
    body: columns.filter((c) => !taken.has(c) && !c.hideOnCard),
  };
}

export function ResponsiveTable({
  rows,
  columns,
  rowKey,
  onRowClick,
  rowClassName,
  breakpoint = 'md',
  cardClassName,
  emptyCard = 'Nothing to show',
}) {
  const bp = BREAKPOINTS[breakpoint] || BREAKPOINTS.md;
  const keyOf = rowKey || ((row, i) => row.id ?? i);

  const { primary, badge, select, actions, body } = slotColumns(columns);

  return (
    <>
      {/* ---- Desktop: unchanged table markup ---- */}
      <div className={clsx(bp.table, 'table-wrap')}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={clsx(ALIGN[c.align], c.headerClassName)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={keyOf(row, i)}
                className={clsx(onRowClick && 'cursor-pointer', rowClassName?.(row, i))}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={clsx(ALIGN[c.align], c.className)}>
                    {c.cell(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Phone: one card per row ---- */}
      <div className={clsx(bp.cards, 'space-y-3 p-4')}>
        {rows.length === 0 && <p className="py-6 text-center text-caption text-slate-500">{emptyCard}</p>}
        {rows.map((row, i) => (
          <div
            key={keyOf(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={clsx(
              'rounded-card border border-slate-200/80 bg-white p-4 shadow-xs transition-shadow',
              onRowClick && 'cursor-pointer active:shadow-card',
              cardClassName,
              rowClassName?.(row, i),
            )}
          >
            <div className="flex items-start gap-3">
              {select && <div onClick={(e) => e.stopPropagation()}>{select.cell(row, i)}</div>}
              <div className="min-w-0 flex-1">{primary?.cell(row, i)}</div>
              {badge && <div className="shrink-0">{badge.cell(row, i)}</div>}
            </div>

            {body.length > 0 && (
              <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3.5">
                {body.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="eyebrow">{c.cardLabel || c.header}</dt>
                    {/* `cardRaw` drops the text treatment for cells that are
                        controls rather than values - an input must not be
                        truncated or forced onto one line. */}
                    <dd className={clsx('mt-0.5', c.cardRaw ? '' : 'truncate text-caption text-slate-700')}>
                      {c.cell(row, i)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {actions && (
              <div
                className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                {actions.cell(row, i)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
