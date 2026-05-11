import { formatDateTime } from '@/utils/datetime/dateFormatter';
import test, { describe } from 'node:test';

describe('formatDateTime', () => {
  test('returns formatted date string', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z', 'full');
    expect(typeof result).toBe('string');
  });

  test('handles invalid date', () => {
    const result = formatDateTime('invalid', 'full');
    expect(result).toBe('Invalid date');
  });
});


