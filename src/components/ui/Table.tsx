export interface Column<T> {
  title: string;
  key: keyof T;
  render?: (value: T[keyof T], row: T ) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
}

export function Table<T>({ columns, data, keyExtractor }: TableProps<T>) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-white/10">
          {columns.map((col, i) => (
            <th key={i} className="text-left px-4 py-3 font-medium text-gray-500 dark:text-white/50">
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={keyExtractor(row)} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            {columns.map((col, i) => (
              <td key={i} className="px-4 py-3 text-gray-900 dark:text-white">
                {col.render 
                  ? col.render(row[col.key], row)
                  : String(row[col.key] ?? "—")
                }
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}