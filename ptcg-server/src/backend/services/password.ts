import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { Md5 } from '../../utils/md5';

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, (error, key) =>
    error ? reject(error) : resolve(key)));
}

/** Salted password storage; legacy hashes are upgraded after successful login. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3 || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[a-f0-9]{128}$/.test(parts[2])) return false;
    return timingSafeEqual(await derive(password, parts[1]), Buffer.from(parts[2], 'hex'));
  }
  if (!/^[a-f0-9]{32}$/i.test(stored)) return false;
  return timingSafeEqual(Buffer.from(Md5.init(password), 'hex'), Buffer.from(stored, 'hex'));
}
