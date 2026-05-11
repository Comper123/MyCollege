// __tests__/lib/fio.test.ts
import { fio, User } from '@/lib/db/schema';

describe('fio', () => {
  const user = { lastname: 'Иванов', firstname: 'Иван', fathername: 'Иванович' };

  test('returns full name', () => {
    expect(fio(user as User)).toBe('Иванов Иван Иванович');
  });

  test('returns empty string for null', () => {
    expect(fio(null)).toBe('');
  });

  test('handles missing fathername', () => {
    const userWithoutFather = { lastname: 'Петров', firstname: 'Петр', fathername: null };
    expect(fio(userWithoutFather as User)).toBe('Петров Петр');
  });
});