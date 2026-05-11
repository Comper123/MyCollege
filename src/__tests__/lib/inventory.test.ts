function isValidInventoryNumber(num: string): boolean {
  return /^INV-\d{4}-\d{5,10}$/.test(num);
}

function generateInventoryNumber(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 100000);
  return `INV-${year}-${String(sequence).padStart(10, '0')}`;
}

describe('Генерация инвентарных номеров', () => {
  test('инвентарный номер должен соответствовать формату INV-ГГГГ-XXXXX', () => {
    const number = generateInventoryNumber();
    expect(isValidInventoryNumber(number)).toBe(true);
  });

  test('инвентарный номер должен содержать текущий год', () => {
    const currentYear = new Date().getFullYear();
    const number = generateInventoryNumber();
    expect(number).toContain(`INV-${currentYear}`);
  });

  test('должен распознавать корректный инвентарный номер', () => {
    expect(isValidInventoryNumber('INV-2024-00001')).toBe(true);
    expect(isValidInventoryNumber('INV-2024-1234567890')).toBe(true);
  });

  test('должен отвергать некорректный инвентарный номер', () => {
    expect(isValidInventoryNumber('INV-2024-001')).toBe(false);
    expect(isValidInventoryNumber('2024-00001')).toBe(false);
    expect(isValidInventoryNumber('')).toBe(false);
  });
});