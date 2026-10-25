import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { State, StoreLike } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, SWITCH_ACTIVE_WITH_BENCHED } from '../../../game/store/prefabs/prefabs';

export class Palkia extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [W];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Teleportation Burst',
      cost: [C, C],
      damage: 30,
      text: 'You may switch this Pokémon with 1 of your Benched Pokémon.',
    },
    {
      name: 'Prize Count',
      cost: [W, C, C],
      damage: 80,
      damageCalculation: '+',
      text: 'If you have more Prize cards remaining than your opponent, this attack does 80 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '40';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Palkia';
  public fullName: string = 'Palkia PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Teleportation Burst: optionally switch this Pokémon with a Benched Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const player = effect.player;
      const hasBench = player.bench.some(benchSlot => benchSlot.cards.length > 0);

      if (hasBench) {
        state = SWITCH_ACTIVE_WITH_BENCHED(store, state, player) ?? state;
      }
    }

    // Prize Count: 80 more damage if you have more Prize cards remaining.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const player = effect.player;
      const opponent = effect.opponent;

      const playerPrizesLeft = player.prizes.reduce((total, prizeSlot) => total + prizeSlot.cards.length, 0);
      const opponentPrizesLeft = opponent.prizes.reduce((total, prizeSlot) => total + prizeSlot.cards.length, 0);

      if (playerPrizesLeft > opponentPrizesLeft) {
        effect.damage += 80;
      }
    }

    return state;
  }
}
