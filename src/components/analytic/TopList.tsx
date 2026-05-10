"use client";

interface TopItem {
  id: string;
  name: string;
  value: number;
  unit?: string;
  icon?: React.ReactNode;
}

interface TopListProps {
  items: TopItem[];
  title?: string;
  maxItems?: number;
  valueLabel?: string;
}

export default function TopList({ items, title, maxItems = 5, valueLabel = "шт" }: TopListProps) {
  const displayedItems = items.slice(0, maxItems);

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>}
      <div className="space-y-2">
        {displayedItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Нет данных</p>
        ) : (
          displayedItems.map((item, idx) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 w-5">{idx + 1}.</span>
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                <span className="text-xs text-gray-400">{item.unit || valueLabel}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}