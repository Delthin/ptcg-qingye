import { check } from './validate';

describe('trainer names', () => {
  it('accepts one-to-ten Chinese/ASCII characters for new registrations, counting Unicode code points', () => {
    for (const name of ['李', 'A', '1', '李思怡', '小智123', '训练家Ash', '41', '𠮷', '张'.repeat(10), '𠮷'.repeat(10)]) {
      expect(check().isName(10).validate(name)).toBe(true, name);
    }
    for (const name of ['', '张'.repeat(11), '𠮷'.repeat(11), 'a'.repeat(11)]) {
      expect(check().isName(10).validate(name)).toBe(false, name);
    }
  });
  it('continues accepting existing names up to thirty-two characters for login and exact lookup', () => {
    for (const name of ['旧账号'.repeat(4), 'a'.repeat(32), '𠮷'.repeat(32)]) {
      expect(check().isName().validate(name)).toBe(true, name);
      expect(check().isName(10).validate(name)).toBe(false, name);
    }
    expect(check().isName().validate('张'.repeat(33))).toBe(false);
  });
  it('rejects whitespace, symbols and non-string values in both policies', () => {
    for (const name of ['小 智', ' 小智', '小智 ', '小智\n', '小智\r\n', '小智\t', '<小智>', '../小智', '小智🙂',
      '小智_1', 'カスミ', '咖啡é', null, undefined, 41, {}]) {
      expect(check().isName().validate(name)).toBe(false, String(name));
      expect(check().isName(10).validate(name)).toBe(false, String(name));
    }
  });
});
