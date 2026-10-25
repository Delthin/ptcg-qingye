import { Request, Response } from 'express';
import { ApiErrorEnum } from '../common/errors';
import { createHmac, timingSafeEqual } from 'crypto';
import { RateLimit } from '../common/rate-limit';
import { setDuoCookie } from './duo-cookie';
import { config } from '../../config';
import { User } from '../../storage/model/user';


export function generateToken(userId: number, expire?: number) {
  if (expire === undefined) {
    expire = Math.floor(Date.now() / 1000) + config.backend.tokenExpire;
  }
  if (!process.env.secret) throw new Error('Server signing secret is not configured');
  const hash = createHmac('sha256', process.env.secret).update(`${userId},${expire}`).digest('hex');
  return `${userId},${expire},${hash}`;
}


export function validateToken(token: string): number {
  if (typeof token !== 'string') {
    return 0;
  }
  const match = /^([1-9][0-9]{0,8}),([0-9]{10}),([a-f0-9]{64})$/.exec(token);
  if (!match) return 0;
  const userId = Number(match[1]);
  const expire = Number(match[2]);
  const now = Math.floor(Date.now() / 1000);
  if (expire < now || expire > now + config.backend.tokenExpire) return 0;
  const expected = generateToken(userId, expire).split(',')[2];
  if (!timingSafeEqual(Buffer.from(match[3], 'hex'), Buffer.from(expected, 'hex'))) return 0;
  return userId;
}


export function AuthToken() {

  const TOKEN_HEADER: string = 'Auth-Token';
  const rateLimit = RateLimit.getInstance();

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const handler = descriptor.value;

    if (handler === undefined) {
      return;
    }

    descriptor.value = async function (req: Request, res: Response): Promise<any> {
      const token = req.header(TOKEN_HEADER) || '';
      const userId = validateToken(token);

      if (rateLimit.isLimitExceeded(req.ip)) {
        res.status(400);
        res.send({error: ApiErrorEnum.REQUESTS_LIMIT_REACHED});
        return;
      }

      if (!userId) {
        rateLimit.increment(req.ip);
        res.statusCode = 403;
        res.send({error: ApiErrorEnum.AUTH_TOKEN_INVALID});
        return;
      }

      // Signed tokens do not outlive a deleted/banned account. Keep other users'
      // sessions valid without rotating the shared signing key.
      let user: User | undefined;
      try { user = await User.findOne(userId); }
      catch { res.status(503).send({ error: ApiErrorEnum.SERVER_ERROR }); return; }
      if (!user || user.roleId === 1) {
        rateLimit.increment(req.ip);
        res.status(403).send({ error: ApiErrorEnum.AUTH_TOKEN_INVALID });
        return;
      }
      // Card scans reach the browser through <img> tags, which cannot send Auth-Token. Refresh the
      // same-origin asset cookie on every authenticated call so private card art keeps loading
      // after a dropped or expired cookie instead of silently breaking every card image.
      setDuoCookie(req, res, token);
      Object.assign(req.body, {userId});
      return handler.apply(this, arguments);
    };
  };

}
