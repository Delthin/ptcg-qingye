import { Request, Response } from 'express';
import { EntityManager } from 'typeorm';
import { EconomyError, EconomyService, economyTransaction, integer } from '../../economy/service';
import { AuthToken } from '../services';
import { Controller, Get, Post } from './controller';

/** Server-authoritative game currency only. No payment, account edit or role escalation API. */
export class Economy extends Controller {
  private async run<T>(res: Response, task: (service: EconomyService, manager: EntityManager) => Promise<T>,
    afterCommit?: (result: T) => void) {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const result = await economyTransaction(this.db.manager.connection, manager => task(new EconomyService(manager), manager));
      if (afterCommit) afterCommit(result);
      res.send(result);
    } catch (error) {
      if (error instanceof EconomyError) res.status(error.status).send({ error: error.code, message: error.message });
      else {
        console.error('[Economy] transaction failed:', error instanceof Error ? error.message : 'unknown');
        res.status(500).send({ error: 'ECONOMY_FAILED', message: '操作未能确认，请先刷新余额、未开包和收藏，再核对记录。' });
      }
    }
  }
  @Get('')
  @AuthToken()
  public onSnapshot(req: Request, res: Response) {
    return this.run(res, service => service.snapshot(req.body.userId));
  }
  @Post('/check-in')
  @AuthToken()
  public onCheckIn(req: Request, res: Response) {
    return this.run(res, service => service.checkIn(req.body.userId));
  }
  @Post('/purchase')
  @AuthToken()
  public onPurchase(req: Request, res: Response) {
    return this.run(res, service => service.purchase(req.body.userId, req.body.productId, req.body.quantity));
  }
  @Post('/coins/equip')
  @AuthToken()
  public onEquipCoin(req: Request, res: Response) {
    return this.run(res, service => service.equipCoin(req.body.userId, req.body.coinId), result => {
      this.core.updateEquippedCoin(req.body.userId, result.snapshot.coins.equippedId);
    });
  }
  @Post('/open')
  @AuthToken()
  public onOpen(req: Request, res: Response) {
    return this.run(res, service => service.open(req.body.userId, req.body.packIds));
  }
  @Get('/opening')
  @AuthToken()
  public onOpening(req: Request, res: Response) {
    return this.run(res, service => service.opening(req.body.userId, req.query.openingId));
  }
  @Get('/admin/users')
  @AuthToken()
  public onUsers(req: Request, res: Response) {
    return this.run(res, service => service.adminUsers(req.body.userId, req.query.q));
  }
  @Get('/admin/user')
  @AuthToken()
  public onUser(req: Request, res: Response) {
    return this.run(res, async service => {
      await service.user(req.body.userId, true);
      const raw = req.query.targetUserId;
      const target = typeof raw === 'string' && /^[1-9][0-9]{0,8}$/.test(raw) ? integer(Number(raw), 1, 999999999) : integer(null, 1, 999999999);
      return { snapshot: await service.snapshot(target) };
    });
  }
  @Get('/admin/catalog')
  @AuthToken()
  public onCatalog(req: Request, res: Response) {
    return this.run(res, service => service.adminCatalog(req.body.userId, req.query.q));
  }
  @Post('/admin/grant')
  @AuthToken()
  public onGrant(req: Request, res: Response) {
    return this.run(res, service => service.grant(req.body.userId, req.body.targetUserId, req.body.amountMinor, req.body.cards, req.body.reason));
  }
}
