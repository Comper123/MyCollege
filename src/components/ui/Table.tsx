interface Column {
  title: string;
  render: () => React.ReactNode;
}

interface TableProps {
  columns: Column[]
}

export default function Table({ columns }: TableProps) {
  
  return (
    <table>
      <th>
        {columns.map((col, ind) => ( 
          <td key={ind}>
            {col.title}
          </td>
        ))}
      </th>
      
      <tr>
        {columns.map((col, ind) => (
          <td>

          </td>
        ))}
        
      </tr>
    </table>  
  )
}