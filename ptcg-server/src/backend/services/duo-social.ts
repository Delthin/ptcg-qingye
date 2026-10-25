import { getManager } from 'typeorm';
import { User, Friend, FriendRequest, FriendStatus, FriendRequestStatus } from '../../storage';
import { ApiErrorEnum } from '../common/errors';
import { economyTransaction } from '../../economy/service';

export type DuoFriendAction = 'send' | 'accept' | 'reject' | 'cancel' | 'remove';
export class DuoSocialError extends Error {
  constructor(public code: ApiErrorEnum, public status: number = 400) { super(code); }
}

/** Share the connection's transaction queue with registration and economy requests.
 * Both directions are one friendship; retries never create duplicate rows. */
export function changeDuoFriend(actorId: number, action: DuoFriendAction, targetId: number): Promise<void> {
  return economyTransaction(getManager().connection, async manager => {
    const actor = await manager.findOne(User, actorId);
    if (!actor || actor.roleId === 1) throw new DuoSocialError(ApiErrorEnum.AUTH_INVALID_PERMISSIONS, 403);
    if (action === 'send' || action === 'remove') {
      const target = await manager.findOne(User, targetId);
      if (!target || target.roleId === 1 || targetId === actorId) throw new DuoSocialError(ApiErrorEnum.PROFILE_INVALID);
      const pair = [{ user_id: actorId, friend_id: targetId }, { user_id: targetId, friend_id: actorId }];
      const friends = await manager.find(Friend, { where: pair });
      if (action === 'remove') {
        const accepted = friends.filter(row => row.status === FriendStatus.ACCEPTED);
        if (accepted.length) await manager.remove(accepted);
        return;
      }
      if (friends.some(row => row.status === FriendStatus.BLOCKED)) throw new DuoSocialError(ApiErrorEnum.AUTH_INVALID_PERMISSIONS, 403);
      if (friends.some(row => row.status === FriendStatus.ACCEPTED)) return;
      const pending = await manager.findOne(FriendRequest, { where: [
        { sender_id: actorId, receiver_id: targetId, status: FriendRequestStatus.PENDING },
        { sender_id: targetId, receiver_id: actorId, status: FriendRequestStatus.PENDING }
      ] });
      // A reciprocal send remains pending; only an explicit receiver acceptance grants access.
      if (!pending) await manager.save(manager.create(FriendRequest, {
        sender_id: actorId, receiver_id: targetId, status: FriendRequestStatus.PENDING
      }));
      return;
    }
    const request = await manager.findOne(FriendRequest, targetId);
    if (!request || (action === 'cancel' ? request.sender_id : request.receiver_id) !== actorId) {
      throw new DuoSocialError(ApiErrorEnum.AUTH_INVALID_PERMISSIONS, 403);
    }
    if (action === 'cancel' || action === 'reject') {
      if (request.status === FriendRequestStatus.PENDING) {
        request.status = FriendRequestStatus.REJECTED;
        await manager.save(request);
      }
      return;
    }
    if (request.status === FriendRequestStatus.ACCEPTED) return;
    if (request.status !== FriendRequestStatus.PENDING) throw new DuoSocialError(ApiErrorEnum.ACTION_INVALID);
    const sender = await manager.findOne(User, request.sender_id);
    if (!sender || sender.roleId === 1) throw new DuoSocialError(ApiErrorEnum.PROFILE_INVALID);
    const friends = await manager.find(Friend, { where: [
      { user_id: request.sender_id, friend_id: request.receiver_id },
      { user_id: request.receiver_id, friend_id: request.sender_id }
    ] });
    if (friends.some(row => row.status === FriendStatus.BLOCKED)) throw new DuoSocialError(ApiErrorEnum.AUTH_INVALID_PERMISSIONS, 403);
    if (!friends.some(row => row.status === FriendStatus.ACCEPTED)) {
      await manager.save(manager.create(Friend, { user_id: request.sender_id,
        friend_id: request.receiver_id, status: FriendStatus.ACCEPTED }));
    }
    request.status = FriendRequestStatus.ACCEPTED;
    await manager.save(request);
    await manager.update(FriendRequest, { sender_id: request.receiver_id, receiver_id: request.sender_id,
      status: FriendRequestStatus.PENDING }, { status: FriendRequestStatus.ACCEPTED });
  });
}
