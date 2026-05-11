// Функции валидации из вашего проекта

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
}

function validateInventoryNumber(num: string): boolean {
  return /^INV-\d{4}-\d{5,10}$/.test(num);
}

describe('Валидация данных', () => {
  describe('validateEmail', () => {
    test('должен вернуть true для корректного email', () => {
      expect(validateEmail('user@mail.ru')).toBe(true);
      expect(validateEmail('name.surname@novsu.ru')).toBe(true);
      expect(validateEmail('test@domain.com')).toBe(true);
    });

    test('должен вернуть false для некорректного email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('должен вернуть true для пароля длиной 6+ символов', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('strongpassword')).toBe(true);
    });

    test('должен вернуть false для пароля короче 6 символов', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateInventoryNumber', () => {
    test('должен вернуть true для корректного инвентарного номера', () => {
      expect(validateInventoryNumber('INV-2024-00001')).toBe(true);
      expect(validateInventoryNumber('INV-2024-1234567890')).toBe(true);
    });

    test('должен вернуть false для некорректного инвентарного номера', () => {
      expect(validateInventoryNumber('INV-2024-001')).toBe(false);
      expect(validateInventoryNumber('2024-00001')).toBe(false);
      expect(validateInventoryNumber('')).toBe(false);
    });
  });
});