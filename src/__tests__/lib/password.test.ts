import { hashPassword, verifyPassword } from "@/lib/auth/helpers";

describe('Функции работы с паролями', () => {
  const testPassword = 'testPassword123';

  test('hashPassword должен вернуть строку', async () => {
    const hash = await hashPassword(testPassword);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  test('verifyPassword должен вернуть true для правильного пароля', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword(testPassword, hash);
    expect(isValid).toBe(true);
  });

  test('verifyPassword должен вернуть false для неправильного пароля', async () => {
    const hash = await hashPassword(testPassword);
    const isValid = await verifyPassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});