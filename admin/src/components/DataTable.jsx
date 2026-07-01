import Loader from './Loader';

/**
 * Generic responsive data table.
 * @param {Array<{key,label,render?}>} columns
 * @param {Array} rows
 * @param {boolean} loading
 * @param {string} emptyText
 * @param {(row)=>ReactNode} [actions] - renders an actions cell
 */
export default function DataTable({ columns, rows, loading, emptyText = 'No records found', actions }) {
  if (loading) return <Loader />;

  const colCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="empty-row" colSpan={colCount}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : valueOf(row, c.key)}</td>
                ))}
                {actions && (
                  <td>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function valueOf(row, key) {
  const v = row[key];
  return v === null || v === undefined || v === '' ? '—' : String(v);
}
