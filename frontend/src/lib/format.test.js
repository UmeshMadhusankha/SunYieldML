import {money,number,payback} from './format';
test('formats estimates and missing payback honestly',()=>{expect(number(1200)).toBe('1,200');expect(money(100,'USD')).toBe('$100');expect(money(100,'INVALID')).toBe('INVALID 100');expect(payback(null)).toBe('No positive payback');expect(payback(3.5)).toBe('3.5 years');});
