import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { validateToken } from './auth-token';
import { DUO_COOKIE } from './duo-cookie';
import { User } from '../../storage/model/user';

/** Images cannot send Auth-Token headers, so use a same-origin HttpOnly cookie. */
export async function privateDuoAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!config.duo.enabled) { next(); return; }
  let token = req.header('Auth-Token') || '';
  if (!token) {
    const value = (req.headers.cookie || '').split(';').map(value => value.trim())
      .find(value => value.startsWith(`${DUO_COOKIE}=`));
    try { token = value ? decodeURIComponent(value.slice(DUO_COOKIE.length + 1)) : ''; }
    catch { token = ''; }
  }
  const userId = validateToken(token);
  if (!userId) { res.status(403).json({ error: 'ERROR_AUTH_TOKEN_INVALID' }); return; }
  try {
    const user = await User.findOne(userId);
    if (!user || user.roleId === 1) { res.status(403).json({ error: 'ERROR_AUTH_TOKEN_INVALID' }); return; }
  } catch { res.status(503).json({ error: 'ERROR_SERVER_ERROR' }); return; }
  // Printing scans are immutable per printing id. The first authenticated fetch fills the CDN
  // cache, after which card images are served from the edge instead of the bandwidth-capped
  // origin link. This is a deliberate trade-off: a cached scan can be fetched by URL without
  // a session until the edge entry expires.
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  next();
}
