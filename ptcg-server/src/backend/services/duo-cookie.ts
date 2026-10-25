import { Request, Response } from 'express';
import { config } from '../../config';

export const DUO_COOKIE = 'ptcg_room';

/**
 * Card scans are rendered by <img>, which cannot send the Auth-Token header, so the private
 * asset route reads this same-origin HttpOnly cookie instead. It lives in its own module
 * because both the login controller and the AuthToken middleware keep it fresh.
 */
export function setDuoCookie(req: Request, res: Response, token: string): void {
  if (!config.duo.enabled) return;
  res.cookie(DUO_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/',
    secure: req.secure || req.header('x-forwarded-proto') === 'https',
    maxAge: config.backend.tokenExpire * 1000,
  });
}
