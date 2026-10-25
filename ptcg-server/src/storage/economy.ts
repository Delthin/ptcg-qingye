import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './model/user';

@Entity()
export class EconomyAccount extends BaseEntity {
  @PrimaryColumn() public userId!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) public user!: User;
  @Column({ type: 'int', default: 0 }) public balanceMinor: number = 0;
  @Column({ type: 'varchar', nullable: true }) public lastClaimDay: string | null = null;
}

@Entity()
export class EconomyHolding extends BaseEntity {
  @PrimaryColumn() public userId!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) public user!: User;
  @PrimaryColumn() public printingId!: string;
  @Column({ type: 'int' }) public count!: number;
  // Persist the actual printing, including unmapped effects, across catalog revisions.
  @Column({ type: 'text' }) public printingJson!: string;
}

@Entity()
export class EconomyCoin extends BaseEntity {
  @PrimaryColumn() public userId!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) public user!: User;
  @PrimaryColumn() public coinId!: string;
  @Column({ type: 'int', default: 1 }) public count: number = 1;
}

@Entity()
@Index(['userId', 'openedAt'])
export class EconomyPack extends BaseEntity {
  @PrimaryColumn() public id!: string;
  @Column() public userId!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) public user!: User;
  @Column() public productId!: string;
  @Column() public name!: string;
  // Capture the draw recipe at purchase time; do not silently change old packs.
  // 未拆封卡组用空串占位，它没有卡包配方。
  @Column({ type: 'text' }) public recipeJson!: string;
  // 未拆封预组：购买时就抽好，但拆开前不告诉玩家是哪一套，也不进收藏。
  @Column({ type: 'text', nullable: true }) public deckJson: string | null = null;
  @Column() public createdAt!: string;
  @Column({ type: 'varchar', nullable: true }) public openedAt: string | null = null;
  @Column({ type: 'varchar', nullable: true }) public openingId: string | null = null;
}

@Entity()
@Index(['userId', 'createdAt'])
export class EconomyRecord extends BaseEntity {
  @PrimaryColumn() public id!: string;
  @Column() public userId!: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) public user!: User;
  @Column() public kind!: string;
  @Column() public label!: string;
  @Column({ type: 'int', default: 0 }) public amountMinor: number = 0;
  @Column({ type: 'int', nullable: true }) public actorId: number | null = null;
  @Column({ type: 'varchar', nullable: true }) public productId: string | null = null;
  @Column({ type: 'int', default: 0 }) public quantity: number = 0;
  @Column({ type: 'text' }) public detailJson!: string;
  @Column() public createdAt!: string;
}

export const economyEntities = [EconomyAccount, EconomyHolding, EconomyCoin, EconomyPack, EconomyRecord];
