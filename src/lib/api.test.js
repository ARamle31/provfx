import { expect, describe, it, mock, beforeEach } from "bun:test";
import { auth } from './api';

describe('auth.login', () => {
  beforeEach(() => {
    // Reset mocks before each test
    global.fetch = mock();
  });

  it('successfully logs in and returns data', async () => {
    const mockResponse = { token: 'fake-token', user: { email: 'test@example.com' } };
    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await auth.login('test@example.com', 'password123');

    expect(global.fetch).toHaveBeenCalled();
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/login');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body)).toEqual({ email: 'test@example.com', password: 'password123' });
    expect(result).toEqual(mockResponse);
  });

  it('throws "Invalid Credentials" when login fails', async () => {
    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    );

    await expect(auth.login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid Credentials');
  });
});
