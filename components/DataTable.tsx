type DataTableProps = {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="table-card">
      <div className="table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          className="table-row"
          key={rowIndex}
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, cellIndex) => (
            <div key={`${rowIndex}-${cellIndex}`}>{cell}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
