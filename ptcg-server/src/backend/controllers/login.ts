import { Request, Response, NextFunction } from 'express';
import { AuthToken, Validate, check, generateToken } from '../services';
import { Controller, Get, Post } from './controller';
import { ApiErrorEnum } from '../common/errors';
import { LoginRequest, RegisterRequest, ServerConfig } from '../interfaces';
import { User } from '../../storage';
import { RateLimit } from '../common/rate-limit';
import { config } from '../../config';
import { board3dWhitelist } from '../../config/3d-board-whitelist';
import { DUO_COOKIE, setDuoCookie } from '../services/duo-cookie';
import { hashPassword, verifyPassword } from '../services/password';


export class Login extends Controller {

  private rateLimit = RateLimit.getInstance();

  @Post('/register')
  public async onRegister(req: Request, res: Response, next: NextFunction) {
    const body: RegisterRequest = req.body;

    // Private-room registration must never bypass the invitation endpoint.
    if (config.duo.enabled || config.backend.registrationEnabled === false) {
      res.status(400);
      res.send({ error: ApiErrorEnum.REGISTER_DISABLED });
      return;
    }

    for (const [param, validator] of Object.entries({ name: check().isName(10), email: check().isEmail(), password: check().isPassword() })) {
      if (!validator.validate(req.body[param])) {
        res.status(400).send({ error: ApiErrorEnum.VALIDATION_INVALID_PARAM, param }); return;
      }
    }
    if (this.rateLimit.isLimitExceeded(req.ip)) {
      res.status(400);
      res.send({ error: ApiErrorEnum.REQUESTS_LIMIT_REACHED });
      return;
    }

    if (process.env.SERVER_PASSWORD
      && process.env.SERVER_PASSWORD !== body.serverPassword
    ) {
      this.rateLimit.increment(req.ip);
      res.status(400);
      res.send({ error: ApiErrorEnum.REGISTER_INVALID_SERVER_PASSWORD });
      return;
    }

    if (await User.findOne({ name: body.name })) {
      res.status(400);
      res.send({ error: ApiErrorEnum.REGISTER_NAME_EXISTS });
      return;
    }

    if (await User.findOne({ email: body.email })) {
      res.status(400);
      res.send({ error: ApiErrorEnum.REGISTER_EMAIL_EXISTS });
      return;
    }

    // Don't allow to create to many users
    this.rateLimit.increment(req.ip);

    const user = new User();
    user.name = body.name;
    user.email = body.email;
    user.password = await hashPassword(body.password);
    user.registered = Date.now();
    await user.save();

    res.send({ ok: true });
  }

  @Post('')
  @Validate({
    name: check().isName(),
    password: check().isString()
  })
  public async onLogin(req: Request, res: Response) {
    const body: LoginRequest = req.body;
    if (body.password.length > 256) {
      res.status(400).send({ error: ApiErrorEnum.LOGIN_INVALID });
      return;
    }
    const credentialKey = `credentials:${req.ip}`;
    if (this.rateLimit.isLimitExceeded(credentialKey, 'http', 20)) {
      res.status(400);
      res.send({ error: ApiErrorEnum.REQUESTS_LIMIT_REACHED });
      return;
    }

    this.rateLimit.increment(credentialKey);
    const user = await User.findOne({ where: { name: body.name } });
    if (user === undefined || !(await verifyPassword(body.password, user.password))) {
      res.status(400);
      res.send({ error: ApiErrorEnum.LOGIN_INVALID });
      return;
    }

    // Check if user is banned
    if (user.roleId === 1) {
      res.status(403);
      res.send({ error: ApiErrorEnum.USER_BANNED });
      return;
    }

    if (!user.password.startsWith('scrypt$')) {
      await User.update(user.id, { password: await hashPassword(body.password) });
    }
    const token = generateToken(user.id);
    setDuoCookie(req, res, token);
    res.send({
      ok: true,
      token,
      config: this.getServerConfig(),
      user: {
        id: user.id,
        name: user.name,
        roleId: user.roleId
      }
    });
  }

  @Get('/refreshToken')
  @AuthToken()
  public async onRefreshToken(req: Request, res: Response) {
    const userId: number = req.body.userId;
    const user = await User.findOne(userId);
    if (!user || user.roleId === 1) {
      res.status(403).send({ error: ApiErrorEnum.AUTH_TOKEN_INVALID });
      return;
    }
    const token = generateToken(userId);
    setDuoCookie(req, res, token);
    res.send({ ok: true, token, config: this.getServerConfig() });
  }

  @Get('/logout')
  @AuthToken()
  public onLogout(req: Request, res: Response) {
    res.clearCookie(DUO_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax' });
    res.send({ ok: true });
  }

  @Get('/info')
  public onInfo(req: Request, res: Response) {
    res.send({ ok: true, config: this.getServerConfig() });
  }

  private getServerConfig(): ServerConfig {
    return {
      apiVersion: 2,
      defaultPageSize: config.backend.defaultPageSize,
      scansUrl: config.sets.scansUrl,
      avatarsUrl: config.backend.avatarsUrl,
      sleevesUrl: config.backend.sleevesUrl,
      avatarFileSize: config.backend.avatarFileSize,
      avatarMinSize: config.backend.avatarMinSize,
      avatarMaxSize: config.backend.avatarMaxSize,
      replayFileSize: config.backend.replayFileSize,
      refreshTokenInterval: config.backend.refreshTokenInterval,
      board3dWhitelist: board3dWhitelist,
      serverPasswordRequired: Boolean(process.env.SERVER_PASSWORD),
    };
  }

}
