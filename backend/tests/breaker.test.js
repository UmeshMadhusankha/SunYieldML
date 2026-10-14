const { CircuitBreaker } = require('../src/integrations/breaker');
describe('circuit state machine', () => {
  let now, breaker;
  beforeEach(() => { now = 0; breaker = new CircuitBreaker({ threshold: 2, cooldownMs: 30, clock: () => now }); });
  test('allows normal calls', async () => { expect(await breaker.execute(async () => 42)).toBe(42); expect(breaker.state).toBe('closed'); });
  test('opens at threshold and stops calling a failed dependency', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('offline'));
    await expect(breaker.execute(fn)).rejects.toThrow('offline');
    await expect(breaker.execute(fn)).rejects.toThrow('offline');
    await expect(breaker.execute(fn)).rejects.toThrow('Circuit');
    expect(fn).toHaveBeenCalledTimes(2);
  });
  test('successful recovery probe closes circuit', async () => {
    for (let i = 0; i < 2; i++) await breaker.execute(async () => { throw new Error('offline'); }).catch(() => {});
    now = 31; expect(await breaker.execute(async () => 7)).toBe(7); expect(breaker.state).toBe('closed');
  });
  test('only one half-open probe runs concurrently', async () => {
    for (let i = 0; i < 2; i++) await breaker.execute(async () => { throw new Error('offline'); }).catch(() => {});
    now = 31; let resolve; const probe = breaker.execute(() => new Promise(r => { resolve = r; }));
    await expect(breaker.execute(async () => 9)).rejects.toThrow('Circuit'); resolve(1); await probe;
  });
  test('failed probe reopens', async () => {
    for (let i = 0; i < 2; i++) await breaker.execute(async () => { throw new Error('offline'); }).catch(() => {});
    now = 31; await breaker.execute(async () => { throw new Error('still offline'); }).catch(() => {});
    expect(breaker.state).toBe('open');
  });
  test('non-transient errors do not increment failures', async () => {
    const e = Object.assign(new Error('bad credentials'), { retryable: false });
    await expect(breaker.execute(async () => { throw e; })).rejects.toThrow(); expect(breaker.failures).toBe(0);
  });
  test('success resets consecutive failures', async () => {
    await breaker.execute(async () => { throw new Error('once'); }).catch(() => {});
    await breaker.execute(async () => 1); expect(breaker.failures).toBe(0);
  });
  test('default configuration allows a healthy dependency', async () => {
    const defaults = new CircuitBreaker(); expect(await defaults.execute(async()=>1)).toBe(1);
  });
  test('nonretryable recovery response returns circuit to closed', async () => {
    for (let i=0;i<2;i++) await breaker.execute(async()=>{throw Error('offline');}).catch(()=>{});
    now=31; const error=Object.assign(Error('bad credentials'),{retryable:false});
    await expect(breaker.execute(async()=>{throw error;})).rejects.toThrow('bad credentials');
    expect(breaker.state).toBe('closed');expect(breaker.failures).toBe(0);
  });
});
