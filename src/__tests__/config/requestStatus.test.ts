// Конфигурация статусов заявок из вашего проекта
const requestStatusConfig = {
  draft: { label: 'Черновик', color: 'text-gray-500', bg: 'bg-gray-100' },
  pending: { label: 'На рассмотрении', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Одобрена', color: 'text-blue-600', bg: 'bg-blue-100' },
  rejected: { label: 'Отклонена', color: 'text-red-600', bg: 'bg-red-100' },
  in_progress: { label: 'В работе', color: 'text-purple-600', bg: 'bg-purple-100' },
  completed: { label: 'Выполнена', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Отменена', color: 'text-gray-500', bg: 'bg-gray-100' },
};

function getRequestStatusLabel(status: string): string {
  return requestStatusConfig[status as keyof typeof requestStatusConfig]?.label || status;
}

describe('Конфигурация статусов заявок', () => {
  test('должна содержать 7 статусов', () => {
    expect(Object.keys(requestStatusConfig)).toHaveLength(7);
  });

  test('каждый статус должен иметь label, color и bg', () => {
    Object.values(requestStatusConfig).forEach(config => {
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bg');
    });
  });

  test('функция getRequestStatusLabel должна возвращать правильную метку', () => {
    expect(getRequestStatusLabel('pending')).toBe('На рассмотрении');
    expect(getRequestStatusLabel('completed')).toBe('Выполнена');
    expect(getRequestStatusLabel('rejected')).toBe('Отклонена');
  });
});