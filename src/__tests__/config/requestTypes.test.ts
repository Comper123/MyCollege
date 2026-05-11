// Конфигурация типов заявок из вашего проекта
const requestTypeConfig = {
  repair: { label: 'Ремонт', icon: '🔧', color: 'text-amber-600' },
  maintenance: { label: 'Обслуживание', icon: '⚙️', color: 'text-blue-600' },
  replacement: { label: 'Замена', icon: '🔄', color: 'text-indigo-600' },
  transfer: { label: 'Перемещение', icon: '📦', color: 'text-emerald-600' },
  write_off: { label: 'Списание', icon: '🗑️', color: 'text-red-600' },
  other: { label: 'Другое', icon: '📝', color: 'text-gray-600' },
};

function getRequestTypeLabel(type: string): string {
  return requestTypeConfig[type as keyof typeof requestTypeConfig]?.label || type;
}

describe('Конфигурация типов заявок', () => {
  test('должна содержать 6 типов', () => {
    expect(Object.keys(requestTypeConfig)).toHaveLength(6);
  });

  test('каждый тип должен иметь label, icon и color', () => {
    Object.values(requestTypeConfig).forEach(config => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('color');
    });
  });

  test('функция getRequestTypeLabel должна возвращать правильную метку', () => {
    expect(getRequestTypeLabel('repair')).toBe('Ремонт');
    expect(getRequestTypeLabel('maintenance')).toBe('Обслуживание');
    expect(getRequestTypeLabel('transfer')).toBe('Перемещение');
  });
});