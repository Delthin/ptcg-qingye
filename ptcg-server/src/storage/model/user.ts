import { BaseEntity, Column, Entity, Unique, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Avatar } from './avatar';
import { Deck } from './deck';
import { Replay } from './replay';
import { Rank, rankLevels } from '../../backend/interfaces/rank.enum';
import { bigint } from '../transformers/bigint';

@Entity()
@Unique(['name'])
export class User extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public name: string = '';

  @Column()
  public email: string = '';

  @Column()
  public ranking: number = 0;

  @Column()
  public password: string = '';

  @Column({ type: 'int', default: 0 })
  public roleId: number = 0;

  @Column({ type: 'bigint', transformer: [bigint] })
  public registered: number = 0;

  @Column({ type: 'bigint', transformer: [bigint] })
  public lastSeen: number = 0;

  @Column({ type: 'bigint', transformer: [bigint] })
  public lastRankingChange: number = 0;

  @Column()
  public avatarFile: string = '';

  @Column({ nullable: true })
  public cardImagesJsonUrl: string = '';

  @Column({ nullable: true })
  public nightlyImagesJsonUrl: string = '';

  @Column({ type: 'varchar', length: 255, nullable: true })
  public activeBattlePassSeasonId: string | null = null;

  @Column({ type: 'varchar', default: 'twinleaf' })
  public equippedCoinId: string = 'twinleaf';

  /** Per-account choice; never shared through browser localStorage. */
  @Column({ type: 'int', nullable: true })
  public duoDeckId: number | null = null;

  /** Existing accounts remain public; invitation registration opts out explicitly. */
  @Column({ type: 'boolean', default: true })
  public duoPublic: boolean = true;

  @Column({ type: 'int', default: 1 })
  public onboardingVersion: number = 1;

  @Column({ type: 'varchar', default: 'done' })
  public onboardingStage: string = 'done';

  @Column({ type: 'int', default: 0 })
  public onboardingStep: number = 0;

  @Column({ type: 'text', default: '[]' })
  public onboardingActions: string = '[]';

  @OneToMany(type => Deck, deck => deck.user)
    decks!: Deck[];

  @OneToMany(type => Avatar, avatar => avatar.user)
    avatars!: Avatar[];

  @OneToMany(type => Replay, replay => replay.user)
    replays!: Replay[];

  public getRank(): Rank {
    let rank = rankLevels[0].rank;
    for (const level of rankLevels) {
      if (level.points > this.ranking) {
        break;
      }
      rank = level.rank;
    }
    return rank;
  }

  public async updateLastSeen(): Promise<this> {
    this.lastSeen = Date.now();
    await User.update(this.id, { lastSeen: this.lastSeen });
    return this;
  }
}