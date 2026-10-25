import { PokemonCard } from '../../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../../game/store/card/card-types';
import { StoreLike, State } from '../../../game';
import { Effect } from '../../../game/store/effects/effect';
import { WAS_ATTACK_USED, THIS_ATTACK_DOES_X_MORE_DAMAGE } from '../../../game/store/prefabs/prefabs';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../../game/store/prefabs/attack-effects';

export class Sableye extends PokemonCard {
  public stage: Stage = Stage.BASIC;
  public cardType: CardType[] = [D];
  public hp: number = 70;
  public weakness = [{ type: G }];
  public retreat = [C];

  public attacks = [
    {
      name: 'Night Eyes',
      cost: [C],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Asleep.',
    },
    {
      name: 'Unseen Claw',
      cost: [D],
      damage: 20,
      damageCalculation: '+',
      text: 'If your opponent\'s Active Pokémon is affected by a Special Condition, this attack does 70 more damage.',
    },
  ];

  public regulationMark = 'G';
  public set: string = 'PAL';
  public setNumber: string = '136';
  public cardImage: string = 'assets/cardback.png';
  public name: string = 'Sableye';
  public fullName: string = 'Sableye PAL';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // Night Eyes: Your opponent's Active Pokémon is now Asleep.
    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    // Unseen Claw: +70 if the opponent's Active Pokémon has a Special Condition.
    if (WAS_ATTACK_USED(effect, 1, this)) {
      const opponent = effect.opponent;
      if (opponent.active.specialConditions.length > 0) {
        THIS_ATTACK_DOES_X_MORE_DAMAGE(effect, store, state, 70);
      }
    }

    return state;
  }
}
