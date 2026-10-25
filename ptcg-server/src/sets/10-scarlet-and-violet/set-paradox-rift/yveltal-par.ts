import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON } from '../../../game/store/prefabs/costs';

export class Yveltal extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 130;
  public weakness = [{ type: L }];
  public resistance = [{ type: F, value: -30 }];
  public retreat = [C, C];

  public attacks = [
    {
      name: 'Cross-Cut',
      cost: [C, C],
      damage: 30,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is an Evolution Pokémon, this attack does 60 more damage.',
    },
    {
      name: 'Dark Edge',
      cost: [D, D, C],
      damage: 120,
      text: 'Discard an Energy from this Pokémon.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAR';
  public setNumber: string = '118';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Yveltal';
  public fullName: string = 'Yveltal PAR';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Cross-Cut: +60 damage if the opponent's Active is an Evolution Pokémon.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      const opponentActive = effect.opponent.active.getPokemonCard();

      if (opponentActive !== undefined && opponentActive.stage !== Stage.BASIC) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 60);
      }
    }

    // Dark Edge: discard an Energy from this Pokémon.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      state = DISCARD_UP_TO_X_ENERGY_FROM_THIS_POKEMON(store, state, effect, 1, {}, 1);
    }

    return state;
  }
}
