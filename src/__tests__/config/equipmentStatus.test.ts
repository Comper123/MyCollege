// Конфигурация статусов из вашего проекта
const equipmentStatusConfig = {
  active: { label: 'В эксплуатации', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  maintenance: { label: 'На обслуживании', color: 'text-amber-700', bg: 'bg-amber-50' },
  broken: { label: 'Неисправно', color: 'text-red-700', bg: 'bg-red-50' },
  written_off: { label: 'Списано', color: 'text-gray-500', bg: 'bg-gray-100' },
  reserved: { label: 'Зарезервировано', color: 'text-blue-700', bg: 'bg-blue-50' },
};

function getEquipmentStatusLabel(status: string): string {
  return equipmentStatusConfig[status as keyof typeof equipmentStatusConfig]?.label || status;
}

describe('Конфигурация статусов оборудования', () => {
  test('должна содержать 5 статусов', () => {
    expect(Object.keys(equipmentStatusConfig)).toHaveLength(5);
  });

  test('каждый статус должен иметь label, color и bg', () => {
    Object.values(equipmentStatusConfig).forEach(config => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bg');
    });
  });

  test('функция getEquipmentStatusLabel должна возвращать правильную метку', () => {
    expect(getEquipmentStatusLabel('active')).toBe('В эксплуатации');
    expect(getEquipmentStatusLabel('maintenance')).toBe('На обслуживании');
    expect(getEquipmentStatusLabel('broken')).toBe('Неисправно');
    expect(getEquipmentStatusLabel('unknown')).toBe('unknown');
  });
});