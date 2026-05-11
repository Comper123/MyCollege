// Конфигурация приоритетов из вашего проекта
const priorityConfig = {
  low: { label: 'Низкий', color: 'text-gray-500', bg: 'bg-gray-100' },
  medium: { label: 'Средний', color: 'text-blue-500', bg: 'bg-blue-100' },
  high: { label: 'Высокий', color: 'text-orange-500', bg: 'bg-orange-100' },
  urgent: { label: 'Срочный', color: 'text-red-500', bg: 'bg-red-100' },
};

function getPriorityLabel(priority: string): string {
  return priorityConfig[priority as keyof typeof priorityConfig]?.label || priority;
}

describe('Конфигурация приоритетов', () => {
  test('должна содержать 4 приоритета', () => {
    expect(Object.keys(priorityConfig)).toHaveLength(4);
  });

  test('каждый приоритет должен иметь label, color и bg', () => {
    Object.values(priorityConfig).forEach(config => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bg');
    });
  });

  test('функция getPriorityLabel должна возвращать правильную метку', () => {
    expect(getPriorityLabel('urgent')).toBe('Срочный');
    expect(getPriorityLabel('high')).toBe('Высокий');
    expect(getPriorityLabel('unknown')).toBe('unknown');
  });
});